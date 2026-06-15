import logging
import os

import resend

from app.core.config import settings

logger = logging.getLogger(__name__)


def _get_api_key() -> str:
    return settings.smtp_api_key or os.getenv("SMTP_API_KEY", "")


def _send_html_email(*, to_email: str, subject: str, html: str) -> None:
    api_key = _get_api_key()
    if not api_key:
        raise RuntimeError("SMTP_API_KEY is not configured")

    resend.api_key = api_key
    resend.Emails.send(
        {
            "from": settings.smtp_from_email,
            "to": to_email,
            "subject": subject,
            "html": html,
        }
    )


def send_password_reset_email(*, to_email: str, reset_url: str) -> None:
    html = (
        "<p>We received a request to reset your password.</p>"
        f"<p><a href=\"{reset_url}\">Reset your password</a></p>"
        "<p>If you did not request this, you can safely ignore this email.</p>"
    )
    _send_html_email(
        to_email=to_email,
        subject="Reset your SoloLedger password",
        html=html,
    )


def send_email_verification_email(*, to_email: str, verify_url: str) -> None:
    html = (
        "<p>Welcome to SoloLedger.</p>"
        f"<p><a href=\"{verify_url}\">Verify your email address</a></p>"
        "<p>Please verify your email before signing in.</p>"
    )
    _send_html_email(
        to_email=to_email,
        subject="Verify your SoloLedger account",
        html=html,
    )
