from fastapi import APIRouter, HTTPException, status
from fastapi.responses import RedirectResponse

from app.api.deps import AuthUser, DBSession
from app.models.oauth_account import OAuthAccount
from app.services.mail_providers import (
    OAuthProviderError,
    exchange_gmail_code,
    exchange_outlook_code,
    get_gmail_auth_url,
    get_outlook_auth_url,
)
from app.services.mail_security import (
    build_frontend_callback_url,
    build_state,
    encrypt_token,
    parse_state,
)

router = APIRouter()


def _serialize_account(account: OAuthAccount | None) -> dict | None:
    if account is None:
        return None
    return {
        "provider": account.provider,
        "account_email": account.account_email,
        "status": account.status,
        "is_default_for_invoicing": account.is_default_for_invoicing,
        "updated_at": account.updated_at,
    }


def _upsert_oauth_account(db: DBSession, *, owner_id: str, provider: str, token_data: dict) -> OAuthAccount:
    account = (
        db.query(OAuthAccount)
        .filter(
            OAuthAccount.owner_id == owner_id,
            OAuthAccount.provider == provider,
        )
        .first()
    )
    if account is None:
        account = OAuthAccount(
            owner_id=owner_id,
            provider=provider,
            is_default_for_invoicing=provider == "gmail",
        )
        db.add(account)

    account.account_email = token_data.get("account_email")
    account.access_token = encrypt_token(token_data.get("access_token"))
    account.refresh_token = encrypt_token(token_data.get("refresh_token"))
    account.token_expires_at = token_data.get("token_expires_at")
    account.scope = token_data.get("scope")
    account.status = token_data.get("status", "connected")
    account.last_error = None
    db.flush()
    return account


@router.get("/accounts")
def list_mail_accounts(db: DBSession, current_user: AuthUser):
    accounts = (
        db.query(OAuthAccount)
        .filter(OAuthAccount.owner_id == current_user.id)
        .order_by(OAuthAccount.provider.asc())
        .all()
    )
    return {
        "success": True,
        "accounts": [_serialize_account(account) for account in accounts],
    }


@router.post("/gmail/connect")
def connect_gmail(current_user: AuthUser):
    try:
        state = build_state(current_user.id, "gmail")
        return {"success": True, "auth_url": get_gmail_auth_url(state)}
    except OAuthProviderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/outlook/connect")
def connect_outlook(current_user: AuthUser):
    try:
        state = build_state(current_user.id, "outlook")
        return {"success": True, "auth_url": get_outlook_auth_url(state)}
    except OAuthProviderError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/gmail/callback")
def gmail_callback(code: str | None = None, state: str | None = None, error: str | None = None, db: DBSession = ...):
    if error:
        return RedirectResponse(build_frontend_callback_url("gmail", success=False, message=error))
    if not code or not state:
        return RedirectResponse(build_frontend_callback_url("gmail", success=False, message="Missing OAuth callback parameters"))
    try:
        state_payload = parse_state(state)
        token_data = exchange_gmail_code(code)
        _upsert_oauth_account(
            db,
            owner_id=str(state_payload["owner_id"]),
            provider="gmail",
            token_data=token_data,
        )
        db.commit()
        return RedirectResponse(
            build_frontend_callback_url(
                "gmail",
                success=True,
                message="Gmail connected successfully",
                email=token_data.get("account_email"),
            )
        )
    except (ValueError, OAuthProviderError) as exc:
        if db is not None:
            db.rollback()
        return RedirectResponse(build_frontend_callback_url("gmail", success=False, message=str(exc)))


@router.get("/outlook/callback")
def outlook_callback(code: str | None = None, state: str | None = None, error: str | None = None, db: DBSession = ...):
    if error:
        return RedirectResponse(build_frontend_callback_url("outlook", success=False, message=error))
    if not code or not state:
        return RedirectResponse(build_frontend_callback_url("outlook", success=False, message="Missing OAuth callback parameters"))
    try:
        state_payload = parse_state(state)
        token_data = exchange_outlook_code(code)
        _upsert_oauth_account(
            db,
            owner_id=str(state_payload["owner_id"]),
            provider="outlook",
            token_data=token_data,
        )
        db.commit()
        return RedirectResponse(
            build_frontend_callback_url(
                "outlook",
                success=True,
                message="Outlook connected successfully",
                email=token_data.get("account_email"),
            )
        )
    except (ValueError, OAuthProviderError) as exc:
        if db is not None:
            db.rollback()
        return RedirectResponse(build_frontend_callback_url("outlook", success=False, message=str(exc)))


@router.delete("/gmail/disconnect", status_code=status.HTTP_200_OK)
def disconnect_gmail(db: DBSession, current_user: AuthUser):
    account = (
        db.query(OAuthAccount)
        .filter(
            OAuthAccount.owner_id == current_user.id,
            OAuthAccount.provider == "gmail",
        )
        .first()
    )
    if account:
        db.delete(account)
        db.commit()
    return {"success": True, "message": "Gmail disconnected"}


@router.delete("/outlook/disconnect", status_code=status.HTTP_200_OK)
def disconnect_outlook(db: DBSession, current_user: AuthUser):
    account = (
        db.query(OAuthAccount)
        .filter(
            OAuthAccount.owner_id == current_user.id,
            OAuthAccount.provider == "outlook",
        )
        .first()
    )
    if account:
        db.delete(account)
        db.commit()
    return {"success": True, "message": "Outlook disconnected"}
