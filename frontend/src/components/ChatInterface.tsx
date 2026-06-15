import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Mic,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  Square,
  Loader2,
  Check,
  X,
  Copy,
  File as FileIcon,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import StreamingText from "./StreamingText";
import ProcessingText from "./ProcessingText";
import MarkdownRenderer from "./MarkdownRenderer";
import { Message, LibraryItem, AttachedFile } from "@/types";
import { formatChatTime } from "@/lib/dateUtils";
import { apiService } from "@/services/apiService";
import { useAudio } from "@/hooks/useAudio";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { FileAttachmentButton, FilePreview } from "./FileAttachment";
import { useToast } from "@/hooks/use-toast";
import { DEMO_MODE } from "@/config/demo";

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (
    message: string,
    deepSearch?: boolean,
    filesInfo?: { ds_id: string; file_name: string; file?: File; file_url?: string }[],
    conversationId?: string
  ) => void;
  isFirstMessage: boolean;
  selectedAssistant?: LibraryItem | null;
  connectionStatus?: "connecting" | "connected" | "disconnected";
  isConnected?: boolean;
  isLoadingMessages?: boolean;
  onUpdateMessage?: (messageId: string, updates: Partial<Message>) => void;
  chatId?: string;
  clientId?: string;
  attachmentProgress?: Record<string, number>;
}

const WaveformBars: React.FC<{ waveform: number[]; isActive?: boolean }> = ({
  waveform,
  isActive = true,
}) => {
  return (
    <div className="flex gap-0.5 items-end h-9 w-full overflow-hidden">
      {waveform.map((level, i) => (
        <div
          key={i}
          className={`flex-1 rounded-sm transition-all duration-75 ${
            isActive && level > 0 ? "bg-primary" : "bg-muted-foreground"
          }`}
          style={{
            minWidth: "1px",
            height: Math.max(2, (level || 0) * 36),
          }}
        />
      ))}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isFirstMessage,
  selectedAssistant,
  connectionStatus = "disconnected",
  isConnected = false,
  isLoadingMessages = false,
  onUpdateMessage,
  chatId,
  clientId,
  attachmentProgress = {},
}) => {

  const [inputValue, setInputValue] = useState("");
  const [inputRows, setInputRows] = useState(1);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    {
      ds_id: string;
      file_name: string;
      size: number;
      conversation_id?: string;
      file_url?: string;
      content_type?: string;
    }[]
  >([]);
  const [conversationIdFromFiles, setConversationIdFromFiles] = useState<string | undefined>(undefined);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const [localReactions, setLocalReactions] = useState<
    Record<string, { is_liked?: boolean; is_disliked?: boolean }>
  >({});
  const [copiedMessages, setCopiedMessages] = useState<Record<string, boolean>>(
    {}
  );
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [submittedQuickReplies, setSubmittedQuickReplies] = useState<
    Record<string, string>
  >({});

  const {
    isLoadingAudio,
    isPlaying,
    handleAudio,
    stopAudio,
    stopAudioOnChange,
  } = useAudio();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const isAttachmentProcessing = useCallback(
    (file: File) => {
      const uploadedMatch = uploadedFiles.find((uf) => uf.file_name === file.name);
      if (!uploadedMatch) {
        return true;
      }

      const progress = attachmentProgress[uploadedMatch.ds_id] ?? 100;
      return progress < 100;
    },
    [attachmentProgress, uploadedFiles]
  );

  // Message action handlers
  const handleLike = async (messageId: string) => {
    setLocalReactions((prev) => ({
      ...prev,
      [messageId]: { is_liked: true, is_disliked: false },
    }));
    try {
      const response = await apiService.likeMessage(messageId, {
        is_liked: true,
        is_disliked: false,
      });
      if (response.data?.success && onUpdateMessage) {
        onUpdateMessage(messageId, { is_liked: true, is_disliked: false });
      }
    } catch (error) {
      console.error("Failed to like message:", error);
      setLocalReactions((prev) => ({ ...prev, [messageId]: {} }));
    }
  };

  const handleDislike = async (messageId: string) => {
    setLocalReactions((prev) => ({
      ...prev,
      [messageId]: { is_liked: false, is_disliked: true },
    }));
    try {
      const response = await apiService.likeMessage(messageId, {
        is_liked: false,
        is_disliked: true,
      });
      if (response.data?.success && onUpdateMessage) {
        onUpdateMessage(messageId, { is_liked: false, is_disliked: true });
      }
    } catch (error) {
      console.error("Failed to dislike message:", error);
      setLocalReactions((prev) => ({ ...prev, [messageId]: {} }));
    }
  };

  const handleCopy = async (content: string, messageId: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessages((prev) => ({ ...prev, [messageId]: true }));
      setTimeout(() => {
        setCopiedMessages((prev) => ({ ...prev, [messageId]: false }));
      }, 1000);
    } catch (error) {
      console.error("Failed to copy message:", error);
    }
  };

  // Placeholder text creation
  const getPlaceholderText = (isListening: boolean, isSpeaking: boolean) => {
    if (isListening) return;
    if (selectedAssistant)
      return `Ask anything from ${selectedAssistant.title}`;
    return "Ask anything";
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopAudio();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [stopAudio]);

  useEffect(() => {
    if (chatId) stopAudioOnChange(chatId);
  }, [chatId, stopAudioOnChange]);

  const prevChatIdRef = useRef<string | undefined>();
  useEffect(() => {
    if (prevChatIdRef.current && prevChatIdRef.current !== chatId) {
      stopAudio();
    }
    prevChatIdRef.current = chatId;
  }, [chatId, stopAudio]);

  // Speech recognition hook
  const {
    isListening,
    isSpeaking,
    speechSupported,
    micAvailable,
    micPermission,
    waveform,
    transcript,
    toggleSpeechRecognition,
    acceptRecording,
    cancelRecording,
  } = useSpeechRecognition({
    onTextUpdate: (txt) => setInputValue(txt),
    inputRef,
  });

  // reflect transcript into inputValue live (we already set via hook onTextUpdate)
  useEffect(() => {
    // ensure textarea resizes while listening/updating
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const scrollHeight = inputRef.current.scrollHeight;
      const minHeight = 50;
      const maxHeight = 120;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
      inputRef.current.style.height = newHeight + "px";
    }
  }, [inputValue, transcript, isSpeaking]);

  // Auto-resize when user types
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) {
      return;
    }

    if (isUploading) {
      toast({
        title: "Upload in progress",
        description: "Please wait for files to finish uploading.",
        variant: "destructive",
      });
      return;
    }

    if (inputValue.trim() || uploadedFiles.length > 0) {
      onSendMessage(
        inputValue.trim(),
        false,
        uploadedFiles.map((f, i) => ({
          ds_id: f.ds_id,
          file_name: f.file_name,
          file: attachments[i],
          file_url: f.file_url,
        })),
        conversationIdFromFiles
      );
      setInputValue("");
      setInputRows(1);
      setAttachments([]);
      setUploadedFiles([]);
      setConversationIdFromFiles(undefined);
      if (inputRef.current) inputRef.current.style.height = "50px";
      inputRef.current?.focus();
    }
  };

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (DEMO_MODE) {
        toast({
          title: "Demo mode",
          description: "File upload is disabled for now. You can still test receipt and invoice prompts through text.",
        });
        return;
      }

      if (!clientId) {
        toast({
          title: "Error",
          description: "Client ID missing. Cannot upload bill.",
          variant: "destructive",
        });
        return;
      }

      const conversationId = chatId || conversationIdFromFiles;

      if (!conversationId) {
        toast({
          title: "Start chat first",
          description: "Send a first message before uploading a bill.",
          variant: "destructive",
        });
        return;
      }

      // If file is not yet in attachments (it might be if it was pending), add it
      setAttachments((prev) => {
        if (prev.includes(file)) return prev;
        return [...prev, file];
      });

      setIsUploading(true);

      const formData = new FormData();
      formData.append("files", file);

      try {
        const response = await apiService.uploadFile(
          formData,
          clientId,
          conversationId
        );

        if (
          !response.data ||
          !response.data.files_info ||
          response.data.files_info.length === 0
        ) {
          throw new Error("Invalid response from server");
        }

        const uploadedFile = response.data.files_info[0];
        setUploadedFiles((prev) => [
          ...prev,
          {
            ds_id: uploadedFile.ds_id,
            file_name: uploadedFile.file_name || file.name,
            size: file.size,
            conversation_id: conversationId,
            file_url: uploadedFile.file_url,
            content_type: uploadedFile.content_type,
          },
        ]);
      } catch (error) {
        console.error("Upload failed:", error);
        toast({
          title: "Upload failed",
          description: "Failed to upload file. Please try again.",
          variant: "destructive",
        });
        setAttachments((prev) => prev.filter((f) => f !== file));
      } finally {
        setIsUploading(false);
      }
    },
    [chatId, clientId, conversationIdFromFiles, toast]
  );
  const handleRemoveAttachment = async (index: number) => {
    const fileToRemove = uploadedFiles[index];

    // Helpers to remove from state
    const removeFileFromState = () => {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const conversationIdToUse =
      fileToRemove?.conversation_id || chatId || conversationIdFromFiles;

    if (fileToRemove && fileToRemove.ds_id && clientId && conversationIdToUse) {
      try {
        await apiService.deleteAttachment(
          clientId,
          conversationIdToUse,
          fileToRemove.ds_id
        );
        removeFileFromState();
      } catch (error) {
        console.error("Failed to delete attachment from server:", error);
        toast({
          title: "Error removing file",
          description: "Could not remove file from server.",
          variant: "destructive",
        });
        removeFileFromState();
      }
    } else {
      // If it's a local file not yet uploaded or missing details, just remove it
      removeFileFromState();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      
      if (isUploading) {
        toast({
          title: "Upload in progress",
          description: "Please wait for files to finish uploading.",
          variant: "destructive",
        });
        return;
      }
      
      const hasProcessingFiles = attachments.some(isAttachmentProcessing);
      
      if (hasProcessingFiles) {
        toast({
          title: "File processing",
          description: "Please wait for files to finish processing.",
          variant: "destructive",
        });
        return;
      }
      
      handleSubmit(e as React.FormEvent);
    }
  };

  const parseQuickReplyOptions = (content: string) => {
    const financeUi = parseFinanceUiPayload(content);

    if (financeUi?.actions?.length) {
      return {
        type: "expense-action" as const,
        options: financeUi.actions.map((action: { id?: string; label?: string }) => action.id || action.label).filter(Boolean),
      };
    }

    if (financeUi?.categories?.length) {
      return {
        type: "category" as const,
        options: financeUi.categories,
      };
    }

    const categoryMatch = content.match(
      /Which category should I use\? Top recommendations:\s*(.+?)\./i
    );

    if (categoryMatch) {
      const options = categoryMatch[1]
        .split(",")
        .map((option) => option.trim())
        .filter(Boolean);

      return {
        type: "category" as const,
        options,
      };
    }

    if (
      /Reply "raise at month end" to save the expense for later invoicing, or "raise now" to save it and create an invoice now\./i.test(
        content
      )
    ) {
      return {
        type: "expense-action" as const,
        options: ["raise at month end", "raise now"],
      };
    }

    return null;
  };

  const parseFinanceUiPayload = (content: string) => {
    const match = content.match(/<finance-ui>([\s\S]*?)<\/finance-ui>/i);
    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[1]);
    } catch (error) {
      console.error("Failed to parse finance UI payload:", error);
      return null;
    }
  };

  const stripFinanceUiPayload = (content: string) =>
    content.replace(/<finance-ui>[\s\S]*?<\/finance-ui>/gi, "").trim();

  const formatCurrency = (value?: number | null) => {
    if (typeof value !== "number" || Number.isNaN(value)) {
      return null;
    }

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);
  };

  const renderExpenseCard = (
    expense: {
      title?: string;
      amount?: number;
      vendor_name?: string | null;
      category?: string;
      status?: string;
    },
    actions?: { id?: string; label?: string }[],
    messageId?: string
  ) => {
    const submittedValue = messageId ? submittedQuickReplies[messageId] : undefined;

    return (
      <div className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            {expense.title && (
              <p className="text-sm font-semibold text-foreground">{expense.title}</p>
            )}
            <div className="flex flex-wrap gap-2">
              {formatCurrency(expense.amount) && (
                <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                  {formatCurrency(expense.amount)}
                </Badge>
              )}
              {expense.vendor_name && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                  {expense.vendor_name}
                </Badge>
              )}
              {expense.category && (
                <Badge className="rounded-full px-3 py-1 text-xs">{expense.category}</Badge>
              )}
              {expense.status && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs capitalize">
                  {expense.status}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {actions && actions.length > 0 && messageId && (
          <div className="mt-4 flex flex-wrap gap-2">
            {actions.map((action) => {
              const value = action.id || action.label || "";
              return (
                <Button
                  key={value}
                  type="button"
                  variant="secondary"
                  onClick={() => submitQuickReply(messageId, value)}
                  disabled={Boolean(submittedValue)}
                  className={
                    submittedValue === value ? "opacity-100 ring-2 ring-primary/30" : ""
                  }
                >
                  {action.label || value}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderExpenseRaiseWidget = (
    payload: {
      title?: string;
      amount?: number;
      vendor_name?: string | null;
      category?: string;
      categories?: string[];
      create_category_name?: string;
      actions?: { id?: string; label?: string }[];
    },
    messageId: string
  ) => {
    const submittedValue = submittedQuickReplies[messageId];
    const categories = Array.isArray(payload.categories) ? payload.categories : [];
    const actions = Array.isArray(payload.actions) ? payload.actions : [];

    return (
      <div className="mt-3 max-w-[560px] space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4 text-foreground shadow-sm">
        <div className="space-y-1">
          <p className="text-[15px] font-medium tracking-[-0.01em] text-muted-foreground">
            New expense detected
          </p>
        </div>

        <div className="rounded-2xl border border-border/70 bg-background/80 px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[15px] font-medium text-muted-foreground">
                {payload.title || "Expense draft"}
              </p>
              {payload.vendor_name && (
                <p className="mt-1 truncate text-base font-semibold tracking-[-0.02em] text-foreground">
                  {payload.vendor_name}
                </p>
              )}
            </div>
            {formatCurrency(payload.amount) && (
              <p className="shrink-0 text-xl font-semibold tracking-[-0.03em] text-foreground">
                {formatCurrency(payload.amount)}
              </p>
            )}
          </div>
          {payload.category && (
            <div className="mt-2.5">
              <Badge className="rounded-full px-3 py-1 text-xs">
                {payload.category}
              </Badge>
            </div>
          )}
        </div>

        {categories.length > 0 && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-medium tracking-[-0.01em] text-muted-foreground">
              Assign a category
            </p>
            <div className="flex flex-wrap gap-2.5">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => submitQuickReply(messageId, category)}
                  disabled={Boolean(submittedValue)}
                  className={`rounded-full border px-4 py-2.5 text-[15px] font-semibold tracking-[-0.02em] transition ${
                    submittedValue === category
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  } disabled:cursor-not-allowed disabled:opacity-70`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {payload.create_category_name && (
          <div className="space-y-2.5">
            <p className="text-[15px] font-medium tracking-[-0.01em] text-muted-foreground">
              Or create a new one
            </p>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                submitQuickReply(messageId, `create category ${payload.create_category_name}`)
              }
              disabled={Boolean(submittedValue)}
              className={
                submittedValue === `create category ${payload.create_category_name}`
                  ? "opacity-100 ring-2 ring-primary/30"
                  : ""
              }
            >
              {`Create "${payload.create_category_name}"`}
            </Button>
          </div>
        )}

        {actions.length > 0 && (
          <div className="flex flex-wrap gap-2.5">
            {actions.map((action, index) => {
              const value = action.id || action.label || "";
              const isSelected = submittedValue === value;
              const isPrimary = index === 0;

              return (
                <Button
                  key={value}
                  type="button"
                  onClick={() => submitQuickReply(messageId, value)}
                  disabled={Boolean(submittedValue)}
                  className={`h-auto rounded-full px-4 py-2.5 text-[15px] font-semibold tracking-[-0.02em] ${
                    isSelected
                      ? "ring-2 ring-primary/30"
                      : ""
                  } ${
                    isPrimary
                      ? "bg-[#3d8be4] text-white hover:bg-[#377dd0]"
                      : "border border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {action.label || value}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderFinanceUi = (content: string, messageId: string) => {
    const payload = parseFinanceUiPayload(content);
    if (!payload) {
      return null;
    }

    if (payload.type === "expense-draft") {
      return renderExpenseRaiseWidget(
        {
          title: payload.title,
          amount: payload.amount,
          vendor_name: payload.vendor_name,
          category: payload.category,
          categories: payload.categories,
          actions: payload.actions,
        },
        messageId
      );
    }

    if (payload.type === "category-suggestion") {
      return renderExpenseRaiseWidget(
        {
          title: payload.title,
          amount: payload.amount,
          vendor_name: payload.vendor_name,
          categories: payload.categories,
          create_category_name: payload.create_category_name,
        },
        messageId
      );
    }

    if (payload.type === "category-created-assigned") {
      return renderExpenseCard(
        {
          title: payload.title,
          amount: payload.amount,
          vendor_name: payload.vendor_name,
          category: payload.category,
        },
        payload.actions,
        messageId
      );
    }

    if (payload.type === "expense-stored") {
      return renderExpenseCard(payload);
    }

    if (payload.type === "expense-and-invoice-created") {
      return (
        <div className="mt-3 space-y-3">
          {renderExpenseCard(payload.expense)}
          <div className="rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              {payload.invoice?.invoice_number && (
                <Badge className="rounded-full px-3 py-1 text-xs">
                  {payload.invoice.invoice_number}
                </Badge>
              )}
              {payload.invoice?.status && (
                <Badge variant="outline" className="rounded-full px-3 py-1 text-xs capitalize">
                  {payload.invoice.status}
                </Badge>
              )}
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {payload.invoice?.title || "Invoice created"}
            </p>
            {formatCurrency(payload.invoice?.total_amount) && (
              <p className="mt-1 text-sm text-muted-foreground">
                {formatCurrency(payload.invoice.total_amount)}
              </p>
            )}
            {payload.invoice?.file_url && (
              <div className="mt-3">
                <Button variant="outline" size="sm" asChild>
                  <a href={payload.invoice.file_url} target="_blank" rel="noreferrer">
                    {`Download ${payload.invoice?.file_name || "invoice.pdf"}`}
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      );
    }

    if (payload.type === "invoice-created") {
      return (
        <div className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            {payload.invoice_number && (
              <Badge className="rounded-full px-3 py-1 text-xs">{payload.invoice_number}</Badge>
            )}
            {payload.status && (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs capitalize">
                {payload.status}
              </Badge>
            )}
            {payload.period && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {payload.period}
              </Badge>
            )}
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">
            {payload.title || "Invoice created"}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {formatCurrency(payload.total_amount) && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {formatCurrency(payload.total_amount)}
              </Badge>
            )}
            {typeof payload.bill_count === "number" && (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {payload.bill_count} bill{payload.bill_count === 1 ? "" : "s"}
              </Badge>
            )}
          </div>
          {payload.file_url && (
            <div className="mt-3">
              <Button variant="outline" size="sm" asChild>
                <a href={payload.file_url} target="_blank" rel="noreferrer">
                  {`Download ${payload.file_name || "invoice.pdf"}`}
                </a>
              </Button>
            </div>
          )}
        </div>
      );
    }

    if (payload.type === "action-prompt") {
      return renderExpenseCard({ title: payload.title }, payload.actions, messageId);
    }

    if (payload.type === "empty-state") {
      return (
        <div className="mt-3 rounded-2xl border border-dashed border-border bg-background/60 p-4">
          <p className="text-sm font-semibold text-foreground">{payload.title}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {payload.subtitle && (
              <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                {payload.subtitle}
              </Badge>
            )}
            {payload.client_name && (
              <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                {payload.client_name}
              </Badge>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  const buildSubmittedQuickReplies = useCallback((allMessages: Message[]) => {
    const restoredReplies: Record<string, string> = {};

    allMessages.forEach((message, index) => {
      if (message.type !== "bot") {
        return;
      }

      const quickReply = parseQuickReplyOptions(message.content);
      if (!quickReply) {
        return;
      }

      for (let nextIndex = index + 1; nextIndex < allMessages.length; nextIndex += 1) {
        const nextMessage = allMessages[nextIndex];

        if (nextMessage.type === "bot") {
          break;
        }

        const normalizedReply = nextMessage.content.trim().toLowerCase();
        const matchedOption = quickReply.options.find(
          (option) => option.trim().toLowerCase() === normalizedReply
        );

        if (matchedOption) {
          restoredReplies[message.id] = matchedOption;
          break;
        }
      }
    });

    return restoredReplies;
  }, []);

  useEffect(() => {
    setSubmittedQuickReplies(buildSubmittedQuickReplies(messages));
  }, [buildSubmittedQuickReplies, messages, chatId]);

  const handleQuickReply = (message: string) => {
    onSendMessage(message);
  };

  const submitQuickReply = (messageId: string, value: string) => {
    if (submittedQuickReplies[messageId]) {
      return;
    }

    setSubmittedQuickReplies((prev) => ({
      ...prev,
      [messageId]: value,
    }));
    handleQuickReply(value);
  };

  // Connection status utils
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-green-500";
      case "connecting":
        return "bg-yellow-500";
      case "disconnected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "Connected";
      case "connecting":
        return "Connecting...";
      case "disconnected":
        return "Disconnected";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Connection Status Bar */}
      {connectionStatus === "connecting" && (
        <div className="bg-muted/50 border-b border-border px-4 py-2">
          <div className="flex items-center space-x-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${getConnectionStatusColor()}`}
            ></div>
            <span className="text-muted-foreground">
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center mb-8 max-w-2xl">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center animate-pulse">
                    <div style={{ width: 56, height: 56 }} />
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full animate-ping"
                    style={{
                      backgroundColor: "var(--primary-main)",
                      opacity: 0.6,
                    }}
                  ></div>
                </div>
              </div>
              <h1 className="text-4xl font-bold text-foreground mb-4 animate-fade-in">
                SoloLedger Workspace
              </h1>
              <p
                className="text-muted-foreground text-lg animate-fade-in"
                style={{ animationDelay: "0.2s" }}
              >
                Track expenses, follow up on invoices, and generate finance summaries from a chat-first workflow.
              </p>
            </div>

            <div className="w-full max-w-2xl grid gap-3 mb-6">
              {DEMO_MODE && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-sm text-primary">
                    Responses and workspace content are currently hardcoded so the frontend stays usable without the backend.
                </p>
              </div>
            )}
            </div>

            <div className="w-full max-w-2xl">
              <form onSubmit={handleSubmit} className="w-full">
                <div className="flex flex-col bg-chat-input border border-chat-input-border rounded-2xl px-4 py-3 shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                  {/* File Previews */}
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {attachments.map((file, i) => {
                        const uploadedFileMatch = uploadedFiles.find(
                          (uf) => uf.file_name === file.name
                        );
                        const currentProgress = uploadedFileMatch
                          ? attachmentProgress[uploadedFileMatch.ds_id] ?? 100
                          : 0;
                        const isProcessing = isAttachmentProcessing(file);

                        return (
                          <FilePreview
                            key={i}
                            file={file}
                            onRemove={() => handleRemoveAttachment(i)}
                            progress={currentProgress}
                            uploading={isProcessing}
                          />
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center">
                    {isListening ? (
                      <div className="flex-1 flex items-center">
                        <div className="w-full">
                          <WaveformBars waveform={waveform} isActive />
                        </div>
                      </div>
                    ) : (
                      <Textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyPress}
                        placeholder={getPlaceholderText(
                          isListening,
                          isSpeaking
                        )}
                        className={`
  flex-1 text-lg bg-transparent border-none shadow-none outline-none
  focus:ring-0 focus:outline-none focus:border-transparent resize-none 
  focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent
  
  transition-colors duration-0
  
  ${isSpeaking ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20" : ""}
`}
                        rows={inputRows}
                        style={{
                          minHeight: "40px",
                          maxHeight: "100px",
                          outline: "none !important",
                          border: "none !important",
                          boxShadow: "none !important",
                          WebkitAppearance: "none",
                          MozAppearance: "none",
                        }}
                      />
                    )}

                    <div className="flex items-center space-x-2 ml-3">
                      {isListening ? (
                        // Listening controls (unchanged)
                        <>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 bg-green-500 text-white rounded-lg"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              acceptRecording();
                            }}
                            title="Accept"
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 bg-red-500 text-white rounded-lg"
                            onClick={cancelRecording}
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <FileAttachmentButton
                            onFileSelect={handleFileSelect}
                            disabled={isUploading}
                          />

                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 text-muted-foreground hover:bg-muted rounded-lg"
                            onClick={() => toggleSpeechRecognition()}
                            title="Voice Input"
                          >
                            <Mic className="w-4 h-4" />
                          </Button>

                          <Button
                            type="submit"
                            size="sm"
                            className="w-8 h-8 p-0 bg-primary hover:opacity-90 rounded-lg"
                            disabled={
                              (!inputValue.trim() &&
                                uploadedFiles.length === 0) ||
                              connectionStatus === "connecting" ||
                              isUploading ||
                              attachments.some(isAttachmentProcessing)
                            }
                          >
                            <Send className="w-4 h-4 text-white" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto p-4 space-y-6">
            {isLoadingMessages ? (
              <div className="flex justify-center items-center py-8">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading messages...</span>
                </div>
              </div>
            ) : (
              messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-4 rounded-2xl ${
                      message.type === "user"
                        ? "max-w-[80%] bg-chat-bubble-user text-white ml-auto"
                        : "max-w-[90%] bg-chat-bubble-bot text-foreground"
                    }`}
                  >
                    {message.type === "bot" && message.isLoading ? (
                      <div className="text-left">
                        <ProcessingText
                          text={
                            message.processingText ||
                            "Processing your request..."
                          }
                        />
                      </div>
                    ) : message.type === "bot" && message.isStreaming ? (
                      <div className="text-left">
                        <StreamingText
                          text={message.content}
                          shouldAnimate={index === messages.length - 1}
                        />
                      </div>
                    ) : (
                      <div className="text-left">
                        {/* Attachments Display */}
                        {message.attachments &&
                          message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-3 mb-3 justify-end">
                              {message.attachments.map((att, i) => (
                                <div
                                  key={i}
                                  className="group relative p-1.5 rounded-xl shadow-sm border border-border/5 w-32 flex-shrink-0 cursor-pointer hover:shadow-md transition-all duration-200"
                                >
                                  {(() => {
                                    const fileName =
                                      att.file_name || att.filename || "";
                                    const isImage = att.file
                                      ? att.file.type.startsWith("image/")
                                      : /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(
                                          fileName
                                        ) ||
                                        (att.url &&
                                          /\.(jpg|jpeg|png|gif|webp|bmp|svg)\?/i.test(
                                            att.url
                                          ));

                                    if (isImage) {
                                      const imgSrc = att.file
                                        ? URL.createObjectURL(att.file)
                                        : att.url;
                                      return (
                                        <div className="aspect-[3/4] w-full bg-slate-100 rounded-lg overflow-hidden relative">
                                          <img
                                            src={imgSrc}
                                            alt={fileName}
                                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (imgSrc)
                                                setExpandedImage(imgSrc);
                                            }}
                                            onLoad={(e) => {
                                              if (att.file) {
                                                URL.revokeObjectURL(
                                                  (e.target as HTMLImageElement)
                                                    .src
                                                );
                                              }
                                            }}
                                          />
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <div className="aspect-[3/4] w-full bg-slate-100 rounded-lg flex flex-col items-center justify-center p-2 text-center">
                                          <FileIcon className="w-8 h-8 text-slate-400 mb-2" />
                                          <span className="text-[10px] text-slate-500 font-medium truncate w-full px-1">
                                            {fileName}
                                          </span>
                                        </div>
                                      );
                                    }
                                  })()}
                                </div>
                              ))}
                            </div>
                          )}
                        {renderFinanceUi(message.content, message.id)}
                        {stripFinanceUiPayload(message.content) && (
                          <MarkdownRenderer content={stripFinanceUiPayload(message.content)} />
                        )}
                        {message.type === "bot" &&
                          !message.isLoading &&
                          !message.isStreaming &&
                          (() => {
                            if (parseFinanceUiPayload(message.content)) {
                              return null;
                            }

                            const quickReply = parseQuickReplyOptions(
                              message.content
                            );

                            if (!quickReply) {
                              return null;
                            }

                            if (quickReply.type === "category") {
                              const submittedValue =
                                submittedQuickReplies[message.id];

                              return (
                                <div className="mt-4 flex flex-wrap gap-2">
                                  {quickReply.options.map((option) => (
                                    <Button
                                      key={option}
                                      type="button"
                                      variant="secondary"
                                      onClick={() =>
                                        submitQuickReply(message.id, option)
                                      }
                                      disabled={Boolean(submittedValue)}
                                      className={
                                        submittedValue === option
                                          ? "opacity-100 ring-2 ring-primary/30"
                                          : ""
                                      }
                                    >
                                      {option}
                                    </Button>
                                  ))}
                                </div>
                              );
                            }

                            const submittedValue =
                              submittedQuickReplies[message.id];

                            return (
                              <div className="mt-4 flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() =>
                                    submitQuickReply(
                                      message.id,
                                      "raise at month end"
                                    )
                                  }
                                  disabled={Boolean(submittedValue)}
                                  className={
                                    submittedValue === "raise at month end"
                                      ? "opacity-100 ring-2 ring-primary/30"
                                      : ""
                                  }
                                >
                                  Raise at month end
                                </Button>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  onClick={() =>
                                    submitQuickReply(
                                      message.id,
                                      "raise now"
                                    )
                                  }
                                  disabled={Boolean(submittedValue)}
                                  className={
                                    submittedValue === "raise now"
                                      ? "opacity-100 ring-2 ring-primary/30"
                                      : ""
                                  }
                                >
                                  Raise now
                                </Button>
                              </div>
                            );
                          })()}
                      </div>
                    )}

                    {message.type === "bot" &&
                      !message.isLoading &&
                      !message.isStreaming && (
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/30">
                          <TooltipProvider>
                            <div className="flex items-center space-x-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      handleCopy(message.content, message.id)
                                    }
                                    className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                                  >
                                    {copiedMessages[message.id] ? (
                                      <Check className="w-4 h-4 text-green-500" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {copiedMessages[message.id]
                                      ? "Copied!"
                                      : "Copy response"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleLike(message.id)}
                                    className={`p-1 rounded-full hover:bg-muted transition-colors ${
                                      localReactions[message.id]?.is_liked ??
                                      message.is_liked
                                        ? "text-blue-500"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Good response</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleDislike(message.id)}
                                    className={`p-1 rounded-full hover:bg-muted transition-colors ${
                                      localReactions[message.id]?.is_disliked ??
                                      message.is_disliked
                                        ? "text-red-500"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Bad response</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() =>
                                      !isListening && handleAudio(message.id)
                                    }
                                    className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground"
                                    disabled={isListening}
                                  >
                                    {isLoadingAudio[message.id] ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : isPlaying[message.id] ? (
                                      <Square className="w-4 h-4" />
                                    ) : (
                                      <Volume2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>
                                    {isPlaying[message.id]
                                      ? "Stop listening"
                                      : "Read loud"}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>

                          <div className="text-xs opacity-70 text-muted-foreground">
                            {formatChatTime(message.timestamp)}
                          </div>
                        </div>
                      )}

                    {message.type === "user" && (
                      <div className="text-xs mt-2 opacity-70 text-white text-right">
                        {formatChatTime(message.timestamp)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Bottom Input (when there are messages) */}
      {messages.length > 0 && (
        <div className="border-t border-border p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="w-full">
              <div className="flex flex-col bg-chat-input border border-chat-input-border rounded-2xl px-4 py-3 shadow-sm focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                {/* File Previews */}
                {attachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {attachments.map((file, i) => {
                      const uploadedFileMatch = uploadedFiles.find(
                        (uf) => uf.file_name === file.name
                      );
                      const currentProgress = uploadedFileMatch
                        ? attachmentProgress[uploadedFileMatch.ds_id] ?? 100
                        : 0;
                      const isProcessing = isAttachmentProcessing(file);

                      return (
                        <FilePreview
                          key={i}
                          file={file}
                          onRemove={() => handleRemoveAttachment(i)}
                          progress={currentProgress}
                          uploading={isProcessing}
                        />
                      );
                    })}
                  </div>
                )}

                <div className="flex items-center">
                  {isListening ? (
                    <div className="flex-1 flex items-center">
                      <div className="w-full">
                        <WaveformBars waveform={waveform} isActive />
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      ref={inputRef}
                      value={inputValue}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyPress}
                      placeholder={getPlaceholderText(isListening, isSpeaking)}
                      className={`
    flex-1 text-lg bg-transparent border-none shadow-none outline-none
    focus:ring-0 focus:outline-none focus:border-transparent resize-none 
    focus-visible:ring-0 focus-visible:outline-none focus-visible:border-transparent
    
    transition-colors duration-0
    
    ${
      isSpeaking ? "ring-2 ring-green-500 bg-green-50 dark:bg-green-900/20" : ""
    }
  `}
                      rows={inputRows}
                      style={{
                        minHeight: "40px",
                        maxHeight: "100px",
                        outline: "none !important",
                        border: "none !important",
                        boxShadow: "none !important",
                        WebkitAppearance: "none",
                        MozAppearance: "none",
                      }}
                    />
                  )}

                  <div className="flex items-center space-x-2 ml-3">
                    {isListening ? (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 bg-green-500 text-white rounded-lg"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            acceptRecording();
                          }}
                          title="Accept"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 bg-red-500 text-white rounded-lg"
                          onClick={cancelRecording}
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <FileAttachmentButton
                          onFileSelect={handleFileSelect}
                          disabled={isUploading}
                        />

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 text-muted-foreground hover:bg-muted rounded-lg"
                          onClick={() => toggleSpeechRecognition()}
                          title="Voice Input"
                        >
                          <Mic className="w-4 h-4" />
                        </Button>

                        <Button
                          type="submit"
                          size="sm"
                          className="w-8 h-8 p-0 bg-primary hover:opacity-90 rounded-lg"
                          disabled={
                            (!inputValue.trim() &&
                              uploadedFiles.length === 0) ||
                            connectionStatus === "connecting" ||
                            isUploading
                          }
                        >
                          <Send className="w-4 h-4 text-white" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
      <Dialog
        open={!!expandedImage}
        onOpenChange={(open) => !open && setExpandedImage(null)}
      >
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0 bg-transparent border-none shadow-none flex items-center justify-center overflow-hidden">
          {expandedImage && (
            <div className="relative w-full h-full flex items-center justify-center">
              <button
                onClick={() => setExpandedImage(null)}
                className="absolute top-4 right-4 z-50 w-8 h-8 bg-black text-white rounded flex items-center justify-center hover:bg-black/90 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <img
                src={expandedImage}
                alt="Expanded view"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ChatInterface;
