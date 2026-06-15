# SoloLedger Backend Static Design

## 1) Purpose
This file is a static backend design reference for SoloLedger.  
It documents architecture, core flows, and ownership boundaries.

## 2) Stack
- Framework: FastAPI
- ORM: SQLAlchemy
- Validation: Pydantic
- Migrations: Alembic
- DB: Relational database (via SQLAlchemy session)
- AI integration: `app/services/llm.py`

## 3) High-Level Architecture
```text
Client (Web UI / API consumer)
        |
        v
FastAPI Routes (app/api/routes/*)
        |
        v
Service Layer (app/services/*)
        |
        v
SQLAlchemy Models + Session (app/models/*, app/db/*)
        |
        v
Database
```

## 4) Key Modules
- `app/api/routes/chat.py`: Chat turn endpoints.
- `app/services/chat_service.py`: Structured expense + invoice workflows.
- `app/api/routes/bills.py`: Bill CRUD pathways.
- `app/api/routes/categories.py`: Category CRUD.
- `app/api/routes/projects.py`: Project CRUD.
- `app/api/routes/invoices.py`: Invoice CRUD/workflow.
- `app/services/email_drafts.py`: Invoice email draft preparation.
- `app/services/llm.py`: LLM client bootstrap/invocation.

## 5) Core Chat Workflows (`chat_service.py`)

### 5.1 State Machine
- `expense_missing_amount`
- `expense_missing_category`
- `expense_action_confirmation`

Conversation stores:
- `pending_workflow`
- `pending_workflow_payload` (JSON)

### 5.2 Expense Capture (Primary)
1. User sends message.
2. AI extracts `ExpenseDecision` (intent, amount, vendor, category hints).
3. If amount missing:
   - store `expense_missing_amount`
   - ask user for amount
4. If amount present:
   - store `expense_missing_category` draft
   - return category choices (and optional create-category suggestion)
5. User selects/creates category:
   - transition to `expense_action_confirmation`
6. User chooses action:
   - `raise at month end` => store bill only
   - `raise now` => store bill + create invoice (+ optional email draft)

### 5.3 Category Creation in Chat
- If user asks to create category while category is missing:
  - AI returns `create_category` + `category_name`
  - backend creates category if absent
  - assigns current expense to that category

### 5.4 Monthly Invoice Creation
- Detects invoice-create intent with month/year extraction.
- Finds uninvoiced bills for period.
- Creates invoice + attaches bills.
- Prepares email draft (provider-aware status text).

## 6) Transaction Boundary
Current design: single transaction commit per chat turn.

- Inner handlers mutate session state only.
- `create_chat_turn_for_conversation(...)` owns `db.commit()`.
- This ensures one commit boundary per request path.

## 7) Finance UI Payload Contract
Assistant can return:
```text
<finance-ui>{...json payload...}</finance-ui>
```
Frontend renders payload-specific widgets.

Observed payload types:
- `expense-draft`
- `category-suggestion`
- `category-created-assigned`
- `action-prompt`
- `expense-stored`
- `expense-and-invoice-created`
- `invoice-created`
- `empty-state`

## 8) Data Model (Conceptual)
- `User`
- `UserProfile`
- `Client`
- `Project`
- `Category`
- `Bill`
- `Invoice`
- `Conversation`
- `Chat`
- `UploadedBillFile`
- `EmailDraft`
- `OAuthAccount`

Relationships (conceptual):
- User owns Clients, Projects, Categories, Conversations.
- Client has many Bills and Invoices.
- Bill belongs to Category and optionally Invoice.
- Conversation has many Chat turns.

## 9) API Surface (Route Groups)
- `/auth`
- `/chat`
- `/clients`
- `/projects`
- `/categories`
- `/bills`
- `/invoices`
- `/mail`
- `/realtime`

## 10) Operational Notes
- LLM parse failures gracefully degrade to general chat paths.
- OCR/file context is appended for upload-driven bill extraction.
- Suggested categories are bounded and normalized for UI chips.
- Workflow payload resilience uses Pydantic validation on load.

## 11) Suggested Next Enhancements
1. Add idempotency keys for create-bill/invoice operations.
2. Add structured audit log for workflow transitions.
3. Add integration tests for:
   - amount-follow-up recovery
   - create-category from chat
   - single-commit transaction behavior
4. Version `finance-ui` payload schema for backward compatibility.
