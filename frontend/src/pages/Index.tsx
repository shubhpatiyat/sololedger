import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, useLocation, useOutletContext } from "react-router-dom";
import ChatInterface from "@/components/ChatInterface";
import Library from "@/components/Library";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Message, Chat, LibraryItem } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { DEMO_MODE } from "@/config/demo";
import { getDemoBotReply } from "@/data/demoContent";
import { LayoutOutletContext } from "@/components/Layout";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { chatId, projectId } = useParams<{
    chatId?: string;
    projectId?: string;
  }>();
  const { toast } = useToast();

  const isLibraryChat = Boolean(projectId);

  const currentView = location.pathname.includes("/library")
    ? "library"
    : "chat";
  const [currentChatId, setCurrentChatId] = useState<string | undefined>(
    chatId
  );
  const [selectedAssistant, setSelectedAssistant] =
    useState<LibraryItem | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachmentProgress, setAttachmentProgress] = useState<
    Record<string, number>
  >({});
  const [conversationIdFromUpload, setConversationIdFromUpload] = useState<
    string | undefined
  >(undefined);

  const skipInitialFetchRef = React.useRef(false);

  const {
    chats,
    error: chatsError,
    addChat,
    fetchConversationMessages,
    isLoadingMessages,
    messagesError,
    refetchChats,
  } = useOutletContext<LayoutOutletContext>();

  const currentChatClientId =
    chats.find((chat) => chat.id === (currentChatId || chatId))?.clientId;

  useEffect(() => {
    if (chatsError) {
      toast({
        title: "Error loading chats",
        description: chatsError,
        variant: "destructive",
      });
    }
  }, [chatsError, toast]);

  useEffect(() => {
    if (messagesError) {
      toast({
        title: "Error loading messages",
        description: messagesError,
        variant: "destructive",
      });
    }
  }, [messagesError, toast]);

  useEffect(() => {
    if (chatId) {
      if (chatId !== currentChatId) {
        setCurrentChatId(chatId);
      }
      if (conversationIdFromUpload) {
        setConversationIdFromUpload(undefined);
      }

      if (skipInitialFetchRef.current) {
        skipInitialFetchRef.current = false;
        return;
      }

      if (messages.length === 0 || chatId !== currentChatId) {
        const loadMessages = async () => {
          try {
            const loadedMessages = await fetchConversationMessages(
              chatId,
              isLibraryChat ? projectId : undefined
            );
            setMessages(loadedMessages);
          } catch (error) {
            console.error("Failed to load messages for chat:", chatId, error);
          }
        };
        loadMessages();
      }
    } else if (!chatId && currentChatId) {
      if (skipInitialFetchRef.current) {
        return;
      }
      setCurrentChatId(undefined);
      setMessages([]);
    }
  }, [
    chatId,
    currentChatId,
    fetchConversationMessages,
    isLibraryChat,
    projectId,
    messages.length,
    conversationIdFromUpload,
  ]);

  useEffect(() => {
    if (chatId && currentChatId === chatId && messages.length === 0) {
      const chat = chats.find((c) => c.id === chatId);
      if (chat && chat.messages.length > 0) {
        setMessages(chat.messages);
      }
    }
  }, [chats, chatId, currentChatId, messages.length]);

  useEffect(() => {
    if (chatId && !currentChatId) {
      setCurrentChatId(chatId);
    }
  }, [chatId, currentChatId]);

  const handleMessageUpdate = useCallback((message: Message) => {
    setMessages((prev) => {
      const existingIndex = prev.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        const newMessages = [...prev];
        const existingMessage = newMessages[existingIndex];

        if (existingMessage.type === "user" && message.type === "bot") {
          console.warn(
            "Attempted to replace user message with bot message, ignoring update"
          );
          return prev;
        }

        newMessages[existingIndex] = message;
        return newMessages;
      } else {
        if (message.type === "bot") {
          const loadingBotIndex = prev.findIndex(
            (m) => m.type === "bot" && (m.isLoading || m.isStreaming)
          );

          if (loadingBotIndex >= 0) {
            const newMessages = [...prev];
            newMessages[loadingBotIndex] = {
              ...newMessages[loadingBotIndex],
              ...message,
            };
            return newMessages;
          }
        }

        return [...prev, message];
      }
    });
  }, []);

  const handleAttachmentProgress = useCallback(
    (progress: number, filename: string, ds_id?: string) => {
      setAttachmentProgress((prev) => ({
        ...prev,
        [ds_id || filename]: progress,
      }));
    },
    []
  );

  const handleStreamComplete = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const handleConversationIdReceived = useCallback(
    (conversationId: string) => {

      const isLocalSkipping = skipInitialFetchRef.current;

      if (currentChatId === conversationId) return;

      const chatAlreadyExists = chats.some((chat) => chat.id === conversationId);

      if (conversationIdFromUpload === conversationId) {
        setConversationIdFromUpload(undefined);
      }

      const firstUserMessage = messages.find((m) => m.type === "user");
      const chatTitle = firstUserMessage
        ? firstUserMessage.content.substring(0, 50) +
          (firstUserMessage.content.length > 50 ? "..." : "")
        : "New Chat";

      const newChat: Chat = {
        id: conversationId,
        clientId: chats.find((chat) => chat.id === currentChatId)?.clientId,
        title: chatTitle,
        timestamp: new Date(),
        messages: messages,
      };

      addChat(newChat);

      if (isLocalSkipping) {
        setCurrentChatId(conversationId);
        // Only refetch if chat doesn't already exist
        if (!chatAlreadyExists) {
          refetchChats();
        }
        skipInitialFetchRef.current = false;
        return;
      }
      
      if (!chatAlreadyExists) {
        refetchChats();
      }

      if (isLibraryChat && projectId) {
        navigate(`/chat/${projectId}/${conversationId}`, { replace: true });
      } else {
        navigate(`/chat/${conversationId}`, { replace: true });
      }
    },
    [
      currentChatId,
      messages,
      addChat,
      refetchChats,
      isLibraryChat,
      projectId,
      navigate,
      conversationIdFromUpload,
      chats,
    ]
  );

  const {
    sendMessage: sendStreamMessage,
    sendStartAttachedFiles,
    disconnect,
    connectionStatus,
    isConnected,
  } = useWebSocket({
    onMessageUpdate: handleMessageUpdate,
    onStreamComplete: handleStreamComplete,
    onConnectionStatusChange: (status) => {},
    onAttachmentProgress: handleAttachmentProgress,
    onMessageIdReceived: (messageId, oldMessageId) => {
      if (oldMessageId) {
        setMessages((prev) =>
          prev.map((msg) => {
            if (msg.id === oldMessageId) {
              return { ...msg, id: messageId };
            }
            return msg;
          })
        );
      }
    },
    onError: (error) => {
      console.error("WebSocket error:", error);

      toast({
        title: "Error",
        description: error || "An error occurred while processing your message",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        type: "bot",
        content: `**Error:** ${
          error || "An error occurred while processing your message"
        }`,
        timestamp: new Date(),
        isStreaming: false,
        isLoading: false,
      };

      setMessages((prev) => [...prev, errorMessage]);
    },
    onConversationIdReceived: handleConversationIdReceived,
    chatId: currentChatId || conversationIdFromUpload,
    projectId: isLibraryChat ? projectId : undefined,
  });


  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const handleNewChat = () => {
    navigate("/");
    setCurrentChatId(undefined);
    setMessages([]);
    setSelectedAssistant(null);
  };

  const handleSendMessage = async (
    content: string,
    deepSearch?: boolean,
    filesInfo?: { ds_id: string; file_name: string; file?: File; file_url?: string }[],
    conversationIdFromFiles?: string
  ) => {
    const normalizedContent = content.trim();
    const displayContent =
      normalizedContent ||
      (filesInfo?.length
        ? filesInfo.length === 1
          ? "Uploaded a bill"
          : `Uploaded ${filesInfo.length} bills`
        : "");
    const tempMessageId = Date.now().toString();
    const userMessage: Message = {
      id: tempMessageId,
      type: "user",
      content: displayContent,
      timestamp: new Date(),
      isStreaming: false,
      deep_search: deepSearch,
      attachments: filesInfo?.map((f) => ({
        ds_id: f.ds_id,
        filename: f.file_name,
        size: f.file?.size || 0,
        file: f.file,
        type: f.file?.type,
        url: f.file_url,
        conversation_id: conversationIdFromFiles,
      })),
    };

    setMessages((prev) => [...prev, userMessage]);

    if (filesInfo) {
      setAttachmentProgress((prev) => {
        const next = { ...prev };
        filesInfo.forEach((f) => delete next[f.file_name]);
        return next;
      });
    }

    const conversationIdToUse = conversationIdFromFiles || currentChatId || conversationIdFromUpload;
    if (DEMO_MODE) {
      const demoConversationId = conversationIdToUse || `demo-local-${Date.now()}`;

      if (!currentChatId && !conversationIdFromUpload) {
        handleConversationIdReceived(demoConversationId);
      }

      window.setTimeout(() => {
        const botMessage: Message = {
          id: `demo-bot-${Date.now()}`,
          type: "bot",
          content: getDemoBotReply(content),
          timestamp: new Date(),
          isStreaming: false,
        };

        setMessages((prev) => [...prev, botMessage]);
      }, 400);
      return;
    }

    await sendStreamMessage(
      normalizedContent,
      tempMessageId,
      deepSearch,
      filesInfo,
      conversationIdToUse
    );
  };

  const handleCloseLibrary = () => {
    navigate("/");
  };

  const handleStartConversation = (assistant: LibraryItem) => {
    setSelectedAssistant(assistant);
    setMessages([]);
    navigate(`/chat/${assistant.project_id}/conversations`);
  };

  // const handleDeleteChat = async (chatId: string) => {
  //   try {
  //     await deleteChatFromServer(chatId);

  //     if (currentChatId === chatId) {
  //       setCurrentChatId(undefined);
  //       setMessages([]);
  //       setSelectedAssistant(null);
  //       navigate("/");
  //     }

  //     // Show success toast
  //     toast({
  //       title: "Chat deleted",
  //       description: "The conversation has been successfully deleted.",
  //     });
  //   } catch (error) {
  //     console.error("Failed to delete chat:", error);
  //     // Show error toast
  //     toast({
  //       title: "Error deleting chat",
  //       description:
  //         error instanceof Error
  //           ? error.message
  //           : "Failed to delete the conversation.",
  //       variant: "destructive",
  //     });
  //   }
  // };

  const handleAttachmentClick = async (conversationId?: string) => {
    skipInitialFetchRef.current = true;
    const conversationIdToSend = conversationId || currentChatId || conversationIdFromUpload;
    await sendStartAttachedFiles(conversationIdToSend);
  };

  return (
    <>
      {currentView === "chat" ? (
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isFirstMessage={messages.length === 0}
          selectedAssistant={selectedAssistant}
          connectionStatus={connectionStatus}
          isConnected={isConnected}
          isLoadingMessages={isLoadingMessages}
          chatId={currentChatId}
          clientId={currentChatClientId}
          attachmentProgress={attachmentProgress}
        />
      ) : (
        <Library
          onClose={handleCloseLibrary}
          onStartConversation={handleStartConversation}
        />
      )}
    </>
  );
};

export default Index;
