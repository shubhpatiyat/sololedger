import React from 'react';

interface ProcessingTextProps {
  text: string;
}

const ProcessingText: React.FC<ProcessingTextProps> = ({ text }) => {
  return (
    <div className="flex items-center space-x-2 text-muted-foreground">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
      </div>
      <span className="text-sm">{text}</span>
    </div>
  );
};

export default ProcessingText;
