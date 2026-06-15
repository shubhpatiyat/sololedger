import React from 'react';

export interface LibraryItem {
  id: number;
  project_id: string;
  title: string;
  description: string;
  type: string;
  icon: string;
  category: string;
  starred: boolean;
  lastAccessed: string;
}

export interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isLoading?: boolean;
  processingText?: string;
  is_liked?: boolean;
  is_disliked?: boolean;
  deep_search?: boolean;
  attachments?: AttachedFile[];
}

export interface AttachedFile {
  ds_id: string;
  filename: string;
  file_name?: string; // Added for consistency
  size: number;
  type?: string;
  progress?: number;
  file?: File;
  url?: string;
  conversation_id?: string;
}

export interface Chat {
  id: string;
  clientId?: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

export interface WorkspaceClient {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  notes?: string | null;
  status: string;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceProject {
  id: string;
  client_id: string;
  name: string;
  description?: string | null;
  status: string;
  budget_amount?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceCategory {
  id: string;
  name: string;
  description?: string | null;
  owner_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceInvoice {
  id: string;
  client_id: string;
  invoice_number: string;
  title: string;
  total_amount: number;
  due_date?: string | null;
  status: string;
  notes?: string | null;
  template_snapshot?: InvoiceTemplateData | null;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceTemplateData {
  version: number;
  branding: {
    logo_url?: string | null;
    logo_path?: string | null;
    brand_color: string;
    font_family: "modern" | "serif" | "mono";
  };
  layout: {
    style: "standard" | "minimal";
    show_fields: {
      notes: boolean;
      payment_details: boolean;
      due_date: boolean;
      tax_breakdown: boolean;
    };
  };
  labels: {
    invoice_title: string;
    balance_due_label: string;
  };
  defaults: {
    notes?: string;
    terms?: string;
  };
}

export interface InvoiceTemplateRecord {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  template_json: InvoiceTemplateData;
  created_at?: string;
  updated_at?: string;
}

export interface WorkspaceBill {
  id: string;
  client_id: string;
  project_id?: string | null;
  category_id: string;
  invoice_id?: string | null;
  title: string;
  amount: number;
  bill_date?: string | null;
  vendor_name?: string | null;
  file_path?: string | null;
  status: string;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}
