import { LibraryItem } from '@/types';
import { httpService } from './httpService';
import {
  InvoiceTemplateRecord,
  WorkspaceBill,
  WorkspaceCategory,
  WorkspaceClient,
  WorkspaceInvoice,
  WorkspaceProject,
} from '@/types';

interface ActivationRequest {
  invitation_token: string;
}

interface ActivationResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  data?: Record<string, unknown>;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface SignUpRequest {
  email: string;
  password: string;
  confirm_password: string;
  first_name?: string | null;
  last_name?: string | null;
}

interface LoginResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  auth_url?: string;
  user?: {
    id: string;
    email: string;
    name?: string;
  };
}

interface SignUpResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  email?: string;
  verification_email_sent?: boolean;
}

interface RefreshTokenResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

interface ResetPasswordRequest {
  old_password: string;
  new_password: string;
  confirm_password: string;
}

interface ResetPasswordResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ForgotPasswordResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  reset_url?: string;
}

interface UpdatePasswordRequest {
  new_password: string;
  confirm_password: string;
}

interface UpdatePasswordResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
}

interface VerifyEmailResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
}

interface LibraryDetailsResponse {
  success?: boolean;
  status?: number;
  message?: string;
  error?: string;
  projects?: {
    project_id: string;
    project_name: string;
    persona_type: string;
    role: string;
    assigned_at: string;
  }[];
  total_count?: number;
}

interface ConversationSummaryResponse {
  id: string;
  client_id: string;
  owner_id: string;
  title?: string | null;
  client_name?: string | null;
  created_at: string;
  updated_at: string;
}

interface ConversationMessageResponse {
  id: string;
  conversation_id: string;
  user_message: string;
  assistant_message?: string | null;
  created_at: string;
  updated_at: string;
  attachments?: {
    id: string;
    client_id: string;
    conversation_id: string;
    chat_id?: string | null;
    file_name: string;
    content_type?: string | null;
    file_url: string;
  }[];
}

interface UserProfileResponse {
  success?: boolean;
  profile?: {
    email: string;
    first_name: string;
    last_name: string;
    profile_image_url: string | null;
    is_gmail_connected?: boolean;
    is_outlook_connected?: boolean;
    gmail_account_email?: string | null;
    outlook_account_email?: string | null;
    address?: string | null;
    pincode?: string | null;
  };
}

interface MailConnectResponse {
  success?: boolean;
  message?: string;
  auth_url?: string;
  authorization_url?: string;
}

interface MailDisconnectResponse {
  success?: boolean;
  message?: string;
}

interface UpdateProfileResponse {
  success?: boolean;
  message?: string;
}

interface ToggleFavoriteResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

interface LikeMessageResponse {
  success?: boolean;
  message?: string;
  error?: string;
}

interface UploadFileResponse {
  success?: boolean;
  message?: string;
  error?: string;
  files_info?: {
    file_name: string;
    ds_id: string;
    file_url: string;
    content_type?: string;
  }[];
  conversation_id?: string;
}

interface ClientCreateRequest {
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
  status?: string;
}

interface ProjectCreateRequest {
  client_id: string;
  name: string;
  description?: string | null;
  status?: string;
  budget_amount?: number | null;
}

interface CategoryCreateRequest {
  name: string;
  description?: string | null;
}

interface InvoiceCreateRequest {
  client_id: string;
  invoice_number: string;
  title: string;
  total_amount: number;
  due_date?: string | null;
  status?: string;
  notes?: string | null;
  template_snapshot?: Record<string, unknown> | null;
}

interface InvoiceTemplateUpsertRequest {
  name: string;
  template_json: Record<string, unknown>;
}

interface BillCreateRequest {
  client_id: string;
  project_id?: string | null;
  category_id: string;
  invoice_id?: string | null;
  title: string;
  amount: number;
  bill_date?: string | null;
  vendor_name?: string | null;
  file_path?: string | null;
  status?: string;
  notes?: string | null;
}

class ApiService {

  async verifyInvitationToken(request: ActivationRequest) {
    return httpService.patch<ActivationResponse>('/auth/eu/verify-invitation-token/', request);
  }

  async validateToken(token: string) {
    return httpService.get<{ valid: boolean; email?: string }>(`/validate-token/${token}`);
  }

  async login(request: LoginRequest) {
    return httpService.post<LoginResponse>('/auth/eu/login/', request);
  }

  async signup(request: SignUpRequest) {
    return httpService.post<SignUpResponse>('/auth/eu/signup/', request);
  }

  async ssoLogin() {
    return httpService.get<LoginResponse>('/auth/sso/login/');
  }

  async refreshToken() {
    return httpService.post<RefreshTokenResponse>('/auth/refresh');
  }

  async resetPassword(request: ResetPasswordRequest) {
    return httpService.post<ResetPasswordResponse>('/auth/eu/change-password/', request);
  }

  async forgotPassword(request: ForgotPasswordRequest) {
    return httpService.post<ForgotPasswordResponse>('/auth/forgot-password/', request);
  }

  async updatePassword(token: string, request: UpdatePasswordRequest) {
    return httpService.post<UpdatePasswordResponse>(`/auth/reset-password/${token}/`, request);
  }

  async verifyEmail(token: string) {
    return httpService.post<VerifyEmailResponse>(`/auth/verify-email/${token}/`, {});
  }

  async getChats() {
    return httpService.get<ConversationSummaryResponse[]>('/chat/conversations');
  }


  async getConversationMessages(conversationId: string) {
    return httpService.get<ConversationMessageResponse[]>(`/chat/conversations/${conversationId}/messages`);
  }

  async deleteConversation(conversationId: string) {
    return httpService.delete<void>(`/chat/conversations/${conversationId}`);
  }

  async getUserProfile() {
    return httpService.get<UserProfileResponse>('/projects/end-user-profile/');
  }

  async updateProfile(formData: FormData) {
    return httpService.patch<UpdateProfileResponse>('/projects/end-user-profile/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async likeMessage(messageId: string, payload: { is_liked: boolean; is_disliked: boolean }) {
    return httpService.patch<LikeMessageResponse>(`/chat/like-response/${messageId}`, payload);
  }

  async uploadFile(formData: FormData, clientId: string, conversationId: string) {
    const url = `/chat/upload-attachment-file/${clientId}/${conversationId}/`;
      
    return httpService.post<UploadFileResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000,
    });
  }

  async deleteAttachment(clientId: string, conversationId: string, dsId: string) {
    return httpService.delete<{ success: boolean; message?: string }>(
      `/chat/delete-attachment-file/${clientId}/${conversationId}/${dsId}/`,
      {
        timeout: 30000,
      }
    );
  }

  async connectGmail() {
    return httpService.post<MailConnectResponse>('/mail/gmail/connect', {});
  }

  async connectOutlook() {
    return httpService.post<MailConnectResponse>('/mail/outlook/connect', {});
  }

  async disconnectGmail() {
    return httpService.delete<MailDisconnectResponse>('/mail/gmail/disconnect');
  }

  async disconnectOutlook() {
    return httpService.delete<MailDisconnectResponse>('/mail/outlook/disconnect');
  }

  async listClients() {
    return httpService.get<WorkspaceClient[]>('/clients');
  }

  async createClient(payload: ClientCreateRequest) {
    return httpService.post<WorkspaceClient>('/clients', payload);
  }

  async listProjects() {
    return httpService.get<WorkspaceProject[]>('/projects');
  }

  async createProject(payload: ProjectCreateRequest) {
    return httpService.post<WorkspaceProject>('/projects', payload);
  }

  async listCategories() {
    return httpService.get<WorkspaceCategory[]>('/categories');
  }

  async createCategory(payload: CategoryCreateRequest) {
    return httpService.post<WorkspaceCategory>('/categories', payload);
  }

  async listInvoices() {
    return httpService.get<WorkspaceInvoice[]>('/invoices');
  }

  async createInvoice(payload: InvoiceCreateRequest) {
    return httpService.post<WorkspaceInvoice>('/invoices', payload);
  }

  async getDefaultInvoiceTemplate() {
    return httpService.get<InvoiceTemplateRecord>('/invoice-templates/default');
  }

  async updateDefaultInvoiceTemplate(payload: InvoiceTemplateUpsertRequest) {
    return httpService.put<InvoiceTemplateRecord>('/invoice-templates/default', payload);
  }

  async uploadDefaultInvoiceTemplateLogo(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return httpService.post<InvoiceTemplateRecord>('/invoice-templates/default/logo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 120000,
    });
  }

  async fetchDefaultInvoiceTemplateLogoBlob() {
    return httpService.get<Blob>('/invoice-templates/default/logo', {
      responseType: 'blob',
    });
  }

  async listBills() {
    return httpService.get<WorkspaceBill[]>('/bills');
  }

  async createBill(payload: BillCreateRequest) {
    return httpService.post<WorkspaceBill>('/bills', payload);
  }

}

export const apiService = new ApiService();
export default ApiService;
