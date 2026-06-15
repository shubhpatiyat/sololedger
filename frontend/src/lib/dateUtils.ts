import { Chat } from '@/types';

export interface GroupedChats {
  today: Chat[];
  yesterday: Chat[];
  [key: string]: Chat[]; // Allow dynamic date keys
}

export const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const grouped: GroupedChats = {
    today: [],
    yesterday: []
  };

  chats.forEach(chat => {
    const chatDate = new Date(chat.timestamp);
    const chatDateOnly = new Date(chatDate.getFullYear(), chatDate.getMonth(), chatDate.getDate());

    if (chatDateOnly.getTime() === today.getTime()) {
      grouped.today.push(chat);
    } else if (chatDateOnly.getTime() === yesterday.getTime()) {
      grouped.yesterday.push(chat);
    } else {
      // Create a date key in DD/MM/YYYY format
      const dateKey = chatDateOnly.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(chat);
    }
  });

  // Sort chats within each group by timestamp (newest first)
  grouped.today.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  grouped.yesterday.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  
  // Sort other date groups
  Object.keys(grouped).forEach(key => {
    if (key !== 'today' && key !== 'yesterday') {
      grouped[key].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
  });

  return grouped;
};

export const formatChatTime = (timestamp: Date): string => {
  return timestamp.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

export const formatGroupDate = (date: Date): string => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (dateOnly.getTime() === today.getTime()) {
    return 'Today';
  } else if (dateOnly.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};
