import mimetypes
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse, Response

from app.api.deps import AuthUser, DBSession
from app.core.config import settings
from app.models.invoice_template import InvoiceTemplate
from app.schemas.invoice_template import InvoiceTemplateRead, InvoiceTemplateUpsert

router = APIRouter()


def _default_template_payload() -> dict:
    return {
        "version": 1,
        "branding": {
            "logo_url": None,
            "logo_path": None,
            "brand_color": "#2F80ED",
            "font_family": "modern",
        },
        "layout": {
            "style": "standard",
            "show_fields": {
                "notes": True,
                "payment_details": True,
                "due_date": True,
                "tax_breakdown": True,
            },
        },
        "labels": {
            "invoice_title": "TAX INVOICE",
            "balance_due_label": "Balance due",
        },
        "defaults": {
            "notes": "Thanks for your business.",
            "terms": "Payment due on receipt.",
        },
    }


def _logo_storage_dir(user_id: str) -> Path:
    storage_dir = Path(settings.local_invoice_logo_storage_dir).expanduser().resolve() / user_id
    storage_dir.mkdir(parents=True, exist_ok=True)
    return storage_dir


def _cleanup_orphan_logo_files(user_id: str, keep_logo_path: str | None) -> None:
    storage_dir = _logo_storage_dir(user_id)
    keep_path = Path(keep_logo_path).resolve() if keep_logo_path else None

    for file_path in storage_dir.glob("*"):
        if not file_path.is_file():
            continue
        if keep_path and file_path.resolve() == keep_path:
            continue
        file_path.unlink(missing_ok=True)


def _get_or_create_default_template(db: DBSession, user_id: str) -> InvoiceTemplate:
    template = (
        db.query(InvoiceTemplate)
        .filter(InvoiceTemplate.user_id == user_id, InvoiceTemplate.is_default.is_(True))
        .first()
    )
    if template:
        return template

    template = InvoiceTemplate(
        user_id=user_id,
        name="Default",
        is_default=True,
        template_json=_default_template_payload(),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/default", response_model=InvoiceTemplateRead)
def get_default_template(db: DBSession, current_user: AuthUser):
    return _get_or_create_default_template(db, current_user.id)


@router.put("/default", response_model=InvoiceTemplateRead, status_code=status.HTTP_200_OK)
def upsert_default_template(payload: InvoiceTemplateUpsert, db: DBSession, current_user: AuthUser):
    template = _get_or_create_default_template(db, current_user.id)
    incoming_json = dict(payload.template_json or {})
    branding = dict(incoming_json.get("branding") or {})

    # Prevent data-url logo blobs from being stored in template JSON.
    if str(branding.get("logo_url") or "").startswith("data:"):
        existing_branding = dict((template.template_json or {}).get("branding") or {})
        branding["logo_url"] = existing_branding.get("logo_url")
        branding["logo_path"] = existing_branding.get("logo_path")
    incoming_json["branding"] = branding

    template.name = payload.name or template.name
    template.template_json = incoming_json

    db.commit()
    db.refresh(template)
    return template


@router.post("/default/logo", response_model=InvoiceTemplateRead)
def upload_default_template_logo(
    request: Request,
    file: UploadFile,
    db: DBSession,
    current_user: AuthUser,
):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image files are supported")

    template = _get_or_create_default_template(db, current_user.id)
    suffix = (Path(file.filename or "").suffix or ".png").lower()
    storage_dir = _logo_storage_dir(current_user.id)
    destination = storage_dir / f"default-logo-{uuid4().hex[:12]}{suffix}"

    with destination.open("wb") as output:
        shutil.copyfileobj(file.file, output)

    template_json = dict(template.template_json or {})
    branding = dict(template_json.get("branding") or {})
    branding["logo_path"] = str(destination)
    branding["logo_url"] = str(request.url_for("get_default_template_logo"))
    template_json["branding"] = branding
    template.template_json = template_json
    db.commit()
    _cleanup_orphan_logo_files(current_user.id, str(destination))
    db.refresh(template)
    return template


@router.get("/default/logo", name="get_default_template_logo")
def get_default_template_logo(db: DBSession, current_user: AuthUser):
    template = (
        db.query(InvoiceTemplate)
        .filter(InvoiceTemplate.user_id == current_user.id, InvoiceTemplate.is_default.is_(True))
        .first()
    )
    if not template:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    branding = dict((template.template_json or {}).get("branding") or {})
    logo_path = branding.get("logo_path")
    if not logo_path:
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    file_path = Path(logo_path)
    if not file_path.exists():
        # Auto-heal stale template metadata if file was removed manually.
        branding["logo_path"] = None
        branding["logo_url"] = None
        template_json = dict(template.template_json or {})
        template_json["branding"] = branding
        template.template_json = template_json
        db.commit()
        return Response(status_code=status.HTTP_204_NO_CONTENT)

    media_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    return FileResponse(path=str(file_path), media_type=media_type, filename=file_path.name)
