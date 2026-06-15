from typing import Annotated

from fastapi import Depends, Header, HTTPException, status
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.services.auth import decode_token


class CurrentUser(BaseModel):
    id: str
    email: str | None = None


DBSession = Annotated[Session, Depends(get_db)]


def get_current_user_from_token(token: str | None, x_user_id: str | None = None) -> CurrentUser:
    if settings.allow_dev_auth and x_user_id:
        return CurrentUser(id=x_user_id, email=None)

    if not token:
        if settings.allow_dev_auth:
            return CurrentUser(id="demo-user", email="demo@sololedger.app")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing auth token")

    if not settings.supabase_jwt_secret:
        if not settings.auth_jwt_secret:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="JWT secret is not configured",
            )

    try:
        payload = decode_token(token)
    except JWTError as exc:
        try:
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                audience=settings.supabase_audience,
                options={"verify_aud": False if not settings.supabase_audience else True},
            )
        except JWTError as fallback_exc:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from fallback_exc

    subject = payload.get("sub")
    if not subject:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    if payload.get("type") == "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")

    return CurrentUser(id=subject, email=payload.get("email"))


def get_current_user(
    authorization: Annotated[str | None, Header()] = None,
    x_user_id: Annotated[str | None, Header()] = None,
) -> CurrentUser:
    if authorization and not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth header")

    token = authorization.split(" ", 1)[1] if authorization else None
    return get_current_user_from_token(token=token, x_user_id=x_user_id)


AuthUser = Annotated[CurrentUser, Depends(get_current_user)]
