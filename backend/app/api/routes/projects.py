from fastapi import APIRouter, Form, HTTPException, status

from app.api.deps import AuthUser, DBSession
from app.models.client import Client
from app.models.oauth_account import OAuthAccount
from app.models.project import Project
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.project import EndUserProfileResponse, ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter()


@router.get("/end-user-profile/", response_model=EndUserProfileResponse)
def get_end_user_profile(db: DBSession, current_user: AuthUser):
    user = db.query(User).filter(User.id == current_user.id).first()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    accounts = (
        db.query(OAuthAccount)
        .filter(
            OAuthAccount.owner_id == current_user.id,
            OAuthAccount.status == "connected",
        )
        .all()
    )
    account_by_provider = {account.provider: account for account in accounts}
    email_value = user.email if user else (current_user.email or "")
    name_value = (profile.name or "").strip() if profile else ""
    if name_value:
        name_parts = name_value.split()
        first_name = name_parts[0]
        last_name = " ".join(name_parts[1:])
    else:
        first_name = user.first_name if user and user.first_name else (email_value.split("@", 1)[0] if email_value else "SoloLedger")
        last_name = user.last_name if user and user.last_name else ""

    return {
        "success": True,
        "profile": {
            "email": email_value,
            "first_name": first_name,
            "last_name": last_name,
            "profile_image_url": None,
            "is_gmail_connected": "gmail" in account_by_provider,
            "is_outlook_connected": "outlook" in account_by_provider,
            "gmail_account_email": (
                account_by_provider["gmail"].account_email if "gmail" in account_by_provider else None
            ),
            "outlook_account_email": (
                account_by_provider["outlook"].account_email if "outlook" in account_by_provider else None
            ),
            "address": profile.address if profile else None,
            "pincode": profile.pincode if profile else None,
        },
    }


@router.patch("/end-user-profile/")
def update_end_user_profile(
    db: DBSession,
    current_user: AuthUser,
    first_name: str = Form(""),
    last_name: str = Form(""),
    address: str = Form(""),
    pincode: str = Form(""),
):
    user = db.query(User).filter(User.id == current_user.id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    clean_first_name = first_name.strip()
    clean_last_name = last_name.strip()
    user.first_name = clean_first_name or None
    user.last_name = clean_last_name or None
    profile.name = " ".join(part for part in [clean_first_name, clean_last_name] if part) or None
    profile.address = address.strip() or None
    profile.pincode = pincode.strip() or None

    db.add(user)
    db.add(profile)
    db.commit()
    return {"success": True, "message": "Profile updated successfully."}


@router.get("", response_model=list[ProjectRead])
def list_projects(db: DBSession, current_user: AuthUser):
    return (
        db.query(Project)
        .join(Client, Project.client_id == Client.id)
        .filter(Client.owner_id == current_user.id)
        .order_by(Project.created_at.desc())
        .all()
    )


@router.post("", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(payload: ProjectCreate, db: DBSession, current_user: AuthUser):
    client = db.query(Client).filter(Client.id == payload.client_id, Client.owner_id == current_user.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    project = Project(**payload.model_dump())
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(project_id: str, payload: ProjectUpdate, db: DBSession, current_user: AuthUser):
    project = (
        db.query(Project)
        .join(Client, Project.client_id == Client.id)
        .filter(Project.id == project_id, Client.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)
    return project
