import { useState, useEffect, useCallback } from 'react';
import { Chat, Message } from '@/types';
import { apiService } from '@/services/apiService';
import { DEMO_MODE } from '@/config/demo';
import { getDemoConversationMessages } from '@/data/demoContent';

interface UseChatsReturn {
  chats: Chat[];
  isLoading: boolean;
  error: string | null;
  fetchChats: () => Promise<void>;
  refetchChats: () => Promise<void>;
  addChat: (chat: Chat) => void;
  updateChat: (chatId: string, updates: Partial<Chat>) => void;
  deleteChat: (chatId: string) => void;
  deleteChatFromServer: (conversationId: string) => Promise<void>;
  fetchConversationMessages: (conversationId: string, projectId?: string) => Promise<Message[]>;
  isLoadingMessages: boolean;
  messagesError: string | null;
}

export const useChats = (): UseChatsReturn => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const fetchChats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getChats();
      
      if (response.status < 400 && Array.isArray(response.data)) {
        const formattedChats: Chat[] = response.data.map(apiChat => ({
          id: apiChat.id,
          clientId: apiChat.client_id,
          title: apiChat.client_name || apiChat.title || 'Untitled Chat',
          timestamp: new Date(apiChat.updated_at),
          messages: []
        }));
        
        setChats(formattedChats);
      } else {
        setChats([]);
        setError('Failed to fetch chats');
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
      setChats([]);
      setError('Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchChats = useCallback(async () => {
    await fetchChats();
  }, [fetchChats]);

  const addChat = useCallback((chat: Chat) => {
    setChats(prev => [chat, ...prev]);
  }, []);

  const updateChat = useCallback((chatId: string, updates: Partial<Chat>) => {
    setChats(prev => 
      prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, ...updates }
          : chat
      )
    );
  }, []);

  const deleteChat = useCallback((chatId: string) => {
    setChats(prev => prev.filter(chat => chat.id !== chatId));
  }, []);

  const deleteChatFromServer = useCallback(async (conversationId: string) => {
    if (DEMO_MODE) {
      setChats(prev => prev.filter(chat => chat.id !== conversationId));
      return;
    }

    try {
      const response = await apiService.deleteConversation(conversationId);
      
      if (response.status < 400) {
        setChats(prev => prev.filter(chat => chat.id !== conversationId));
      } else {
        const errorMsg = 'Failed to delete conversation';
        setError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete conversation';
      setError(errorMsg);
      throw err;
    }
  }, []);

  const fetchConversationMessages = useCallback(async (conversationId: string, projectId?: string): Promise<Message[]> => {
    if (DEMO_MODE && conversationId.startsWith('demo-')) {
      const messages = getDemoConversationMessages(conversationId, projectId);
      setChats(prev =>
        prev.map(chat =>
          chat.id === conversationId
            ? { ...chat, messages }
            : chat
        )
      );
      return messages;
    }

    setIsLoadingMessages(true);
    setMessagesError(null);
    
    try {
      const response = await apiService.getConversationMessages(conversationId);
      
      if (response.status < 400 && Array.isArray(response.data)) {
        const messages: Message[] = [];
        
        response.data.forEach(chat => {
          messages.push({
            id: `${chat.id}-user`,
            type: 'user',
            content: chat.user_message,
            timestamp: new Date(chat.created_at),
            isStreaming: false,
            attachments: chat.attachments?.map((attachment) => ({
              ds_id: attachment.id,
              filename: attachment.file_name,
              file_name: attachment.file_name,
              size: 0,
              type: attachment.content_type || undefined,
              url: attachment.file_url,
              conversation_id: attachment.conversation_id,
            })),
          });
          
          if (chat.assistant_message) {
            messages.push({
              id: `${chat.id}`,
              type: 'bot',
              content: chat.assistant_message,
              timestamp: new Date(chat.created_at),
              isStreaming: false,
            });
          }
        });
        
        messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        setChats(prev => 
          prev.map(chat => 
            chat.id === conversationId 
              ? { ...chat, messages }
              : chat
          )
        );
        
        return messages;
      } else {
        const errorMsg = 'Failed to fetch conversation messages';
        setMessagesError(errorMsg);
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Error fetching conversation messages:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch conversation messages';
      setMessagesError(errorMsg);
      throw err;
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    chats,
    isLoading,
    error,
    refetchChats,
    fetchChats,
    addChat,
    updateChat,
    deleteChat,
    deleteChatFromServer,
    fetchConversationMessages,
    isLoadingMessages,
    messagesError
  };
};
