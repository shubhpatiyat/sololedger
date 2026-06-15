import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.core.config import settings
from app.models.user import User


ALGORITHM = "HS256"


def _password_secret() -> str:
    return settings.auth_password_secret or settings.auth_jwt_secret or "sololedger-dev-password-secret"


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    password_bytes = f"{_password_secret()}::{password}".encode("utf-8")
    digest = hashlib.pbkdf2_hmac("sha256", password_bytes, salt, 390000)
    return f"pbkdf2_sha256${base64.b64encode(salt).decode()}${base64.b64encode(digest).decode()}"


def verify_password(password: str, password_hash: str) -> bool:
    try:
        scheme, salt_b64, digest_b64 = password_hash.split("$", 2)
    except ValueError:
        return False

    if scheme != "pbkdf2_sha256":
        return False

    salt = base64.b64decode(salt_b64.encode())
    expected_digest = base64.b64decode(digest_b64.encode())
    password_bytes = f"{_password_secret()}::{password}".encode("utf-8")
    actual_digest = hashlib.pbkdf2_hmac("sha256", password_bytes, salt, 390000)
    return hmac.compare_digest(actual_digest, expected_digest)


def _jwt_secret() -> str:
    return settings.auth_jwt_secret or settings.supabase_jwt_secret or "sololedger-dev-jwt-secret"


def _build_token(subject: str, token_type: str, expires_delta: timedelta, email: str | None = None) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": subject,
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + expires_delta).timestamp()),
    }
    if email:
        payload["email"] = email
    if settings.supabase_audience:
        payload["aud"] = settings.supabase_audience
    return jwt.encode(payload, _jwt_secret(), algorithm=ALGORITHM)


def create_access_token(user: User) -> str:
    return _build_token(
        subject=user.id,
        token_type="access",
        expires_delta=timedelta(minutes=settings.auth_access_token_expiry_minutes),
        email=user.email,
    )


def create_refresh_token(user: User) -> str:
    return _build_token(
        subject=user.id,
        token_type="refresh",
        expires_delta=timedelta(days=settings.auth_refresh_token_expiry_days),
        email=user.email,
    )


def create_password_reset_token(user: User) -> str:
    return _build_token(
        subject=user.id,
        token_type="password_reset",
        expires_delta=timedelta(minutes=30),
        email=user.email,
    )


def create_email_verification_token(user: User) -> str:
    return _build_token(
        subject=user.id,
        token_type="email_verification",
        expires_delta=timedelta(hours=24),
        email=user.email,
    )


def decode_token(token: str) -> dict:
    return jwt.decode(
        token,
        _jwt_secret(),
        algorithms=[ALGORITHM],
        audience=settings.supabase_audience,
        options={"verify_aud": False if not settings.supabase_audience else True},
    )


def validate_refresh_token(token: str) -> dict:
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise ValueError("Invalid refresh token") from exc

    if payload.get("type") != "refresh":
        raise ValueError("Invalid refresh token")

    return payload


def validate_password_reset_token(token: str) -> dict:
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise ValueError("Invalid reset token") from exc

    if payload.get("type") != "password_reset":
        raise ValueError("Invalid reset token")

    return payload


def validate_email_verification_token(token: str) -> dict:
    try:
        payload = decode_token(token)
    except JWTError as exc:
        raise ValueError("Invalid verification token") from exc

    if payload.get("type") != "email_verification":
        raise ValueError("Invalid verification token")

    return payload


def get_user_display_name(user: User) -> str | None:
    full_name = " ".join(part for part in [user.first_name, user.last_name] if part)
    return full_name or None
