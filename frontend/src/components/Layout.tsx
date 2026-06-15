import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useParams, useLocation } from "react-router-dom";
import Login from "@/components/Login";
import ChatSidebar from "@/components/ChatSidebar";
import Header from "@/components/Header";
import { useChats } from "@/hooks/useChats";
import { useAuth } from "@/hooks/useAuth";
import { clearAccessTokenFromMemory } from "@/lib/secureTokenManager";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Chat, Message } from "@/types";

export interface LayoutOutletContext {
  chats: Chat[];
  chatsError: string | null;
  addChat: (chat: Chat) => void;
  deleteChatFromServer: (conversationId: string) => Promise<void>;
  fetchConversationMessages: (conversationId: string, projectId?: string) => Promise<Message[]>;
  isLoadingMessages: boolean;
  messagesError: string | null;
  refetchChats: () => Promise<void>;
}

const Layout: React.FC = () => {
  const { isLoggedIn, login, logout, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { chatId } = useParams<{ chatId?: string }>();
  const isMobile = useIsMobile();

  const {
    chats,
    error: chatsError,
    addChat,
    deleteChatFromServer,
    fetchConversationMessages,
    isLoadingMessages,
    messagesError,
    refetchChats,
  } = useChats();

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
    if (isLoggedIn && chatId) {
      const chatExists = chats.some((chat) => chat.id === chatId);
      if (!chatExists) {
        if (chats.length > 0) {
          const timeoutId = setTimeout(() => {
            refetchChats();
          }, 1000);

          return () => clearTimeout(timeoutId);
        }
      }
    }
  }, [chatId, chats, isLoggedIn, refetchChats]);

  const handleLogin = (userEmail: string) => {
    login(userEmail);
  };

  const handleLogout = () => {
    clearAccessTokenFromMemory();
    logout();
    navigate("/");
  };

  const handleNewChat = () => {
    navigate("/");
  };

  const handleSelectChat = (chatId: string) => {
    navigate(`/chat/${chatId}`);
  };

  const handleShowLibrary = () => {
    navigate("/library");
  };

  const handleShowInvoices = () => {
    navigate("/invoices");
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChatFromServer(chatId);
      toast({
        title: "Chat deleted",
        description: "The conversation has been successfully deleted.",
      });
    } catch (error) {
      console.error("Failed to delete chat:", error);
      toast({
        title: "Error deleting chat",
        description:
          error instanceof Error
            ? error.message
            : "Failed to delete the conversation.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <Header
        onLogout={handleLogout}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar */}
        <div className={`${isMobile ? "hidden" : "block"}`}>
          <ChatSidebar
            chats={chats}
            selectedChat={chatId}
            onSelectChat={handleSelectChat}
            onShowLibrary={handleShowLibrary}
            onShowInvoices={handleShowInvoices}
            onDeleteChat={handleDeleteChat}
          />
        </div>

        {/* Mobile Sidebar Overlay */}
        {isMobile && sidebarOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="fixed left-0 top-16 bottom-0 z-50">
              <ChatSidebar
                chats={chats}
                selectedChat={chatId}
                onSelectChat={(chatId) => {
                  handleSelectChat(chatId);
                  setSidebarOpen(false);
                }}
                onShowLibrary={() => {
                  handleShowLibrary();
                  setSidebarOpen(false);
                }}
                onShowInvoices={() => {
                  handleShowInvoices();
                  setSidebarOpen(false);
                }}
                onDeleteChat={handleDeleteChat}
              />
            </div>
          </>
        )}

        <div className="flex-1">
          <Outlet
            context={{
              chats,
              chatsError,
              addChat,
              deleteChatFromServer,
              fetchConversationMessages,
              isLoadingMessages,
              messagesError,
              refetchChats,
            } satisfies LayoutOutletContext}
          />
        </div>
      </div>
    </div>
  );
};

export default Layout;
