import json
from base64 import b64encode, urlsafe_b64encode
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.core.config import settings
from app.models.oauth_account import OAuthAccount
from app.models.uploaded_bill_file import UploadedBillFile
from app.services.invoice_pdf import EmailAttachmentFile
from app.services.mail_security import decrypt_token, encrypt_token


class OAuthProviderError(Exception):
    pass


def _json_request(
    url: str,
    *,
    method: str = "GET",
    headers: dict[str, str] | None = None,
    data: dict | None = None,
    json_data: dict | None = None,
) -> dict:
    request_headers = {"Accept": "application/json", **(headers or {})}
    payload = None
    if json_data is not None:
        payload = json.dumps(json_data).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")
    elif data is not None:
        payload = urlencode(data).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/x-www-form-urlencoded")

    request = Request(url, data=payload, headers=request_headers, method=method)
    try:
        with urlopen(request, timeout=15) as response:
            content = response.read().decode("utf-8")
            return json.loads(content) if content else {}
    except HTTPError as exc:
        details = exc.read().decode("utf-8", errors="ignore")
        raise OAuthProviderError(details or f"Provider request failed with status {exc.code}") from exc
    except URLError as exc:
        raise OAuthProviderError("Could not reach OAuth provider") from exc


def _iso_expiry(expires_in: int | None) -> datetime | None:
    if not expires_in:
        return None
    return datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))


def get_gmail_auth_url(state: str) -> str:
    if not settings.google_client_id or not settings.google_redirect_uri:
        raise OAuthProviderError("Google OAuth is not configured")
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile https://www.googleapis.com/auth/gmail.compose",
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
        }
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


def exchange_gmail_code(code: str) -> dict:
    if not settings.google_client_id or not settings.google_client_secret or not settings.google_redirect_uri:
        raise OAuthProviderError("Google OAuth is not configured")
    token_data = _json_request(
        "https://oauth2.googleapis.com/token",
        method="POST",
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    access_token = token_data.get("access_token")
    if not access_token:
        raise OAuthProviderError("Google token response did not include an access token")
    profile = _json_request(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    return {
        "account_email": profile.get("email"),
        "access_token": access_token,
        "refresh_token": token_data.get("refresh_token"),
        "token_expires_at": _iso_expiry(token_data.get("expires_in")),
        "scope": token_data.get("scope"),
        "status": "connected",
    }


def get_outlook_auth_url(state: str) -> str:
    if not settings.microsoft_client_id or not settings.microsoft_redirect_uri:
        raise OAuthProviderError("Microsoft OAuth is not configured")
    query = urlencode(
        {
            "client_id": settings.microsoft_client_id,
            "redirect_uri": settings.microsoft_redirect_uri,
            "response_type": "code",
            "response_mode": "query",
            "scope": "openid email profile offline_access Mail.ReadWrite",
            "state": state,
        }
    )
    return f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?{query}"


def exchange_outlook_code(code: str) -> dict:
    if not settings.microsoft_client_id or not settings.microsoft_client_secret or not settings.microsoft_redirect_uri:
        raise OAuthProviderError("Microsoft OAuth is not configured")
    token_data = _json_request(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        method="POST",
        data={
            "client_id": settings.microsoft_client_id,
            "client_secret": settings.microsoft_client_secret,
            "redirect_uri": settings.microsoft_redirect_uri,
            "code": code,
            "grant_type": "authorization_code",
            "scope": "openid email profile offline_access Mail.ReadWrite",
        },
    )
    access_token = token_data.get("access_token")
    if not access_token:
        raise OAuthProviderError("Microsoft token response did not include an access token")
    profile = _json_request(
        "https://graph.microsoft.com/v1.0/me",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    return {
        "account_email": profile.get("mail") or profile.get("userPrincipalName"),
        "access_token": access_token,
        "refresh_token": token_data.get("refresh_token"),
        "token_expires_at": _iso_expiry(token_data.get("expires_in")),
        "scope": token_data.get("scope"),
        "status": "connected",
    }


def _should_refresh_token(account: OAuthAccount) -> bool:
    if not account.token_expires_at:
        return False
    expires_at = account.token_expires_at
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    return expires_at <= datetime.now(timezone.utc) + timedelta(minutes=5)


def _refresh_gmail_token(refresh_token: str) -> dict:
    if not settings.google_client_id or not settings.google_client_secret:
        raise OAuthProviderError("Google OAuth is not configured")
    return _json_request(
        "https://oauth2.googleapis.com/token",
        method="POST",
        data={
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
        },
    )


def _refresh_outlook_token(refresh_token: str) -> dict:
    if not settings.microsoft_client_id or not settings.microsoft_client_secret:
        raise OAuthProviderError("Microsoft OAuth is not configured")
    return _json_request(
        "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        method="POST",
        data={
            "client_id": settings.microsoft_client_id,
            "client_secret": settings.microsoft_client_secret,
            "refresh_token": refresh_token,
            "grant_type": "refresh_token",
            "scope": "openid email profile offline_access Mail.ReadWrite",
        },
    )


def ensure_valid_access_token(account: OAuthAccount) -> str:
    access_token = decrypt_token(account.access_token)
    if access_token and not _should_refresh_token(account):
        return access_token

    refresh_token = decrypt_token(account.refresh_token)
    if not refresh_token:
        raise OAuthProviderError(f"{account.provider.capitalize()} account needs to be reconnected")

    if account.provider == "gmail":
        token_data = _refresh_gmail_token(refresh_token)
    elif account.provider == "outlook":
        token_data = _refresh_outlook_token(refresh_token)
    else:
        raise OAuthProviderError(f"Unsupported mail provider: {account.provider}")

    new_access_token = token_data.get("access_token")
    if not new_access_token:
        raise OAuthProviderError(f"{account.provider.capitalize()} token refresh did not return an access token")

    account.access_token = encrypt_token(new_access_token)
    if token_data.get("refresh_token"):
        account.refresh_token = encrypt_token(token_data["refresh_token"])
    account.token_expires_at = _iso_expiry(token_data.get("expires_in"))
    account.scope = token_data.get("scope") or account.scope
    account.status = "connected"
    account.last_error = None
    return new_access_token


def _load_attachment_payload(attachment: UploadedBillFile | EmailAttachmentFile) -> tuple[str, str, bytes]:
    file_path = Path(attachment.file_path)
    if not file_path.exists():
        raise OAuthProviderError(f'Attachment file "{attachment.original_file_name}" is missing')
    content_type = attachment.content_type or "application/octet-stream"
    return attachment.original_file_name, content_type, file_path.read_bytes()


def _encode_gmail_message(
    recipient_email: str,
    subject: str,
    body: str,
    attachments: list[UploadedBillFile | EmailAttachmentFile],
) -> str:
    message = EmailMessage()
    message["To"] = recipient_email
    message["Subject"] = subject
    message.set_content(body)

    for attachment in attachments:
        file_name, content_type, file_bytes = _load_attachment_payload(attachment)
        maintype, subtype = content_type.split("/", 1) if "/" in content_type else ("application", "octet-stream")
        message.add_attachment(
            file_bytes,
            maintype=maintype,
            subtype=subtype,
            filename=file_name,
        )

    return urlsafe_b64encode(message.as_bytes()).decode("utf-8").rstrip("=")


def create_gmail_draft(
    *,
    access_token: str,
    recipient_email: str,
    subject: str,
    body: str,
    attachments: list[UploadedBillFile | EmailAttachmentFile],
) -> str:
    response = _json_request(
        "https://gmail.googleapis.com/gmail/v1/users/me/drafts",
        method="POST",
        headers={"Authorization": f"Bearer {access_token}"},
        json_data={
            "message": {
                "raw": _encode_gmail_message(recipient_email, subject, body, attachments),
            }
        },
    )
    draft_id = response.get("id")
    if not draft_id:
        raise OAuthProviderError("Gmail draft creation did not return a draft ID")
    return draft_id


def create_outlook_draft(
    *,
    access_token: str,
    recipient_email: str,
    subject: str,
    body: str,
    attachments: list[UploadedBillFile | EmailAttachmentFile],
) -> str:
    graph_attachments = []
    for attachment in attachments:
        file_name, content_type, file_bytes = _load_attachment_payload(attachment)
        graph_attachments.append(
            {
                "@odata.type": "#microsoft.graph.fileAttachment",
                "name": file_name,
                "contentType": content_type,
                "contentBytes": b64encode(file_bytes).decode("utf-8"),
            }
        )

    response = _json_request(
        "https://graph.microsoft.com/v1.0/me/messages",
        method="POST",
        headers={"Authorization": f"Bearer {access_token}"},
        json_data={
            "subject": subject,
            "body": {
                "contentType": "Text",
                "content": body,
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": recipient_email,
                    }
                }
            ],
            "attachments": graph_attachments,
        },
    )
    draft_id = response.get("id")
    if not draft_id:
        raise OAuthProviderError("Outlook draft creation did not return a draft ID")
    return draft_id
