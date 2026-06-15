from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthUser, DBSession
from app.models.bill import Bill
from app.models.category import Category
from app.models.client import Client
from app.models.invoice import Invoice
from app.models.project import Project
from app.schemas.bill import BillCreate, BillRead, BillUpdate

router = APIRouter()


@router.get("", response_model=list[BillRead])
def list_bills(db: DBSession, current_user: AuthUser):
    return (
        db.query(Bill)
        .join(Client, Bill.client_id == Client.id)
        .filter(Client.owner_id == current_user.id)
        .order_by(Bill.created_at.desc())
        .all()
    )


@router.post("", response_model=BillRead, status_code=status.HTTP_201_CREATED)
def create_bill(payload: BillCreate, db: DBSession, current_user: AuthUser):
    client = db.query(Client).filter(Client.id == payload.client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    category = db.query(Category).filter(Category.id == payload.category_id, Category.owner_id == current_user.id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    if payload.project_id:
        project = db.query(Project).filter(Project.id == payload.project_id, Project.client_id == payload.client_id).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    if payload.invoice_id:
        invoice = db.query(Invoice).filter(Invoice.id == payload.invoice_id, Invoice.client_id == payload.client_id).first()
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")

    bill = Bill(**payload.model_dump())
    db.add(bill)
    db.commit()
    db.refresh(bill)
    return bill


@router.patch("/{bill_id}", response_model=BillRead)
def update_bill(bill_id: str, payload: BillUpdate, db: DBSession, current_user: AuthUser):
    bill = (
        db.query(Bill)
        .join(Client, Bill.client_id == Client.id)
        .filter(Bill.id == bill_id, Client.owner_id == current_user.id)
        .first()
    )
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(bill, field, value)

    db.commit()
    db.refresh(bill)
    return bill

