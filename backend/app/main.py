from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect

from app.api.router import api_router
from app.api.routes.realtime import router as realtime_router
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
from app.models import (  # noqa: F401
    bill,
    category,
    chat,
    client,
    conversation,
    email_draft,
    invoice,
    oauth_account,
    project,
    uploaded_bill_file,
    user,
    user_profile,
)


def _assert_required_schema() -> None:
    inspector = inspect(engine)

    if not inspector.has_table("bills"):
        return

    required_columns_by_table = {
        "bills": {
            "file_path": "20260406_000003",
        },
        "uploaded_bill_files": {
            "bill_id": "20260407_000008",
        },
        "clients": {
            "address_line_1": "20260408_000012",
            "address_line_2": "20260408_000012",
            "city": "20260408_000012",
            "state": "20260408_000012",
            "postal_code": "20260408_000012",
            "country": "20260408_000012",
        },
    }

    for table_name, required_columns in required_columns_by_table.items():
        if not inspector.has_table(table_name):
            continue

        existing_columns = {column["name"] for column in inspector.get_columns(table_name)}
        for column_name, revision in required_columns.items():
            if column_name in existing_columns:
                continue
            raise RuntimeError(
                f"Database schema is out of date: missing column {table_name}.{column_name}. "
                f"Apply Alembic migration {revision} (`alembic upgrade head`) "
                "against this database before starting the backend."
            )


def create_application() -> FastAPI:
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[],
        allow_origin_regex=".*",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health", tags=["health"])
    def healthcheck() -> dict[str, str]:
        return {"status": "ok", "app": settings.app_name}

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(realtime_router)
    return app


app = create_application()
Base.metadata.create_all(bind=engine)
_assert_required_schema()
