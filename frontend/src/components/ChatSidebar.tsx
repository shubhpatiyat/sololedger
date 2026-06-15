import React from 'react';
import { Button } from '@/components/ui/button';
import { MessageSquare, BriefcaseBusiness, FileText, Trash2 } from 'lucide-react';
import { Chat } from '@/types';
import { groupChatsByDate, formatChatTime } from '@/lib/dateUtils';
import { useTheme } from '@/contexts/ThemeContext';

// Updated ChatSidebar with date grouping and delete functionality

interface ChatSidebarProps {
  chats: Chat[];
  selectedChat?: string;
  onSelectChat: (chatId: string) => void;
  onShowLibrary: () => void;
  onShowInvoices: () => void;
  onDeleteChat: (chatId: string) => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  chats, 
  selectedChat,
  onSelectChat,
  onShowLibrary,
  onShowInvoices,
  onDeleteChat,
}) => {
  const { theme } = useTheme();
  const groupedChats = groupChatsByDate(chats);

  const renderChatGroup = (title: string, chats: Chat[]) => {
    if (chats.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          {title}
        </h4>
        <div className="space-y-4">
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`group relative rounded-[4px] transition-all duration-200 px-2 ${
                selectedChat === chat.id 
                  ? 'border-r-2 shadow-sm rounded-[0px]' 
                  : 'hover:bg-muted/50 hover:border hover:border-primary'
              }`}
              style={{
                backgroundColor: selectedChat === chat.id ? 'var(--selected-chat-bg)' : undefined,
                borderRightColor: selectedChat === chat.id ? 'var(--selected-chat-border)' : undefined,
                color: selectedChat === chat.id ? 'var(--selected-chat-text)' : undefined
              }}
            >
              <Button
                onClick={() => onSelectChat(chat.id)}
                variant="ghost"
                className="w-full justify-start text-left p-2 h-auto rounded-lg"
              >
                <div className="flex items-start space-x-2 w-full pr-6">
                  <MessageSquare className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-xs font-medium truncate mb-0.5"
                      style={{
                        color: selectedChat === chat.id ? 'var(--selected-chat-text)' : undefined
                      }}
                    >
                      {chat.title}
                    </p>
                    <p 
                      className="text-xs"
                      style={{
                        color: selectedChat === chat.id ? 'var(--selected-chat-text)' : undefined
                      }}
                    >
                      {formatChatTime(chat.timestamp)}
                    </p>
                  </div>
                </div>
              </Button>
              
              {/* Delete button */}
              {/* <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteChat(chat.id);
                }}
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-5 h-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button> */}
            </div>
          ))}
        </div>
      </div>
    );
  };
  return (
    <div className="w-80 bg-sidebar border-r border-border flex flex-col h-full">
      {/* Navigation */}
      <div className="p-3 border-b border-border">
        <div className="space-y-1">
          <Button
            onClick={onShowLibrary}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted py-3 rounded-xl"
          >
            <BriefcaseBusiness className="w-5 h-5 mr-3" />
            Workspace
          </Button>
          <Button
            onClick={onShowInvoices}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted py-3 rounded-xl"
          >
            <FileText className="w-5 h-5 mr-3" />
            Invoices
          </Button>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <div className="p-4">
          {chats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-medium text-foreground">
                No conversations yet
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Add a client to start posting expenses, tracking follow-ups, and chatting in context.
              </p>
            </div>
          ) : (
            <div>
              {renderChatGroup('Today', groupedChats.today)}
              {renderChatGroup('Yesterday', groupedChats.yesterday)}
              {Object.keys(groupedChats)
                .filter(key => key !== 'today' && key !== 'yesterday')
                .sort((a, b) => {
                  // Sort dates in descending order (newest first)
                  const dateA = new Date(a.split('/').reverse().join('-'));
                  const dateB = new Date(b.split('/').reverse().join('-'));
                  return dateB.getTime() - dateA.getTime();
                })
                .map(dateKey => <div key={dateKey}>{renderChatGroup(dateKey, groupedChats[dateKey])}</div>)}
            </div>
          )}
        </div>
      </div>

      {/* Powered by SoloLedger */}
      {/* <div className="p-4 border-t border-border">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Powered by{' '}
            <span className="font-bold text-primary">SoloLedger</span>
          </p>
        </div> */}
      {/* </div> */}
    </div>
  );
};

export default ChatSidebar;
