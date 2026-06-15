from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthUser, DBSession
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientRead, ClientUpdate
from app.services.chat_service import get_or_create_conversation

router = APIRouter()


@router.get("", response_model=list[ClientRead])
def list_clients(db: DBSession, current_user: AuthUser):
    return db.query(Client).filter(Client.owner_id == current_user.id).order_by(Client.created_at.desc()).all()


@router.post("", response_model=ClientRead, status_code=status.HTTP_201_CREATED)
def create_client(payload: ClientCreate, db: DBSession, current_user: AuthUser):
    client = Client(owner_id=current_user.id, **payload.model_dump())
    db.add(client)
    db.flush()
    get_or_create_conversation(db, client=client, owner_id=current_user.id)
    db.commit()
    db.refresh(client)
    return client


@router.get("/{client_id}", response_model=ClientRead)
def get_client(client_id: str, db: DBSession, current_user: AuthUser):
    client = db.query(Client).filter(Client.id == client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.patch("/{client_id}", response_model=ClientRead)
def update_client(client_id: str, payload: ClientUpdate, db: DBSession, current_user: AuthUser):
    client = db.query(Client).filter(Client.id == client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(client, field, value)

    db.commit()
    db.refresh(client)
    return client
