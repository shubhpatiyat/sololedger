import { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '@/types';
import WebSocketService, { WebSocketMessage } from '@/services/websocketService';
import { getWebSocketUrl, WEBSOCKET_CONFIG } from '@/config/websocket';

interface UseWebSocketProps {
  onMessageUpdate: (message: Message) => void;
  onStreamComplete: (messageId: string) => void;
  onConnectionStatusChange?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
  onError?: (error: string) => void;
  onConversationIdReceived?: (conversationId: string) => void;
  onMessageIdReceived?: (messageId: string, oldMessageId: string) => void;
  onAttachmentProgress?: (progress: number, filename: string, ds_id?: string) => void;
  chatId?: string;
  projectId?: string;
}

interface UseWebSocketReturn {
  sendMessage: (content: string, tempUserMessageId?: string, deepSearch?: boolean, filesInfo?: { ds_id: string; file_name: string; file_url?: string }[], conversationId?: string) => Promise<void>;
  sendStartAttachedFiles: (conversationId?: string) => Promise<void>;
  disconnect: () => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isConnected: boolean;
}

export const useWebSocket = ({
  onMessageUpdate,
  onStreamComplete,
  onConnectionStatusChange,
  onError,
  onConversationIdReceived,
  onMessageIdReceived,
  onAttachmentProgress,
  chatId,
  projectId
}: UseWebSocketProps): UseWebSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const currentStreamingMessageRef = useRef<Message | null>(null);
  const messageBufferRef = useRef<Map<string, string>>(new Map());
  const pendingUserMessageIdRef = useRef<string | null>(null);
  const lastBotMessageIdRef = useRef<string | null>(null);
  const chatIdRef = useRef<string | undefined>(chatId);

  // Initialize WebSocket service (but don't connect yet)
  useEffect(() => {
    const wsUrl = getWebSocketUrl(projectId);
    
    wsServiceRef.current = new WebSocketService({
      url: wsUrl,
      reconnectInterval: WEBSOCKET_CONFIG.reconnectInterval,
      maxReconnectAttempts: WEBSOCKET_CONFIG.maxReconnectAttempts,
      // heartbeatInterval: WEBSOCKET_CONFIG.heartbeatInterval
    });

    // Don't connect automatically - wait for first message

    return () => {
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
    };
  }, [projectId]);

  const connectWebSocket = useCallback(async () => {
    if (!wsServiceRef.current) return;

    try {
      await wsServiceRef.current.connect();
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      onError?.('Failed to connect to chat service');
    }
  }, [onError]);

  const disconnectWebSocket = useCallback(() => {
    if (wsServiceRef.current) {
      wsServiceRef.current.disconnect();
    }
  }, []);


  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    const { messageId } = message.data;
    
    switch (message.type) {
      case 'processing': {
        const { processingText } = message.data;
        
        // For new chats, we might not have a messageId yet
        if (!messageId && !currentStreamingMessageRef.current) {
          // Create a temporary message with a placeholder ID
          const tempMessageId = 'temp-' + Date.now();
          const processingMessage: Message = {
            id: tempMessageId,
            type: 'bot',
            content: '',
            timestamp: new Date(),
            isLoading: true,
            processingText: processingText || 'Processing your request...'
          };

          currentStreamingMessageRef.current = processingMessage;
          messageBufferRef.current.set(tempMessageId, '');
          
          onMessageUpdate(processingMessage);
          return;
        }

        if (!messageId) return;

        // If we already have a message with this ID, update it with new processing text
        if (currentStreamingMessageRef.current?.id === messageId) {
          const updatedMessage: Message = {
            ...currentStreamingMessageRef.current,
            isLoading: true,
            processingText: processingText || 'Processing your request...',
            content: '', // Clear any existing content
            isStreaming: false // Stop streaming if it was active
          };
          
          currentStreamingMessageRef.current = updatedMessage;
          onMessageUpdate(updatedMessage);
        } else {
          // Create new processing message
          const processingMessage: Message = {
            id: messageId,
            type: 'bot',
            content: '',
            timestamp: new Date(),
            isLoading: true,
            processingText: processingText || 'Processing your request...'
          };

          currentStreamingMessageRef.current = processingMessage;
          messageBufferRef.current.set(messageId, '');
          
          onMessageUpdate(processingMessage);
        }
        break;
      }
      
      case 'stream_start': {
        const { content } = message.data;
        
        if (!messageId) return;

        // If we already have a processing message, transition it to streaming
        // Check if we have a temp message that needs to be updated with the real messageId
        if (currentStreamingMessageRef.current) {
          const isTempMessage = currentStreamingMessageRef.current.id.startsWith('temp-');
          const messageIdMatches = currentStreamingMessageRef.current.id === messageId;
          
          if (isTempMessage || messageIdMatches) {
            const previousMessageId = currentStreamingMessageRef.current.id;
            const updatedMessage: Message = {
              ...currentStreamingMessageRef.current,
              id: messageId, // Update to real messageId
              content: content || '',
              isStreaming: true,
              isLoading: false,
              processingText: undefined // Clear processing text
            };
            
            currentStreamingMessageRef.current = updatedMessage;
            if (isTempMessage && onMessageIdReceived) {
              onMessageIdReceived(messageId, previousMessageId);
            }
            messageBufferRef.current.delete(previousMessageId);
            messageBufferRef.current.set(messageId, content || '');
            onMessageUpdate(updatedMessage);
          } else {
            // If we have a different message, create a new one for this messageId
            // This handles the case where a new message starts while another is still in progress
            const botMessage: Message = {
              id: messageId,
              type: 'bot',
              content: content || '',
              timestamp: new Date(),
              isStreaming: true,
              isLoading: false
            };

            currentStreamingMessageRef.current = botMessage;
            messageBufferRef.current.set(messageId, content || '');
            onMessageUpdate(botMessage);
          }
        } else {
          // Create new streaming message
          const botMessage: Message = {
            id: messageId,
            type: 'bot',
            content: content || '',
            timestamp: new Date(),
            isStreaming: true,
            isLoading: false
          };

          currentStreamingMessageRef.current = botMessage;
          messageBufferRef.current.set(messageId, content || '');
          
          onMessageUpdate(botMessage);
        }
        break;
      }
      
      case 'stream_chunk': {
        const { content } = message.data;
        
        if (!messageId || !content) return;

        // Update message buffer
        const currentContent = messageBufferRef.current.get(messageId) || '';
        const newContent = currentContent + content;
        messageBufferRef.current.set(messageId, newContent);

        // Update the streaming message
        if (currentStreamingMessageRef.current?.id === messageId) {
          const updatedMessage: Message = {
            ...currentStreamingMessageRef.current,
            content: newContent,
            isStreaming: true, // Ensure streaming is true
            isLoading: false, // Stop loading when content starts streaming
            processingText: undefined // Clear processing text
          };
          
          currentStreamingMessageRef.current = updatedMessage;
          onMessageUpdate(updatedMessage);
        } else {
          // Check if we have a temp message that needs to be updated
          if (currentStreamingMessageRef.current?.id.startsWith('temp-')) {
            const previousMessageId = currentStreamingMessageRef.current.id;
            const updatedMessage: Message = {
              ...currentStreamingMessageRef.current,
              id: messageId, // Update to real messageId
              content: newContent,
              isStreaming: true,
              isLoading: false,
              processingText: undefined
            };
            
            currentStreamingMessageRef.current = updatedMessage;
            if (onMessageIdReceived) {
              onMessageIdReceived(messageId, previousMessageId);
            }
            messageBufferRef.current.delete(previousMessageId);
            messageBufferRef.current.set(messageId, newContent);
            onMessageUpdate(updatedMessage);
          } else {
            // If we have a different message or no current message, create a new one
            // This handles the case where a new message starts while another is still in progress
            const botMessage: Message = {
              id: messageId,
              type: 'bot',
              content: newContent,
              timestamp: new Date(),
              isStreaming: true,
              isLoading: false
            };

            currentStreamingMessageRef.current = botMessage;
            messageBufferRef.current.set(messageId, newContent);
            onMessageUpdate(botMessage);
          }
        }
        break;
      }
      
      case 'stream_end': {
        if (!messageId) return;

        // Mark streaming as complete
        if (currentStreamingMessageRef.current?.id === messageId) {
          const finalMessage: Message = {
            ...currentStreamingMessageRef.current,
            isStreaming: false
          };
          
          // Store the bot message ID before clearing the ref
          if (finalMessage.type === 'bot') {
            lastBotMessageIdRef.current = messageId;
          }
          
          onMessageUpdate(finalMessage);
          onStreamComplete(messageId);
          
          // Reset streaming state after completion
          currentStreamingMessageRef.current = null;
          messageBufferRef.current.delete(messageId);
        }
        break;
      }
      
      case 'error': {
        const { error } = message.data;
        console.error('WebSocket error:', error);
        onError?.(error || 'An error occurred while processing your message');
        break;
      }
      
      case 'conversation_id_received': {
        const { conversationId, userMessageId } = message.data;
        // Handle conversation_id immediately when received
        if (conversationId && onConversationIdReceived) {
          onConversationIdReceived(conversationId);
        }
        // Handle message_id from metadata - this is for the bot response message
        // Update the current streaming/completed bot message ID if we have one
        if (userMessageId) {
          // Update bot message ID if we have a current streaming message
          // The message_id in metadata is for the bot response message
          if (currentStreamingMessageRef.current && currentStreamingMessageRef.current.type === 'bot') {
            const oldMessageId = currentStreamingMessageRef.current.id;
            if (oldMessageId !== userMessageId) {
              // Update bot message ID
              const updatedMessage: Message = {
                ...currentStreamingMessageRef.current,
                id: userMessageId
              };
              currentStreamingMessageRef.current = updatedMessage;
              
              // Update message buffer
              const content = messageBufferRef.current.get(oldMessageId) || '';
              messageBufferRef.current.delete(oldMessageId);
              messageBufferRef.current.set(userMessageId, content);
              
              // Notify UI to update the message with new ID
              onMessageUpdate(updatedMessage);
            }
          } else if (lastBotMessageIdRef.current && lastBotMessageIdRef.current !== userMessageId) {
            // Stream has ended, but we have the last bot message ID - update it
            // The userMessageId from metadata is actually the bot message ID
            // Use onMessageIdReceived to update the bot message in the UI
            if (onMessageIdReceived) {
              onMessageIdReceived(userMessageId, lastBotMessageIdRef.current);
            }
            lastBotMessageIdRef.current = null; // Clear after updating
          }
        }
        break;
      }
      
      case 'attachment_progress': {
        const { progress, filename, ds_id } = message.data;
        if (typeof progress === 'number' && onAttachmentProgress) {
          // We pass filename as fallback if ds_id is missing (though our service logic tries to provide it)
          onAttachmentProgress(progress, filename || '', ds_id);
        }
        break;
      }
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }, [onMessageUpdate, onStreamComplete, onError, onConversationIdReceived, onMessageIdReceived, onAttachmentProgress]);

  // Set up message handlers after functions are defined
  useEffect(() => {
    if (!wsServiceRef.current) return;

    // Set up message handler
    const unsubscribeMessage = wsServiceRef.current.onMessage((message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    });

    // Set up connection status handler
    const unsubscribeConnection = wsServiceRef.current.onConnectionChange((status) => {
      setConnectionStatus(status === 'reconnecting' ? 'connecting' : status);
      onConnectionStatusChange?.(status);
    });

    return () => {
      unsubscribeMessage();
      unsubscribeConnection();
    };
  }, [handleWebSocketMessage, onConnectionStatusChange]);

  // Update chatId ref whenever it changes
  useEffect(() => {
    chatIdRef.current = chatId;
  }, [chatId]);

  const sendMessage = useCallback(async (content: string, tempUserMessageId?: string, deepSearch?: boolean, filesInfo?: { ds_id: string; file_name: string; file_url?: string }[], conversationId?: string): Promise<void> => {
    
    if (!wsServiceRef.current) {
      console.error('WebSocket service not initialized');
      onError?.('WebSocket service not initialized');
      return;
    }

    try {
      // Reset streaming state for new message
      currentStreamingMessageRef.current = null;
      messageBufferRef.current.clear();
      lastBotMessageIdRef.current = null; // Clear last bot message ID for new message
      
      // Store temporary user message ID if provided (will be updated when server provides message_id)
      if (tempUserMessageId) {
        pendingUserMessageIdRef.current = tempUserMessageId;
      }

      // Connect if not already connected
      if (connectionStatus === 'disconnected') {
        await connectWebSocket();
      }

      // Wait a moment for connection to establish
      if (connectionStatus === 'connecting') {
        // Wait for connection to be established
        await new Promise((resolve) => {
          const checkConnection = () => {
            if (wsServiceRef.current?.getConnectionStatus() === 'connected') {
              resolve(void 0);
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        });
      }

      const currentChatId = conversationId || chatIdRef.current || chatId;
      wsServiceRef.current.sendMessage(content, undefined, currentChatId, deepSearch, filesInfo);
    } catch (error) {
      onError?.('Failed to send message');
    }
  }, [connectionStatus, onError, connectWebSocket, chatId]);

  const sendStartAttachedFiles = useCallback(async (conversationId?: string) => {
    if (!wsServiceRef.current) {
      console.error('[useWebSocket] WebSocket service not initialized');
      onError?.('WebSocket service not initialized');
      return;
    }

    try {
      const status = wsServiceRef.current.getConnectionStatus();

      // Connect if not already connected
      if (status === 'disconnected') {
        await connectWebSocket();
      }

      // If still connecting, wait for connection
      if (wsServiceRef.current.getConnectionStatus() === 'connecting') {
        await new Promise((resolve) => {
           const checkConnection = () => {
             const currentStatus = wsServiceRef.current?.getConnectionStatus();
             if (currentStatus === 'connected') {
               resolve(void 0);
             } else if (currentStatus === 'disconnected') {
               // Failed to connect
               resolve(void 0); 
             } else {
               setTimeout(checkConnection, 100);
             }
           };
           checkConnection();
        });
      }

      if (wsServiceRef.current.getConnectionStatus() === 'connected') {
         const conversationIdToSend = conversationId || chatIdRef.current || chatId;
         wsServiceRef.current.sendStartAttachedFiles(conversationIdToSend);
      } else {
         console.warn("[useWebSocket] Could not establish connection to send attachment signal", wsServiceRef.current.getConnectionStatus());
         onError?.("Could not establish connection");
      }
    } catch (error) {
      console.error('[useWebSocket] Failed to send start attached files:', error);
      onError?.('Failed to send attachment signal');
    }
  }, [onError, connectWebSocket, chatId]);

  const disconnect = useCallback(() => {
    disconnectWebSocket();
  }, [disconnectWebSocket]);

  return {
    sendMessage,
    sendStartAttachedFiles,
    disconnect,
    connectionStatus,
    isConnected: connectionStatus === 'connected'
  };
};
