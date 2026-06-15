import json
import logging
from uuid import uuid4

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.exc import SQLAlchemyError

from app.api.deps import get_current_user_from_token
from app.db.session import SessionLocal
from app.models.conversation import Conversation
from app.services.chat_service import create_chat_turn_for_conversation

router = APIRouter()
logger = logging.getLogger(__name__)


def _chunk_text(content: str, chunk_size: int = 80) -> list[str]:
    if not content:
        return [""]
    return [content[i : i + chunk_size] for i in range(0, len(content), chunk_size)]


async def _handle_chat_message(websocket: WebSocket, owner_id: str, payload: dict):
    conversation_id = payload.get("conversation_id")
    user_message = (payload.get("query") or "").strip()
    files_info = payload.get("files_info") or []
    uploaded_file_ids = [
        str(file_info.get("ds_id"))
        for file_info in files_info
        if isinstance(file_info, dict) and file_info.get("ds_id")
    ]

    if not conversation_id:
        await websocket.send_json({"t": "e", "m": "conversation_id is required"})
        return

    if not user_message and not uploaded_file_ids:
        await websocket.send_json({"t": "e", "m": "query is required"})
        return

    db = SessionLocal()
    try:
        try:
            conversation = (
                db.query(Conversation)
                .filter(Conversation.id == conversation_id, Conversation.owner_id == owner_id)
                .first()
            )
            if not conversation:
                await websocket.send_json({"t": "e", "m": "Conversation not found"})
                return

            client = conversation.client
            if client is None:
                await websocket.send_json({"t": "e", "m": "Client not found for conversation"})
                return

            chat_id = str(uuid4())
            await websocket.send_json({"conversation_id": conversation.id, "message_id": chat_id})

            chat = create_chat_turn_for_conversation(
                db=db,
                conversation=conversation,
                owner_id=owner_id,
                user_message=user_message or "Uploaded a bill for OCR",
                uploaded_file_ids=uploaded_file_ids,
                chat_id=chat_id,
            )
        except SQLAlchemyError:
            db.rollback()
            logger.exception(
                "Database error while handling websocket chat message",
                extra={"conversation_id": conversation_id, "owner_id": owner_id},
            )
            await websocket.send_json(
                {"t": "e", "m": "Database connection lost. Please retry your message."}
            )
            return

        for chunk in _chunk_text(chat.assistant_message or ""):
            await websocket.send_json({"t": "v", "m": chunk, "message_id": chat_id})

        await websocket.send_json({"t": "c", "message_id": chat_id})
    finally:
        db.close()


@router.websocket("/eu/chat-response/")
async def chat_response_websocket(
    websocket: WebSocket,
    token: str | None = Query(default=None),
):
    try:
        user = get_current_user_from_token(
            token=token, x_user_id=websocket.headers.get("x-user-id")
        )
    except Exception:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    await websocket.accept()

    try:
        while True:
            raw_message = await websocket.receive_text()
            try:
                payload = json.loads(raw_message)
            except json.JSONDecodeError:
                await websocket.send_json({"t": "e", "m": "Invalid JSON payload"})
                continue

            if payload.get("start_attached_files"):
                conversation_id = payload.get("conversation_id")
                if conversation_id:
                    await websocket.send_json({"conversation_id": conversation_id})
                continue

            await _handle_chat_message(websocket, owner_id=user.id, payload=payload)
    except WebSocketDisconnect:
        return
