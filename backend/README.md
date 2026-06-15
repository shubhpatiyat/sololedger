# SoloLedger Backend

FastAPI backend scaffold for SoloLedger.

## Included

- FastAPI app with `/api/v1`
- Supabase-JWT-ready auth dependency
- SQLAlchemy models for:
  - `clients`
  - `projects`
  - `categories`
  - `bills`
  - `invoices`
  - `conversations`
  - `chats`
- Azure OpenAI service using `AzureChatOpenAI`
- Starter CRUD routes
- Starter chat route that stores `user_message` and `assistant_message`

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

## Debugging

If you're using VS Code, a workspace launch config is included at `.vscode/launch.json`.

Use the `Backend: FastAPI` debugger to start:

- module: `uvicorn`
- app: `app.main:app`
- host: `127.0.0.1`
- port: `8000`
- reload enabled

Make sure your backend virtualenv is selected as the active Python interpreter in VS Code before starting the debugger.

## Alembic

This project is set up for Alembic-based migrations.

Because your schema already exists, the included first revision is a baseline migration.
Do not run `alembic upgrade head` first on an existing database. Instead:

```bash
cd backend
alembic stamp head
```

That marks the current schema as the Alembic starting point.

After that, for future changes:

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Auth

For local development, `ALLOW_DEV_AUTH=true` lets the API work without Supabase by falling back to:

- Bearer-less demo user, or
- `X-User-Id` request header

For production:

- set `ALLOW_DEV_AUTH=false`
- set `SUPABASE_JWT_SECRET`
- pass Supabase bearer tokens from the frontend

## Notes

- `conversations.client_id` is unique, matching your rule that one client has one conversation thread.
- `chats` stores paired `user_message` and `assistant_message`, matching your MVP direction.
- `bills.invoice_id` is nullable so bills can exist before invoicing.
- `bills.project_id` is nullable so client-level bills can exist outside a project.
