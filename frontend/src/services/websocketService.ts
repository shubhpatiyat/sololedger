import { Message } from '@/types';
import { toast } from '@/hooks/use-toast';

export interface WebSocketMessage {
  type: 'message' | 'stream_start' | 'stream_chunk' | 'stream_end' | 'error' | 'conversation_id_received' | 'processing' | 'attachment_progress';
  data: {
    messageId?: string;
    content?: string;
    isComplete?: boolean;
    error?: string;
    conversationId?: string;
    processingText?: string;
    userMessageId?: string; // message_id for user message when received in metadata
    progress?: number;
    filename?: string;
    ds_id?: string;
  };
}

// Server message format
export interface ServerMessage {
  t?: 'p' | 'v' | 'e' | 'c' | 's'; // p=processing, v=value/content, e=error, c=complete, s=status_attachment_progress
  m?: string; // message content (optional for metadata messages)
  progress?: number;
  file_name?: string;
  conversation_id?: string;
  message_id?: string;
  citation?: unknown;
  page?: unknown[];
  row?: unknown[];
  page_name?: unknown[];
  all_sources?: unknown[];
  data_source_id?: unknown;
  ds_id?: number | string;
  type?: string;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private messageHandlers: Map<string, (message: WebSocketMessage) => void> = new Map();
  private connectionHandlers: ((status: 'connected' | 'disconnected' | 'reconnecting') => void)[] = [];
  private currentMessageId: string | null = null;
  private hasStartedStreaming: boolean = false;

  constructor(config: WebSocketConfig) {
    this.config = {
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      ...config
    };
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        reject(new Error('Connection already in progress'));
        return;
      }

      this.isConnecting = true;

      try {
        this.ws = new WebSocket(this.config.url);

        this.ws.onopen = () => {
          this.isConnecting = false;
          this.reconnectAttempts = 0; // Reset only on successful connection
          this.clearReconnectTimer(); // Clear any pending reconnection
          this.notifyConnectionHandlers('connected');
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const serverMessage: ServerMessage = JSON.parse(event.data);
            
            // Convert server message format to our expected format
            const convertedMessage = this.convertServerMessage(serverMessage);
            if (convertedMessage) {
              this.handleMessage(convertedMessage);
            }
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          this.isConnecting = false;
          this.notifyConnectionHandlers('disconnected');
          
          if (event.code === 4000 || event.code === 4004) {
            toast({
              description: event.reason || "Knowledge base is empty. Please connect to Admin of organization",
              variant: "destructive",
            });
            this.forceDisconnect();
          } else if (event.code === 4005) {
            toast({
              title: "Connection Error",
              description: event.reason || "Your Plan is expired. Please connect to Admin of organization",
               className: "bg-blue-500 text-white border-blue-600",
            });
            this.forceDisconnect();
          } else if (event.code === 4001) {
            toast({
              title: "Permission Denied",
              description: event.reason || "You don't have permission to access this resource",
              variant: "destructive",
            });
            this.forceDisconnect();
          } else if (event.code === 1006) {
            toast({
              title: "Connection Lost",
              description: "WebSocket connection was lost unexpectedly",
              variant: "destructive",
            });
          } else if (event.code === 1011) {
            toast({
              title: "Server Error",
              description: event.reason || "Server encountered an error",
              variant: "destructive",
            });
          } else {
            if (event.code !== 1000 && event.code !== 1001) {
              toast({
                title: "Connection Closed",
                description: event.reason || `Connection closed with code ${event.code}`,
                variant: "destructive",
              });
            }
          }
          
          const shouldNotReconnect = [4000, 4001, 4004, 4005];
          
          if (!event.wasClean && 
              this.reconnectAttempts < this.config.maxReconnectAttempts! && 
              !shouldNotReconnect.includes(event.code) &&
              !this.reconnectTimer &&
              !this.isConnecting) {
            this.scheduleReconnect();
          } else {
            console.log('Reconnection not scheduled:', {
              wasClean: event.wasClean,
              attempts: this.reconnectAttempts,
              maxAttempts: this.config.maxReconnectAttempts,
              shouldNotReconnect: shouldNotReconnect.includes(event.code),
              hasTimer: !!this.reconnectTimer,
              isConnecting: this.isConnecting
            });
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.isConnecting = false;
          this.notifyConnectionHandlers('disconnected');
          reject(error);
        };

      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.notifyConnectionHandlers('disconnected');
  }

  forceDisconnect(): void {
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = this.config.maxReconnectAttempts!; // Prevent reconnection
    this.notifyConnectionHandlers('disconnected');
  }

  sendMessage(message: string, messageId?: string, chatId?: string, deepSearch?: boolean, filesInfo?: { ds_id: string; file_name: string; file_url?: string }[]): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.currentMessageId = null;
      this.hasStartedStreaming = false;
      
      const payload: { 
        query: string; 
        conversation_id?: string;
        deep_search?: boolean;
        files_info?: { ds_id: string; file_name: string; file_url?: string }[];
      } = {
        query: message
      };
      
      if (chatId) {
        payload.conversation_id = chatId;
      }

      if (deepSearch) {
        payload.deep_search = deepSearch;
      }

      if (filesInfo && filesInfo.length > 0) {
        payload.files_info = filesInfo;
      }
      
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  sendStartAttachedFiles(conversationId?: string): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const payload: { start_attached_files: boolean; conversation_id?: string } = {
        start_attached_files: true
      };
      if (conversationId) {
        payload.conversation_id = conversationId;
      }
      this.ws.send(JSON.stringify(payload));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  onMessage(handler: (message: WebSocketMessage) => void): () => void {
    const id = Math.random().toString(36).substr(2, 9);
    this.messageHandlers.set(id, handler);
    return () => {
      this.messageHandlers.delete(id);
    };
  }

  onConnectionChange(handler: (status: 'connected' | 'disconnected' | 'reconnecting') => void): () => void {
    this.connectionHandlers.push(handler);
    
    return () => {
      const index = this.connectionHandlers.indexOf(handler);
      if (index > -1) {
        this.connectionHandlers.splice(index, 1);
      }
    };
  }

  getConnectionStatus(): 'connecting' | 'connected' | 'disconnected' {
    if (this.isConnecting) return 'connecting';
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    return 'disconnected';
  }

  private handleMessage(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  private notifyConnectionHandlers(status: 'connected' | 'disconnected' | 'reconnecting'): void {
    this.connectionHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('Error in connection handler:', error);
      }
    });
  }

  private scheduleReconnect(): void {
    // Prevent multiple concurrent reconnection attempts
    if (this.reconnectTimer || this.isConnecting) return;
    
    // Check if we've exceeded max attempts
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts!) {
      return;
    }

    this.notifyConnectionHandlers('reconnecting');
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.reconnectAttempts++;
      this.connect().catch(error => {
        console.error(`Reconnect attempt ${this.reconnectAttempts} failed:`, error);
      });
    }, this.config.reconnectInterval);
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }


  private convertServerMessage(serverMessage: ServerMessage & { type?: string }): WebSocketMessage | null {
    const { t, m, conversation_id, message_id, type } = serverMessage;
    
    // Check for explicit type field first (as requested for progress updates)
    if (serverMessage.type === 'status_attachment_progress') {
      return {
        type: 'attachment_progress',
        data: {
          progress: serverMessage.progress,
          ds_id: serverMessage.ds_id ? String(serverMessage.ds_id) : undefined,
          filename: serverMessage.file_name
        }
      };
    }

    // Check 'type' field from JSON (as per user log) or 't' field
    const messageType = t || type;

    // For each new message, generate a unique messageId
    // Only use conversation_id for conversation context, not as messageId
    let messageId = message_id || this.currentMessageId;
    
    // If we don't have a current message ID, generate a new one
    if (!messageId) {
      messageId = Date.now().toString();
      this.currentMessageId = messageId;
    }
    
    // Use conversation_id for context if available
    
    // Handle metadata messages (messages without t and m fields)
    // These come after the response with conversation_id and message_id
    if (!t && !m && conversation_id) {
      // Return a special message type to notify about conversation_id and message_id
      return {
        type: 'conversation_id_received',
        data: {
          conversationId: conversation_id,
          userMessageId: message_id // message_id for the user message
        }
      };
    }
    // Handle regular messages with t/type field
    if (!messageType) {
      console.warn('Message without type field:', serverMessage);
      return null;
    }
    
    switch (messageType) {
      // s case removed, handled explicitly above via serverMessage.type check

      case 'p': // Processing message
        return {
          type: 'processing',
          data: {
            messageId: message_id || messageId,
            processingText: m
          }
        };
        
      case 'v': // Value/content message
        if (m === '[END_OF_STREAM]') {
          // Reset streaming state when stream ends
          this.hasStartedStreaming = false;
          return {
            type: 'stream_end',
            data: {
              messageId: message_id || messageId
            }
          };
        } else {
          // Check if this is the first content chunk for this message
          const isFirstChunk = !this.hasStartedStreaming;
          if (isFirstChunk) {
            this.hasStartedStreaming = true;
          }
          
          return {
            type: isFirstChunk ? 'stream_start' : 'stream_chunk',
            data: {
              messageId: message_id || messageId, // Use server's message_id if available
              content: m
            }
          };
        }
        
      case 'e': // Error message
        return {
          type: 'error',
          data: {
            error: m
          }
        };
        
      case 'c': // Complete message
        // Reset streaming state when stream completes
        this.hasStartedStreaming = false;
        return {
          type: 'stream_end',
          data: {
            messageId: message_id || messageId
          }
        };
        
      default:
        console.warn('Unknown message type:', t);
        return null;
    }
  }
}

export default WebSocketService;
