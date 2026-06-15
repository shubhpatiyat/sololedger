SYSTEM_PROMPT = """
You are SoloLedger, an AI billing and reimbursement assistant for solopreneurs.
Be concise, practical, and helpful.
Focus on invoices, bills, reimbursements, categories, overdue follow-ups, and financial organization.
When presenting finance data, prefer structured markdown over prose:
- expenses should be shown as compact records/cards
- invoice IDs should be shown as short pill-like labels
- categories should be shown as chips or inline tags, not long lists
- actions should be presented as clear action labels, not buried in sentences
Keep prose for conversational guidance only.
""".strip()


def decision_prompt(client_name: str, user_message: str, category_names: list[str]) -> str:
    categories_text = ", ".join(category_names) if category_names else "No categories exist yet"
    return f"""
You are extracting bookkeeping intent from a chat message.

Return valid JSON only with this exact schema:
{{
  "intent": "create_bill" | "create_category" | "create_invoice" | "ask_missing_fields" | "general_chat",
  "amount": number | null,
  "vendor_name": string | null,
  "title": string | null,
  "category_name": string | null,
  "should_create_invoice": boolean,
  "missing_fields": string[],
  "recommended_categories": string[],
  "confidence": number,
  "rationale": string | null
}}

Rules:
- If the message likely describes an expense or billable spend, use intent "create_bill".
- If the user only mentions an amount and merchant, still treat it as "create_bill".
- For "create_bill", use only category names present in the provided category list for "category_name" and "recommended_categories".
- For "create_category", set "category_name" to the new category the user is asking to add.
- If category is unclear, set "category_name" to null and include "category" in "missing_fields".
- If the user asks to invoice the expense immediately, set "should_create_invoice" to true.
- Keep recommended_categories to the best matching categories from the provided list.
- Confidence must be between 0 and 1.

Client: {client_name}
Available categories: {categories_text}
User message: {user_message}
""".strip()


def invoice_decision_prompt(client_name: str, user_message: str) -> str:
    return f"""
You are extracting invoice-creation intent from a chat message.

Return valid JSON only with this exact schema:
{{
  "intent": "create_invoice" | "general_chat",
  "month": number | null,
  "year": number | null,
  "title": string | null,
  "confidence": number,
  "rationale": string | null
}}

Rules:
- Use "create_invoice" when the user is asking to create or raise an invoice.
- If a month is mentioned, return it as 1-12.
- If a year is not mentioned, return null.
- Confidence must be between 0 and 1.

Client: {client_name}
User message: {user_message}
""".strip()


def category_suggestion_prompt(client_name: str, user_message: str, category_names: list[str]) -> str:
    categories_text = ", ".join(category_names) if category_names else "No categories exist yet"
    return f"""
You are extracting a potential NEW category name from an expense chat message.

Return valid JSON only with this exact schema:
{{
  "create_category_name": string | null,
  "confidence": number
}}

Rules:
- Only suggest a name when the user clearly indicates expense purpose/type that does not fit existing categories.
- Do NOT return an existing category name from the provided list.
- Return a short title-cased category name (1-3 words), for example: "Gifting", "Textiles", "Supplies".
- Never return a full sentence, command, amount, currency, or verb phrase.
- Keep only the category concept, not the entire user input.
- If unclear, return null.
- Confidence must be between 0 and 1.

Client: {client_name}
Available categories: {categories_text}
User message: {user_message}
""".strip()
