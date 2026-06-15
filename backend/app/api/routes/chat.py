from pathlib import Path

from fastapi import APIRouter, File, HTTPException, Request, UploadFile, status
from fastapi.responses import FileResponse
from uuid import uuid4

from app.api.deps import AuthUser, DBSession
from app.models.chat import Chat
from app.models.client import Client
from app.models.conversation import Conversation
from app.models.uploaded_bill_file import UploadedBillFile
from app.schemas.chat import ChatCreate, ChatRead, ConversationRead, UploadedBillFileRead
from app.services.bill_files import extract_text_from_bill_file, save_uploaded_bill_file
from app.services.chat_service import create_chat_turn

router = APIRouter()


def _build_attachment_file_url(request: Request, file_id: str) -> str:
    return str(request.url_for("get_attachment_file", file_id=file_id))


def _serialize_attachment(request: Request, upload: UploadedBillFile) -> UploadedBillFileRead:
    return UploadedBillFileRead(
        id=upload.id,
        created_at=upload.created_at,
        updated_at=upload.updated_at,
        conversation_id=upload.conversation_id,
        bill_id=upload.bill_id,
        file_name=upload.original_file_name,
        content_type=upload.content_type,
        file_url=_build_attachment_file_url(request, upload.id),
    )


@router.get("/conversations", response_model=list[ConversationRead])
def list_conversations(db: DBSession, current_user: AuthUser):
    return (
        db.query(Conversation)
        .filter(Conversation.owner_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@router.get("/conversations/{conversation_id}/messages", response_model=list[ChatRead])
def list_chats(conversation_id: str, request: Request, db: DBSession, current_user: AuthUser):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.owner_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    chats = (
        db.query(Chat)
        .filter(Chat.conversation_id == conversation_id)
        .order_by(Chat.created_at.asc())
        .all()
    )

    attachments = (
        db.query(UploadedBillFile)
        .filter(
            UploadedBillFile.conversation_id == conversation_id,
            UploadedBillFile.bill_id.is_(None),
        )
        .order_by(UploadedBillFile.created_at.asc())
        .all()
    )
    serialized_attachments = [_serialize_attachment(request, attachment) for attachment in attachments]
    latest_chat_id = chats[-1].id if chats else None

    return [
        ChatRead(
            id=chat.id,
            created_at=chat.created_at,
            updated_at=chat.updated_at,
            conversation_id=chat.conversation_id,
            user_message=chat.user_message,
            assistant_message=chat.assistant_message,
            attachments=serialized_attachments if latest_chat_id and chat.id == latest_chat_id else [],
        )
        for chat in chats
    ]


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: str, db: DBSession, current_user: AuthUser):
    conversation = (
        db.query(Conversation)
        .filter(Conversation.id == conversation_id, Conversation.owner_id == current_user.id)
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    db.delete(conversation)
    db.commit()
    return None


@router.post("/message", response_model=ChatRead, status_code=status.HTTP_201_CREATED)
def create_message(payload: ChatCreate, db: DBSession, current_user: AuthUser):
    client = db.query(Client).filter(Client.id == payload.client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    return create_chat_turn(
        db=db,
        client=client,
        owner_id=current_user.id,
        user_message=payload.user_message,
    )


@router.post("/upload-attachment-file/{client_id}/{conversation_id}/", status_code=status.HTTP_201_CREATED)
async def upload_attachment_file(
    request: Request,
    client_id: str,
    conversation_id: str,
    db: DBSession,
    current_user: AuthUser,
    files: list[UploadFile] = File(...),
):
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.owner_id == current_user.id)
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.client_id == client_id,
            Conversation.owner_id == current_user.id,
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    uploaded_items: list[dict[str, str]] = []

    for file in files:
        upload_id = str(uuid4())
        file_path = save_uploaded_bill_file(
            owner_id=current_user.id,
            conversation_id=conversation.id,
            upload_id=upload_id,
            original_file_name=file.filename or upload_id,
            file_stream=file.file,
        )
        extracted_text = extract_text_from_bill_file(str(file_path))
        upload = UploadedBillFile(
            id=upload_id,
            conversation_id=conversation.id,
            original_file_name=file.filename or Path(file_path).name,
            file_path=str(file_path),
            content_type=file.content_type,
            extracted_text=extracted_text or None,
        )
        db.add(upload)
        uploaded_items.append(
            {
                "file_name": upload.original_file_name,
                "ds_id": upload.id,
                "file_url": _build_attachment_file_url(request, upload.id),
                "content_type": upload.content_type or "",
            }
        )

    db.commit()
    return {
        "success": True,
        "files_info": uploaded_items,
        "conversation_id": conversation.id,
    }


@router.delete("/delete-attachment-file/{client_id}/{conversation_id}/{ds_id}/")
def delete_attachment_file(
    client_id: str,
    conversation_id: str,
    ds_id: str,
    db: DBSession,
    current_user: AuthUser,
):
    client = (
        db.query(Client)
        .filter(Client.id == client_id, Client.owner_id == current_user.id)
        .first()
    )
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    conversation = (
        db.query(Conversation)
        .filter(
            Conversation.id == conversation_id,
            Conversation.client_id == client_id,
            Conversation.owner_id == current_user.id,
        )
        .first()
    )
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversation not found")

    upload = (
        db.query(UploadedBillFile)
        .filter(
            UploadedBillFile.id == ds_id,
            UploadedBillFile.conversation_id == conversation.id,
            UploadedBillFile.bill_id.is_(None),
        )
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = Path(upload.file_path)
    if file_path.exists():
        file_path.unlink()

    db.delete(upload)
    db.commit()
    return {"success": True}


@router.get("/attachment-file/{file_id}", name="get_attachment_file")
def get_attachment_file(file_id: str, db: DBSession, current_user: AuthUser):
    upload = (
        db.query(UploadedBillFile)
        .filter(
            UploadedBillFile.id == file_id,
            UploadedBillFile.conversation_id.in_(
                db.query(Conversation.id).filter(Conversation.owner_id == current_user.id)
            ),
        )
        .first()
    )
    if not upload:
        raise HTTPException(status_code=404, detail="Attachment not found")

    file_path = Path(upload.file_path)
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Attachment file missing")

    return FileResponse(
        path=file_path,
        media_type=upload.content_type or "application/octet-stream",
        filename=upload.original_file_name,
    )
