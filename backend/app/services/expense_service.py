import json
import re

from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.client import Client
from app.models.conversation import Conversation
from app.models.uploaded_bill_file import UploadedBillFile
from app.repositories.bill_repository import create_bill
from app.services.category_service import (
    find_category_by_name,
    get_categories,
    list_category_names,
    normalize_text,
    top_category_recommendations,
)
from app.services.email_drafts import load_invoice_attachments
from app.services.email_service import prepare_invoice_draft, render_draft_status
from app.services.invoice_service import create_invoice_for_bill, handle_invoice_creation
from app.services.llm.decision_service import extract_category_suggestion, extract_expense_decision
from app.services.workflow_service import (
    EXPENSE_ACTION_WORKFLOW,
    EXPENSE_AMOUNT_WORKFLOW,
    EXPENSE_CATEGORY_WORKFLOW,
    STORE_AND_INVOICE_INTENTS,
    STORE_ONLY_INTENTS,
    clear_pending_workflow,
    load_pending_expense_amount_draft,
    load_pending_expense_draft,
    store_pending_workflow,
)


def _finance_ui(payload: dict, guidance: str | None = None) -> str:
    parts = [f"<finance-ui>{json.dumps(payload)}</finance-ui>"]
    if guidance:
        parts.append(guidance)
    return "\n\n".join(parts)


def _invoice_file_path(invoice_id: str) -> str:
    return f"/api/v1/invoices/{invoice_id}/file"


def build_bill_title(
    amount: float,
    vendor_name: str | None = None,
    source_message: str | None = None,
) -> str:
    vendor = normalize_text(vendor_name)
    if vendor:
        return f"{vendor} - {amount:g}"

    source_hint = normalize_text(source_message)
    if source_hint:
        single_line = " ".join(source_hint.split())
        if single_line:
            if any(char.isdigit() for char in single_line):
                return single_line
            return f"{single_line} - {amount:g}"

    return f"Expense - {amount:g}"


def _load_uploaded_bill_files(
    db: Session,
    *,
    conversation_id: str,
    file_ids: list[str],
) -> list[UploadedBillFile]:
    if not file_ids:
        return []

    uploads = (
        db.query(UploadedBillFile)
        .filter(
            UploadedBillFile.conversation_id == conversation_id,
            UploadedBillFile.bill_id.is_(None),
            UploadedBillFile.id.in_(file_ids),
        )
        .order_by(UploadedBillFile.created_at.asc())
        .all()
    )
    upload_by_id = {upload.id: upload for upload in uploads}
    return [upload_by_id[file_id] for file_id in file_ids if file_id in upload_by_id]


def _load_latest_staged_upload(db: Session, *, conversation_id: str) -> UploadedBillFile | None:
    return (
        db.query(UploadedBillFile)
        .filter(
            UploadedBillFile.conversation_id == conversation_id,
            UploadedBillFile.bill_id.is_(None),
        )
        .order_by(UploadedBillFile.created_at.desc())
        .first()
    )


def build_uploaded_bill_context(uploaded_files: list[UploadedBillFile], user_message: str) -> tuple[str, str | None]:
    normalized_message = normalize_text(user_message)
    context_parts: list[str] = []
    file_path: str | None = None

    if normalized_message:
        context_parts.append(normalized_message)

    if uploaded_files:
        primary_file = uploaded_files[0]
        file_path = primary_file.file_path
        context_parts.append(f"Uploaded bill file: {primary_file.original_file_name}")
        if primary_file.extracted_text:
            context_parts.append(f"OCR text:\n{primary_file.extracted_text}")

    return "\n\n".join(context_parts).strip(), file_path


def build_contextual_user_message(
    db: Session,
    *,
    conversation_id: str,
    user_message: str,
    uploaded_file_ids: list[str] | None = None,
) -> str:
    uploaded_files = _load_uploaded_bill_files(
        db,
        conversation_id=conversation_id,
        file_ids=uploaded_file_ids or [],
    )
    contextual_message, _ = build_uploaded_bill_context(uploaded_files, user_message)
    return contextual_message or user_message


def _handle_action_confirmation(db: Session, client: Client, conversation: Conversation, user_message: str) -> str:
    draft = load_pending_expense_draft(conversation)
    if draft is None or not draft.category_name:
        clear_pending_workflow(conversation)
        return "I lost the pending expense details. Please send the expense again and I will recreate the draft."

    categories = get_categories(db, draft.owner_id)
    category = find_category_by_name(categories, draft.category_name)
    if not category:
        clear_pending_workflow(conversation)
        return "That category is no longer available. Please send the expense again and choose a valid category."

    normalized_reply = normalize_text(user_message).lower()
    if normalized_reply in STORE_ONLY_INTENTS:
        uploaded_file = _load_latest_staged_upload(db, conversation_id=conversation.id)
        bill = create_bill(
            db,
            client=client,
            category=category,
            amount=draft.amount,
            title=draft.title or build_bill_title(draft.amount, draft.vendor_name, draft.source_message),
            source_message=draft.source_message,
            vendor_name=normalize_text(draft.vendor_name) or None,
            uploaded_file=uploaded_file,
            file_path=draft.file_path,
        )
        clear_pending_workflow(conversation)
        return _finance_ui(
            {
                "type": "expense-stored",
                "title": bill.title,
                "amount": bill.amount,
                "vendor_name": bill.vendor_name,
                "category": category.name,
                "status": bill.status,
            },
            "Expense saved.",
        )

    if normalized_reply in STORE_AND_INVOICE_INTENTS:
        uploaded_file = _load_latest_staged_upload(db, conversation_id=conversation.id)
        bill = create_bill(
            db,
            client=client,
            category=category,
            amount=draft.amount,
            title=draft.title or build_bill_title(draft.amount, draft.vendor_name, draft.source_message),
            source_message=draft.source_message,
            vendor_name=normalize_text(draft.vendor_name) or None,
            uploaded_file=uploaded_file,
            file_path=draft.file_path,
        )
        invoice = create_invoice_for_bill(db, client=client, bill=bill)
        uploaded_files = load_invoice_attachments(db, bill_id=bill.id, invoice_id=invoice.id)
        email_draft = prepare_invoice_draft(
            db,
            owner_id=conversation.owner_id,
            client=client,
            invoice=invoice,
            attachments=uploaded_files,
        )
        clear_pending_workflow(conversation)
        email_status = render_draft_status(client, email_draft)
        invoice_payload: dict = {
            "invoice_number": invoice.invoice_number,
            "title": invoice.title,
            "total_amount": invoice.total_amount,
            "status": invoice.status,
        }
        guidance = f"Expense saved and invoice {invoice.invoice_number} was created for {invoice.total_amount:g}.{email_status}"
        if email_draft and email_draft.status == "chat_ready":
            file_name = invoice.pdf_file_name or f"{invoice.invoice_number}.pdf"
            file_url = _invoice_file_path(invoice.id)
            invoice_payload["file_name"] = file_name
            invoice_payload["file_url"] = file_url
            guidance = (
                f"Expense saved and invoice {invoice.invoice_number} was created for {invoice.total_amount:g}. "
                f"Here is your invoice: [{file_name}]({file_url})."
            )

        return _finance_ui(
            {
                "type": "expense-and-invoice-created",
                "expense": {
                    "title": bill.title,
                    "amount": bill.amount,
                    "vendor_name": bill.vendor_name,
                    "category": category.name,
                    "status": bill.status,
                },
                "invoice": invoice_payload,
            },
            guidance,
        )

    return _finance_ui(
        {
            "type": "action-prompt",
            "title": "Choose what to do with this expense",
            "actions": [
                {"id": "raise at month end", "label": "Raise at month end"},
                {"id": "raise now", "label": "Raise now"},
            ],
        },
        "Choose an action below.",
    )


def _handle_missing_category(db: Session, client: Client, conversation: Conversation, user_message: str) -> str:
    draft = load_pending_expense_draft(conversation)
    if draft is None:
        clear_pending_workflow(conversation)
        return "I lost the pending expense details. Please send the expense again."

    categories = get_categories(db, draft.owner_id)
    category_names = list_category_names(categories)
    category = find_category_by_name(categories, user_message)
    create_candidate_name = normalize_text(user_message)
    category_was_created = False

    if not category:
        decision = extract_expense_decision(client, user_message, category_names)
        if decision.intent == "create_category" and decision.category_name:
            requested_category_name = normalize_text(decision.category_name).title()
            create_candidate_name = requested_category_name or create_candidate_name
            category = find_category_by_name(categories, requested_category_name)
            if category is None and requested_category_name:
                category = Category(
                    owner_id=draft.owner_id,
                    name=requested_category_name,
                    description="Added from chat",
                )
                db.add(category)
                db.flush()
                categories.append(category)
                category_was_created = True

    if not category:
        return _finance_ui(
            {
                "type": "category-suggestion",
                "title": draft.title or build_bill_title(draft.amount, draft.vendor_name),
                "amount": draft.amount,
                "vendor_name": draft.vendor_name,
                "categories": category_names[:5],
                "create_category_name": create_candidate_name,
            },
            "I couldn’t confidently match this to an existing category. Choose one below or create a new one.",
        )

    category_names = list_category_names(categories)
    recommendations = top_category_recommendations(category_names, [category.name])
    store_pending_workflow(
        conversation,
        EXPENSE_ACTION_WORKFLOW,
        {
            "owner_id": draft.owner_id,
            "amount": draft.amount,
            "vendor_name": draft.vendor_name,
            "title": draft.title or build_bill_title(draft.amount, draft.vendor_name),
            "source_message": draft.source_message,
            "category_name": category.name,
            "file_path": draft.file_path,
            "recommended_categories": recommendations,
            "should_create_invoice": draft.should_create_invoice,
        },
    )

    if category_was_created:
        return _finance_ui(
            {
                "type": "category-created-assigned",
                "title": draft.title or build_bill_title(draft.amount, draft.vendor_name),
                "amount": draft.amount,
                "vendor_name": draft.vendor_name,
                "category": category.name,
                "actions": [
                    {"id": "raise at month end", "label": "Raise at month end"},
                    {"id": "raise now", "label": "Raise now instead"}
                ],
            },
            f"Created category: {category.name}\n\nThis expense will be filed under {category.name} and included in the monthly invoice.",
        )

    return _finance_ui(
        {
            "type": "expense-draft",
            "title": draft.title or build_bill_title(draft.amount, draft.vendor_name),
            "amount": draft.amount,
            "vendor_name": draft.vendor_name,
            "category": category.name,
            "actions": [
                {"id": "raise at month end", "label": "Raise at month end"},
                {"id": "raise now", "label": "Raise now"},
            ],
        },
        "Category matched. Choose the next action below.",
    )


def handle_structured_expense_flow(
    db: Session,
    *,
    client: Client,
    conversation: Conversation,
    owner_id: str,
    user_message: str,
    uploaded_file_ids: list[str] | None = None,
) -> str | None:
    if conversation.pending_workflow == EXPENSE_AMOUNT_WORKFLOW:
        amount_draft = load_pending_expense_amount_draft(conversation)
        if amount_draft is None:
            clear_pending_workflow(conversation)
            return "I lost the pending expense details. Please send the expense again."

        categories = get_categories(db, amount_draft.owner_id)
        category_names = list_category_names(categories)
        amount_decision = extract_expense_decision(
            client,
            f"Pending expense details:\n{amount_draft.source_message}\n\nFollow-up user message:\n{user_message}",
            category_names,
        )
        amount = amount_decision.amount
        if amount is None or amount <= 0 or amount_decision.confidence < 0.4:
            return "Please share a valid amount (for example: `700`)."

        recommendations = top_category_recommendations(category_names, amount_draft.recommended_categories)
        vendor_name = amount_draft.vendor_name or amount_decision.vendor_name
        title = amount_draft.title or build_bill_title(amount, vendor_name)

        store_pending_workflow(
            conversation,
            EXPENSE_CATEGORY_WORKFLOW,
            {
                "owner_id": amount_draft.owner_id,
                "amount": amount,
                "vendor_name": vendor_name,
                "title": title,
                "source_message": amount_draft.source_message or normalize_text(user_message),
                "file_path": amount_draft.file_path,
                "recommended_categories": recommendations,
                "should_create_invoice": amount_draft.should_create_invoice,
            },
        )
        return _finance_ui(
            {
                "type": "expense-draft",
                "title": title,
                "amount": amount,
                "vendor_name": vendor_name,
                "categories": recommendations,
            },
            "Choose a category below.",
        )

    if conversation.pending_workflow == EXPENSE_CATEGORY_WORKFLOW:
        return _handle_missing_category(db, client, conversation, user_message)

    if conversation.pending_workflow == EXPENSE_ACTION_WORKFLOW:
        return _handle_action_confirmation(db, client, conversation, user_message)

    uploaded_files = _load_uploaded_bill_files(
        db,
        conversation_id=conversation.id,
        file_ids=uploaded_file_ids or [],
    )
    contextual_message, file_path = build_uploaded_bill_context(uploaded_files, user_message)
    effective_message = contextual_message or normalize_text(user_message)

    if not effective_message:
        return None

    if re.search(r"\b(create|raise|generate)\b.*\binvoice\b", effective_message, re.IGNORECASE):
        invoice_result = handle_invoice_creation(
            db,
            client=client,
            owner_id=owner_id,
            user_message=effective_message,
        )
        if invoice_result is not None:
            return invoice_result

    categories = get_categories(db, owner_id)
    category_names = list_category_names(categories)
    decision = extract_expense_decision(client, effective_message, category_names)

    expense_without_amount = (
        decision.intent == "create_bill"
        and decision.amount is None
        and ("amount" in {field.lower() for field in decision.missing_fields} or decision.confidence >= 0.4)
    )
    if expense_without_amount:
        store_pending_workflow(
            conversation,
            EXPENSE_AMOUNT_WORKFLOW,
            {
                "owner_id": owner_id,
                "vendor_name": decision.vendor_name,
                "title": decision.title,
                "source_message": effective_message,
                "file_path": file_path,
                "recommended_categories": decision.recommended_categories,
                "should_create_invoice": decision.should_create_invoice,
            },
        )
        return "I can log that expense. Please share the amount too (for example: `4000 for gifting`)."

    if decision.intent != "create_bill" or decision.amount is None or decision.confidence < 0.4:
        if uploaded_files:
            return "I could not clearly extract the bill amount from that file. Please upload a clearer bill or type the amount."
        return None

    recommendations = top_category_recommendations(category_names, decision.recommended_categories)
    title = decision.title or build_bill_title(decision.amount, decision.vendor_name)

    store_pending_workflow(
        conversation,
        EXPENSE_CATEGORY_WORKFLOW,
        {
            "owner_id": owner_id,
            "amount": decision.amount,
            "vendor_name": decision.vendor_name,
            "title": title,
            "source_message": effective_message,
            "file_path": file_path,
            "recommended_categories": recommendations,
            "should_create_invoice": decision.should_create_invoice,
        },
    )

    if "category" in {field.lower() for field in decision.missing_fields}:
        category_suggestion = extract_category_suggestion(client, effective_message, category_names)
        create_category_name = normalize_text(category_suggestion.create_category_name).title()
        if create_category_name and category_suggestion.confidence >= 0.4:
            return _finance_ui(
                {
                    "type": "category-suggestion",
                    "title": title,
                    "amount": decision.amount,
                    "vendor_name": decision.vendor_name,
                    "categories": recommendations,
                    "create_category_name": create_category_name,
                },
                "I couldn’t confidently match this to an existing category. Choose one below or create a new one.",
            )

    return _finance_ui(
        {
            "type": "expense-draft",
            "title": title,
            "amount": decision.amount,
            "vendor_name": decision.vendor_name,
            "categories": recommendations,
        },
        "Choose a category below.",
    )
