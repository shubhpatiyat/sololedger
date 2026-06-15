import logging
from datetime import timedelta

from fastapi import APIRouter, HTTPException, Request, Response, status
from fastapi.responses import JSONResponse

from app.api.deps import DBSession
from app.models.category import Category
from app.models.client import Client
from app.models.conversation import Conversation
from app.models.email_draft import EmailDraft
from app.models.oauth_account import OAuthAccount
from app.models.user import User
from app.schemas.auth import (
    AuthUserResponse,
    ForgotPasswordRequest,
    ForgotPasswordResponse,
    LoginRequest,
    LoginResponse,
    RefreshTokenResponse,
    SignUpRequest,
    SignUpResponse,
    UpdatePasswordRequest,
)
from app.services.auth import (
    create_email_verification_token,
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    get_user_display_name,
    hash_password,
    validate_email_verification_token,
    validate_password_reset_token,
    validate_refresh_token,
    verify_password,
)
from app.core.config import settings
from app.services.notification_email import send_email_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth")
LEGACY_OWNER_ID = "demo-user"
logger = logging.getLogger(__name__)


def _set_refresh_cookie(response: Response, refresh_token: str) -> None:
    response.set_cookie(
        key=settings.auth_refresh_cookie_name,
        value=refresh_token,
        httponly=True,
        secure=settings.auth_cookie_secure,
        samesite="lax",
        max_age=int(timedelta(days=settings.auth_refresh_token_expiry_days).total_seconds()),
        path="/",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=settings.auth_refresh_cookie_name, path="/", samesite="lax")


def _serialize_user(user: User) -> AuthUserResponse:
    return AuthUserResponse(id=user.id, email=user.email, name=get_user_display_name(user))


def _build_auth_response(user: User) -> tuple[str, str]:
    access_token = create_access_token(user)
    refresh_token = create_refresh_token(user)
    return access_token, refresh_token


def _normalize_name(name: str | None) -> str | None:
    if name is None:
        return None
    cleaned = name.strip()
    return cleaned or None


def _migrate_legacy_owner_records(db: DBSession, user: User) -> None:
    if user.id == LEGACY_OWNER_ID:
        return

    if db.query(Client).filter(Client.owner_id == user.id).first():
        return

    legacy_client = db.query(Client).filter(Client.owner_id == LEGACY_OWNER_ID).first()
    legacy_category = db.query(Category).filter(Category.owner_id == LEGACY_OWNER_ID).first()
    legacy_oauth = db.query(OAuthAccount).filter(OAuthAccount.owner_id == LEGACY_OWNER_ID).first()
    legacy_conversation = db.query(Conversation).filter(Conversation.owner_id == LEGACY_OWNER_ID).first()
    legacy_draft = db.query(EmailDraft).filter(EmailDraft.owner_id == LEGACY_OWNER_ID).first()

    if not any([legacy_client, legacy_category, legacy_oauth, legacy_conversation, legacy_draft]):
        return

    db.query(Client).filter(Client.owner_id == LEGACY_OWNER_ID).update(
        {Client.owner_id: user.id},
        synchronize_session=False,
    )
    db.query(Category).filter(Category.owner_id == LEGACY_OWNER_ID).update(
        {Category.owner_id: user.id},
        synchronize_session=False,
    )
    db.query(OAuthAccount).filter(OAuthAccount.owner_id == LEGACY_OWNER_ID).update(
        {OAuthAccount.owner_id: user.id},
        synchronize_session=False,
    )
    db.query(Conversation).filter(Conversation.owner_id == LEGACY_OWNER_ID).update(
        {Conversation.owner_id: user.id},
        synchronize_session=False,
    )
    db.query(EmailDraft).filter(EmailDraft.owner_id == LEGACY_OWNER_ID).update(
        {EmailDraft.owner_id: user.id},
        synchronize_session=False,
    )
    db.commit()


@router.post("/eu/signup/", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
@router.post("/signup/", response_model=SignUpResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignUpRequest, db: DBSession):
    email = payload.email.lower().strip()
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already registered")

    user = User(
        email=email,
        password_hash=hash_password(payload.password),
        first_name=_normalize_name(payload.first_name) or email.split("@", 1)[0],
        last_name=_normalize_name(payload.last_name),
        is_active=False,
    )
    db.add(user)

    try:
        db.flush()
        verification_token = create_email_verification_token(user)
        verify_url = f"{settings.frontend_base_url.rstrip('/')}/verify-email/{verification_token}"
        send_email_verification_email(to_email=user.email, verify_url=verify_url)
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.exception("Failed to send signup verification email", extra={"email": email})
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to send verification email. Please try again.",
        ) from exc

    return SignUpResponse(
        message="Signup successful. Please check your email to verify your account.",
        email=user.email,
        verification_email_sent=True,
    )


@router.post("/eu/login/", response_model=LoginResponse)
def login(payload: LoginRequest, db: DBSession):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is inactive")

    _migrate_legacy_owner_records(db, user)

    access_token, refresh_token = _build_auth_response(user)
    response = JSONResponse(
        content=LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            user=_serialize_user(user),
        ).model_dump()
    )
    _set_refresh_cookie(response, refresh_token)
    return response


@router.post("/token/refresh", response_model=RefreshTokenResponse)
@router.post("/refresh", response_model=RefreshTokenResponse)
def refresh_token(request: Request, db: DBSession):
    refresh_token_value = request.cookies.get(settings.auth_refresh_cookie_name)
    if not refresh_token_value:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token")

    try:
        payload = validate_refresh_token(refresh_token_value)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token, refresh_token = _build_auth_response(user)
    response = JSONResponse(
        content=RefreshTokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
        ).model_dump()
    )
    _set_refresh_cookie(response, refresh_token)
    return response


@router.post("/logout")
def logout():
    response = JSONResponse(content={"success": True, "message": "Logged out"})
    _clear_refresh_cookie(response)
    return response


@router.post("/forgot-password/", response_model=ForgotPasswordResponse)
def forgot_password(payload: ForgotPasswordRequest, db: DBSession):
    email = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        # Avoid leaking whether the account exists.
        return ForgotPasswordResponse(
            message="If an account with that email exists, a reset link has been sent.",
        )

    reset_token = create_password_reset_token(user)
    reset_url = f"{settings.frontend_base_url.rstrip('/')}/reset-password/{reset_token}"
    try:
        send_password_reset_email(to_email=email, reset_url=reset_url)
    except Exception:
        # Keep response generic to avoid email enumeration.
        logger.exception("Failed to send password reset email", extra={"email": email})

    return ForgotPasswordResponse(
        message="If an account with that email exists, a reset link has been sent.",
    )


@router.post("/verify-email/{token}/")
def verify_email(token: str, db: DBSession):
    try:
        token_payload = validate_email_verification_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = db.query(User).filter(User.id == token_payload.get("sub")).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_active:
        return {
            "success": True,
            "status": 200,
            "message": "Email is already verified. Please sign in.",
        }

    user.is_active = True
    db.add(user)
    db.commit()

    return {
        "success": True,
        "status": 200,
        "message": "Email verified successfully. You can now sign in.",
    }


@router.post("/reset-password/{token}/")
def reset_password_with_token(token: str, payload: UpdatePasswordRequest, db: DBSession):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match")

    try:
        token_payload = validate_password_reset_token(token)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc

    user = db.query(User).filter(User.id == token_payload.get("sub")).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.password_hash = hash_password(payload.new_password)
    db.add(user)
    db.commit()

    return {
        "success": True,
        "status": 200,
        "message": "Password updated successfully. Please log in with your new password.",
    }
