import json

from pydantic import BaseModel, Field, ValidationError

from app.models.conversation import Conversation

EXPENSE_CATEGORY_WORKFLOW = "expense_missing_category"
EXPENSE_ACTION_WORKFLOW = "expense_action_confirmation"
EXPENSE_AMOUNT_WORKFLOW = "expense_missing_amount"

STORE_ONLY_INTENTS = {
    "store",
    "save",
    "store expense",
    "save expense",
    "store bill",
    "save bill",
    "just store it",
    "only store it",
    "raise at month end",
}

STORE_AND_INVOICE_INTENTS = {
    "invoice",
    "create invoice",
    "store and create invoice",
    "save and create invoice",
    "create an invoice",
    "bill the client",
    "invoice it",
    "raise now",
}


class PendingExpenseDraft(BaseModel):
    owner_id: str
    amount: float
    vendor_name: str | None = None
    title: str | None = None
    source_message: str = ""
    category_name: str | None = None
    file_path: str | None = None
    recommended_categories: list[str] = Field(default_factory=list)
    should_create_invoice: bool = False


class PendingExpenseAmountDraft(BaseModel):
    owner_id: str
    vendor_name: str | None = None
    title: str | None = None
    source_message: str = ""
    file_path: str | None = None
    recommended_categories: list[str] = Field(default_factory=list)
    should_create_invoice: bool = False


def store_pending_workflow(conversation: Conversation, workflow: str, payload: dict) -> None:
    conversation.pending_workflow = workflow
    conversation.pending_workflow_payload = json.dumps(payload)


def clear_pending_workflow(conversation: Conversation) -> None:
    conversation.pending_workflow = None
    conversation.pending_workflow_payload = None


def load_pending_expense_draft(conversation: Conversation) -> PendingExpenseDraft | None:
    try:
        return PendingExpenseDraft.model_validate(json.loads(conversation.pending_workflow_payload or "{}"))
    except (json.JSONDecodeError, ValidationError):
        return None


def load_pending_expense_amount_draft(conversation: Conversation) -> PendingExpenseAmountDraft | None:
    try:
        return PendingExpenseAmountDraft.model_validate(json.loads(conversation.pending_workflow_payload or "{}"))
    except (json.JSONDecodeError, ValidationError):
        return None
