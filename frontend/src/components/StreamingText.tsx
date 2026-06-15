import React, { useState, useEffect, useRef } from 'react';
import MarkdownRenderer from './MarkdownRenderer';

interface StreamingTextProps {
  text: string;
  delay?: number;
  onComplete?: () => void;
  shouldAnimate?: boolean;
}

const StreamingText: React.FC<StreamingTextProps> = ({ 
  text, 
  delay = 50,
  onComplete,
  shouldAnimate = true
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [words, setWords] = useState<string[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const previousTextRef = useRef('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isStreamingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Clear timeout helper
  const clearCurrentTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Check if element is visible
  const isElementVisible = () => {
    if (!containerRef.current) return false;
    const rect = containerRef.current.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  };

  // Handle text changes
  useEffect(() => {
    // If text is empty, reset everything
    if (!text) {
      clearCurrentTimeout();
      setDisplayedText('');
      setCurrentWordIndex(0);
      setWords([]);
      setIsComplete(false);
      previousTextRef.current = '';
      isStreamingRef.current = false;
      return;
    }

    // Split text into words
    const newWords = text.split(' ');
    
    // If this is a completely new text (not an extension of previous text)
    if (!previousTextRef.current || !text.startsWith(previousTextRef.current)) {
      // Reset for new text
      clearCurrentTimeout();
      setDisplayedText('');
      setCurrentWordIndex(0);
      setWords(newWords);
      setIsComplete(false);
      previousTextRef.current = '';
      isStreamingRef.current = false;
    } else {
      // Text is being extended, just update words but keep current progress
      setWords(newWords);
    }

    // Update the reference
    previousTextRef.current = text;
  }, [text]);

  // Handle streaming animation
  useEffect(() => {
    // Don't animate if shouldAnimate is false or if already complete
    if (!shouldAnimate || isComplete) {
      setDisplayedText(text);
      return;
    }

    // Don't start streaming if we're already at the end or if no words
    if (currentWordIndex >= words.length || words.length === 0) {
      if (currentWordIndex === words.length && words.length > 0) {
        setIsComplete(true);
        if (onComplete) {
          onComplete();
        }
      }
      return;
    }

    // Only animate if element is visible
    if (!isElementVisible()) {
      setDisplayedText(text);
      setIsComplete(true);
      return;
    }

    // Start streaming from current word position
    isStreamingRef.current = true;
    timeoutRef.current = setTimeout(() => {
      setDisplayedText(prev => {
        const newText = words.slice(0, currentWordIndex + 1).join(' ');
        return newText;
      });
      setCurrentWordIndex(prev => prev + 1);
    }, delay);

    return () => {
      clearCurrentTimeout();
    };
  }, [currentWordIndex, words, delay, onComplete, shouldAnimate, isComplete, text]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCurrentTimeout();
    };
  }, []);

  return (
    <div ref={containerRef}>
      <MarkdownRenderer content={displayedText} />
      {shouldAnimate && !isComplete && currentWordIndex < words.length && (
        <span className="inline-block w-1 h-4 bg-primary ml-1 animate-pulse" />
      )}
    </div>
  );
};

export default StreamingText;