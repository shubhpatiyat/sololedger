from fastapi import APIRouter

from app.api.routes import auth, bills, categories, chat, clients, invoice_templates, invoices, mail, projects

api_router = APIRouter()
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(projects.router, prefix="/projects", tags=["projects"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(bills.router, prefix="/bills", tags=["bills"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["invoices"])
api_router.include_router(invoice_templates.router, prefix="/invoice-templates", tags=["invoice-templates"])
api_router.include_router(chat.router, prefix="/chat", tags=["chat"])
api_router.include_router(mail.router, prefix="/mail", tags=["mail"])
