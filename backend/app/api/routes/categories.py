from fastapi import APIRouter, HTTPException, status

from app.api.deps import AuthUser, DBSession
from app.models.category import Category
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate

router = APIRouter()


@router.get("", response_model=list[CategoryRead])
def list_categories(db: DBSession, current_user: AuthUser):
    return (
        db.query(Category)
        .filter(Category.owner_id == current_user.id)
        .order_by(Category.created_at.desc())
        .all()
    )


@router.post("", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: DBSession, current_user: AuthUser):
    category = Category(owner_id=current_user.id, **payload.model_dump())
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(category_id: str, payload: CategoryUpdate, db: DBSession, current_user: AuthUser):
    category = (
        db.query(Category)
        .filter(Category.id == category_id, Category.owner_id == current_user.id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category

