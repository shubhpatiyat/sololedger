import productExpertImg from "@/assets/ProductExpert.png";
import supportAgentImg from "@/assets/support-agent.png";
import feedbackCollectorImg from "@/assets/FeedbackCollector.png";
import {
  Chat,
  LibraryItem,
  Message,
  WorkspaceBill,
  WorkspaceCategory,
  WorkspaceClient,
  WorkspaceInvoice,
  WorkspaceProject,
} from "@/types";

export const demoOrganization = {
  organization_name: "SoloLedger",
  logo: "",
  showMicrosoftLogin: false,
  onlyShowMicrosoftLogin: false,
  showCaptcha: false,
  captchValue: "",
};

export const demoProfile = {
  fullName: "Avinash Jagtap",
  email: "avinash@sololedger.app",
  profilePhoto: null,
  firstName: "Avinash",
  lastName: "Jagtap",
  address: "Pune, Maharashtra",
  pincode: "411001",
  is_gmail_connected: false,
  is_outlook_connected: false,
};

export const demoLibraryItems: LibraryItem[] = [
  {
    id: 1,
    project_id: "expense-capture-agent",
    title: "Expense Capture Agent",
    description:
      "Logs receipts, vendor bills, and reimbursements from chat messages into structured expense records.",
    type: "product_expert",
    icon: productExpertImg,
    category: "Expense Capture",
    starred: true,
    lastAccessed: new Date().toISOString(),
  },
  {
    id: 2,
    project_id: "invoice-followup-agent",
    title: "Invoice Follow-up Agent",
    description:
      "Tracks unpaid invoices, highlights overdue amounts, and drafts polite follow-up nudges for clients.",
    type: "support_agent",
    icon: supportAgentImg,
    category: "Invoice Tracking",
    starred: true,
    lastAccessed: new Date().toISOString(),
  },
  {
    id: 3,
    project_id: "finance-summary-agent",
    title: "Finance Summary Agent",
    description:
      "Builds monthly summaries for income, expenses, reimbursements, and cash flow in a CA-ready format.",
    type: "feedback_collector",
    icon: feedbackCollectorImg,
    category: "Financial Summary",
    starred: false,
    lastAccessed: new Date().toISOString(),
  },
];

export const demoClients: WorkspaceClient[] = [
  {
    id: "client-1",
    name: "Rahul Media",
    status: "Follow-up due",
    email: "rahul@rahulmedia.com",
    phone: "+91 9876543210",
    notes: "High-priority client with monthly billing cycle.",
  },
  {
    id: "client-2",
    name: "PixelNest Studio",
    status: "Due tomorrow",
    email: "accounts@pixelnest.studio",
    phone: "+91 9123456780",
    notes: "Brand refresh project currently active.",
  },
  {
    id: "client-3",
    name: "Northstar Labs",
    status: "Paid up",
    email: "finance@northstarlabs.com",
    phone: "+91 9988776655",
    notes: "Retainer and growth experiments account.",
  },
];

export const demoProjects: WorkspaceProject[] = [
  {
    id: "project-1",
    client_id: "client-1",
    name: "Website Retainer",
    budget_amount: 55000,
    status: "active",
    description: "Monthly website support and maintenance scope.",
  },
  {
    id: "project-2",
    client_id: "client-2",
    name: "Brand Refresh",
    budget_amount: 32000,
    status: "invoice pending",
    description: "Brand system and website refresh deliverables.",
  },
  {
    id: "project-3",
    client_id: "client-3",
    name: "Growth Experiments",
    budget_amount: 70000,
    status: "active",
    description: "Campaign analysis and experimentation support.",
  },
];

export const demoCategories: WorkspaceCategory[] = [
  { id: "cat-1", name: "Software", description: "SaaS tools and recurring subscriptions." },
  { id: "cat-2", name: "Travel", description: "Client travel, commute, and stay costs." },
  { id: "cat-3", name: "Professional Services", description: "External vendor and freelance support." },
  { id: "cat-4", name: "Reimbursable", description: "Expenses recoverable from clients." },
];

export const demoInvoices: WorkspaceInvoice[] = [
  {
    id: "inv-1",
    client_id: "client-1",
    invoice_number: "SL-204",
    title: "March Retainer",
    total_amount: 27500,
    due_date: "2026-03-29",
    status: "overdue",
    notes: "Follow-up drafted, awaiting response.",
  },
  {
    id: "inv-2",
    client_id: "client-2",
    invoice_number: "SL-205",
    title: "Brand Refresh Milestone 2",
    total_amount: 18000,
    due_date: "2026-04-07",
    status: "sent",
    notes: "Due tomorrow.",
  },
  {
    id: "inv-3",
    client_id: "client-3",
    invoice_number: "SL-203",
    title: "Growth Experiments Retainer",
    total_amount: 42000,
    due_date: "2026-04-15",
    status: "paid",
    notes: "Settled via bank transfer.",
  },
];

export const demoBills: WorkspaceBill[] = [
  {
    id: "bill-1",
    client_id: "client-1",
    project_id: "project-1",
    category_id: "cat-1",
    invoice_id: "inv-1",
    title: "Canva Pro",
    amount: 4200,
    bill_date: "2026-04-02",
    vendor_name: "Canva",
    status: "reimbursable",
    notes: "Attach to March retainer invoice.",
  },
  {
    id: "bill-2",
    client_id: "client-2",
    project_id: "project-2",
    category_id: "cat-3",
    title: "Freelance Illustration",
    amount: 7600,
    bill_date: "2026-04-01",
    vendor_name: "A. Kulkarni",
    status: "captured",
    notes: "Pending reimbursement decision.",
  },
  {
    id: "bill-3",
    client_id: "client-3",
    project_id: "project-3",
    category_id: "cat-2",
    title: "Client Workshop Travel",
    amount: 3900,
    bill_date: "2026-03-28",
    vendor_name: "IndiGo",
    status: "approved",
    notes: "Expense approved and logged.",
  },
];

export const demoActionItems = [
  "Send a payment reminder for invoice SL-204",
  "Review one unusually high travel expense from March 28",
  "Generate CA-ready monthly summary for March",
  "Verify two reimbursable Canva and Zoom charges",
];

const now = Date.now();

const makeMessage = (
  id: string,
  type: "user" | "bot",
  content: string,
  offsetMinutes: number
): Message => ({
  id,
  type,
  content,
  timestamp: new Date(now - offsetMinutes * 60 * 1000),
});

export const demoChats: Chat[] = [
  {
    id: "demo-chat-1",
    title: "March expense summary",
    timestamp: new Date(now - 30 * 60 * 1000),
    messages: [
      makeMessage(
        "demo-chat-1-user-1",
        "user",
        "Summarize my March spending for software, travel, and reimbursements.",
        34
      ),
      makeMessage(
        "demo-chat-1-bot-1",
        "bot",
        "March snapshot: Software `₹12,400`, Travel `₹8,900`, Reimbursements pending `₹4,800`. Biggest spend came from SaaS renewals and one intercity client trip.",
        33
      ),
    ],
  },
  {
    id: "demo-chat-2",
    title: "Overdue invoice follow-up",
    timestamp: new Date(now - 4 * 60 * 60 * 1000),
    messages: [
      makeMessage(
        "demo-chat-2-user-1",
        "user",
        "Draft a follow-up for Rahul's unpaid invoice due last week.",
        245
      ),
      makeMessage(
        "demo-chat-2-bot-1",
        "bot",
        "Here’s a polite follow-up: `Hi Rahul, just checking in on invoice #SL-204, which was due on March 29. Please let me know if you need me to resend it. Thanks.`",
        244
      ),
    ],
  },
];

export const getDemoConversationMessages = (
  conversationId: string,
  projectId?: string
): Message[] => {
  const existingChat = demoChats.find((chat) => chat.id === conversationId);
  if (existingChat) {
    return existingChat.messages;
  }

  if (projectId === "expense-capture-agent") {
    return [
      makeMessage(
        "expense-user-1",
        "user",
        "Paid ₹4,200 to Canva today for a client project.",
        15
      ),
      makeMessage(
        "expense-bot-1",
        "bot",
        "Captured: `Canva`, `₹4,200`, category `Software`, tagged to `Client Project`, status `Paid today`.",
        14
      ),
    ];
  }

  if (projectId === "invoice-followup-agent") {
    return [
      makeMessage(
        "invoice-user-1",
        "user",
        "Which invoices need follow-up this week?",
        20
      ),
      makeMessage(
        "invoice-bot-1",
        "bot",
        "Two invoices need attention: `SL-204 Rahul Media` overdue by 7 days and `SL-198 PixelNest` due tomorrow. I can draft reminders for both.",
        19
      ),
    ];
  }

  if (projectId === "finance-summary-agent") {
    return [
      makeMessage(
        "summary-user-1",
        "user",
        "Give me a quick monthly finance summary.",
        25
      ),
      makeMessage(
        "summary-bot-1",
        "bot",
        "This month: Income `₹1,48,000`, Expenses `₹38,600`, Reimbursements pending `₹6,300`, Net cash position `₹1,09,400` before tax.",
        24
      ),
    ];
  }

  return [];
};

export const getDemoBotReply = (input: string): string => {
  const prompt = input.toLowerCase();

  if (prompt.includes("invoice") || prompt.includes("follow-up")) {
    return "I found one overdue invoice and one upcoming due invoice. I can draft a reminder, summarize outstanding receivables, or prepare a client follow-up message.";
  }

  if (
    prompt.includes("receipt") ||
    prompt.includes("expense") ||
    prompt.includes("reimbursement")
  ) {
    return "That looks like an expense capture flow. In demo mode, I’d log the vendor, amount, date, and category, then mark whether it is billable or reimbursable.";
  }

  if (
    prompt.includes("summary") ||
    prompt.includes("report") ||
    prompt.includes("cash flow")
  ) {
    return "SoloLedger can turn scattered billing activity into a simple finance summary: income tracked, expenses categorized, reimbursements pending, and follow-ups queued.";
  }

  return "SoloLedger demo mode is active. I can help you simulate receipt capture, invoice generation, reimbursement tracking, overdue follow-ups, and monthly finance summaries.";
};
