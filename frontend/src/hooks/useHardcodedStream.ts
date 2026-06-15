import { useCallback, useRef } from 'react';

interface StreamMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseHardcodedStreamProps {
  onMessageUpdate: (message: StreamMessage) => void;
  onStreamComplete: (messageId: string) => void;
}

const HARDCODED_RESPONSES = [
  "I'm SoloLedger, your AI billing and reimbursement assistant. I can help you track expenses, log receipts, generate invoices, and keep your cash flow organized.",
  "Share a receipt, invoice, or payment note and I'll help structure it into clean financial records for you.",
  "I can help categorize expenses, summarize project spending, and prepare finance updates without extra admin work.",
  "If you want, I can turn this into a clearer invoice, reimbursement log, or monthly finance summary.",
  "I’m here to reduce manual bookkeeping. Tell me what happened financially, and I’ll help organize the next step.",
  "I can help with overdue invoice follow-ups, reimbursement tracking, and clean transaction capture in a chat-first workflow.",
  "If you're reconciling expenses or preparing a client-ready summary, I can walk through it with you step by step.",
  "I can definitely assist with that. Let’s turn scattered billing details into a structured, easy-to-review record.",
];

export const useHardcodedStream = ({ onMessageUpdate, onStreamComplete }: UseHardcodedStreamProps) => {
  const currentMessageRef = useRef<StreamMessage | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // Get a random response
    const response = HARDCODED_RESPONSES[Math.floor(Math.random() * HARDCODED_RESPONSES.length)];
    
    // Create the bot message that will be streamed
    const botMessage: StreamMessage = {
      id: (Date.now() + 1).toString(),
      type: 'bot',
      content: response, // Provide full text immediately
      timestamp: new Date(),
      isStreaming: true
    };

    currentMessageRef.current = botMessage;
    
    // Start streaming after a small delay
    setTimeout(() => {
      onMessageUpdate(botMessage);
      
      // Mark as complete after streaming animation should finish
      // Estimate: response length * 30ms per character + buffer
      const streamDuration = response.length * 30 + 1000;
      timeoutRef.current = setTimeout(() => {
        if (currentMessageRef.current) {
          const finalMessage: StreamMessage = {
            ...currentMessageRef.current,
            isStreaming: false
          };
          onMessageUpdate(finalMessage);
          onStreamComplete(currentMessageRef.current.id);
          currentMessageRef.current = null;
        }
      }, streamDuration);
    }, 500);
  }, [onMessageUpdate, onStreamComplete]);

  const disconnect = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    currentMessageRef.current = null;
  }, []);

  return { sendMessage, disconnect };
};
