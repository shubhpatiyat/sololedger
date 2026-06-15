import base64
import hashlib
import hmac
import json
import time
from urllib.parse import quote, urlencode

from cryptography.fernet import Fernet, InvalidToken

from app.core.config import settings


def _fernet() -> Fernet:
    key = base64.urlsafe_b64encode(hashlib.sha256(settings.token_encryption_secret.encode("utf-8")).digest())
    return Fernet(key)


def encrypt_token(value: str | None) -> str | None:
    if not value:
        return None
    return _fernet().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_token(value: str | None) -> str | None:
    if not value:
        return None
    try:
        return _fernet().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return None


def build_state(owner_id: str, provider: str) -> str:
    payload = {
        "owner_id": owner_id,
        "provider": provider,
        "ts": int(time.time()),
    }
    payload_json = json.dumps(payload, separators=(",", ":"), sort_keys=True)
    payload_encoded = base64.urlsafe_b64encode(payload_json.encode("utf-8")).decode("utf-8")
    signature = hmac.new(
        settings.oauth_state_secret.encode("utf-8"),
        payload_encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload_encoded}.{signature}"


def parse_state(state: str, max_age_seconds: int = 600) -> dict[str, str | int]:
    payload_encoded, signature = state.split(".", 1)
    expected_signature = hmac.new(
        settings.oauth_state_secret.encode("utf-8"),
        payload_encoded.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid OAuth state signature")

    payload_json = base64.urlsafe_b64decode(payload_encoded.encode("utf-8")).decode("utf-8")
    payload = json.loads(payload_json)
    now = int(time.time())
    issued_at = int(payload.get("ts", 0))
    if issued_at <= 0 or now - issued_at > max_age_seconds:
        raise ValueError("OAuth state expired")
    return payload


def build_frontend_callback_url(provider: str, *, success: bool, message: str, email: str | None = None) -> str:
    params = {
        "provider": provider,
        "status": "success" if success else "error",
        "message": message,
    }
    if email:
        params["email"] = email
    return f"{settings.frontend_base_url.rstrip('/')}/mail-oauth/callback?{urlencode(params, quote_via=quote)}"
