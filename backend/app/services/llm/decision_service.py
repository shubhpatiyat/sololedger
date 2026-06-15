import json

from pydantic import BaseModel, Field, ValidationError

from app.models.client import Client
from app.services.llm import get_llm
from app.services.llm.parsers import extract_json_object
from app.services.llm.prompts import (
    SYSTEM_PROMPT,
    category_suggestion_prompt,
    decision_prompt,
    invoice_decision_prompt,
)


class ExpenseDecision(BaseModel):
    intent: str = Field(default="general_chat")
    amount: float | None = None
    vendor_name: str | None = None
    title: str | None = None
    category_name: str | None = None
    should_create_invoice: bool = False
    missing_fields: list[str] = Field(default_factory=list)
    recommended_categories: list[str] = Field(default_factory=list)
    confidence: float = 0.0
    rationale: str | None = None


class InvoiceDecision(BaseModel):
    intent: str = Field(default="general_chat")
    month: int | None = None
    year: int | None = None
    title: str | None = None
    confidence: float = 0.0
    rationale: str | None = None


class CategorySuggestionDecision(BaseModel):
    create_category_name: str | None = None
    confidence: float = 0.0


def _invoke(prompt: str) -> str:
    llm = get_llm()
    response = llm.invoke(prompt)
    return response.content if isinstance(response.content, str) else str(response.content)


def extract_expense_decision(client: Client, user_message: str, category_names: list[str]) -> ExpenseDecision:
    try:
        content = _invoke(decision_prompt(client.name, user_message, category_names))
        return ExpenseDecision.model_validate(json.loads(extract_json_object(content)))
    except (json.JSONDecodeError, ValidationError):
        return ExpenseDecision(intent="general_chat", confidence=0.0)


def extract_invoice_decision(client: Client, user_message: str) -> InvoiceDecision:
    try:
        content = _invoke(invoice_decision_prompt(client.name, user_message))
        return InvoiceDecision.model_validate(json.loads(extract_json_object(content)))
    except (json.JSONDecodeError, ValidationError):
        return InvoiceDecision(intent="general_chat", confidence=0.0)


def extract_category_suggestion(client: Client, user_message: str, category_names: list[str]) -> CategorySuggestionDecision:
    try:
        content = _invoke(category_suggestion_prompt(client.name, user_message, category_names))
        return CategorySuggestionDecision.model_validate(json.loads(extract_json_object(content)))
    except (json.JSONDecodeError, ValidationError):
        return CategorySuggestionDecision(create_category_name=None, confidence=0.0)


def generate_assistant_reply(client: Client, user_message: str) -> str:
    prompt = (
        f"{SYSTEM_PROMPT}\\n\\n"
        f"Client: {client.name}\\n"
        f"User message: {user_message}\\n\\n"
        "Reply in plain language. If relevant, mention next bookkeeping or invoicing steps. "
        "Prefer structured markdown for finance data and reserve prose for guidance."
    )
    return _invoke(prompt)
