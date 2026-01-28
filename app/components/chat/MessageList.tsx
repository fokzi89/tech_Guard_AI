'use client';

import { useEffect, useRef } from 'react';
import { AlertTriangle, User, Bot, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  isBlocked?: boolean;
  blockReason?: string;
  metadata?: {
    guardian_decision?: string;
    confidence?: number;
    matched_rule?: {
      ruleId: string;
      severity: string;
      ruleDescription: string;
    };
  };
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
  className?: string;
}

export function MessageList({ messages, isLoading, className }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'flex flex-col space-y-4 overflow-y-auto p-4 scroll-smooth',
        className
      )}
    >
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <Bot className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg font-medium">Start a conversation</p>
          <p className="text-sm mt-2">
            Ask me anything about troubleshooting your equipment.
          </p>
        </div>
      )}

      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="bg-muted rounded-lg p-4">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

function MessageItem({ message }: { message: Message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isBlocked = message.isBlocked;

  if (isSystem) {
    return <SystemMessage message={message} />;
  }

  if (isBlocked) {
    return <BlockedMessage message={message} />;
  }

  return (
    <div
      className={cn(
        'flex items-start space-x-3',
        isUser && 'flex-row-reverse space-x-reverse'
      )}
      data-testid={`message-${message.role}`}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser ? 'bg-primary/10' : 'bg-muted'
        )}
      >
        {isUser ? (
          <User className="h-5 w-5 text-primary" />
        ) : (
          <Bot className="h-5 w-5 text-foreground" />
        )}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 max-w-[80%]', isUser && 'flex justify-end')}>
        <div
          className={cn(
            'rounded-lg p-4',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <MessageContent content={message.content} />
          </div>

          {message.timestamp && (
            <div
              className={cn(
                'text-xs mt-2 opacity-70',
                isUser ? 'text-primary-foreground' : 'text-muted-foreground'
              )}
            >
              {formatTimestamp(message.timestamp)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SystemMessage({ message }: { message: Message }) {
  const isGuardianBlock = message.metadata?.guardian_decision === 'BLOCK';
  const isGuardianAllow = message.metadata?.guardian_decision === 'ALLOW';

  return (
    <div className="flex items-center justify-center my-4">
      <div
        className={cn(
          'max-w-md px-4 py-2 rounded-lg text-sm flex items-center space-x-2',
          isGuardianBlock &&
          'bg-destructive/10 text-destructive border border-destructive/20',
          isGuardianAllow && 'bg-green-500/10 text-green-700 dark:text-green-400',
          !isGuardianBlock &&
          !isGuardianAllow &&
          'bg-muted text-muted-foreground'
        )}
        data-testid={isGuardianBlock ? 'guardian-block-warning' : 'system-message'}
      >
        {isGuardianBlock && <Shield className="h-4 w-4 flex-shrink-0" />}
        {isGuardianAllow && <Shield className="h-4 w-4 flex-shrink-0" />}
        {!isGuardianBlock && !isGuardianAllow && (
          <Info className="h-4 w-4 flex-shrink-0" />
        )}
        <span>{message.content}</span>
      </div>
    </div>
  );
}

function BlockedMessage({ message }: { message: Message }) {
  return (
    <div className="my-4" data-testid="blocked-message">
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold text-destructive mb-1">
              BLOCKED - Safety Warning
            </h4>
            <p className="text-sm text-foreground mb-2">{message.content}</p>
            {message.blockReason && (
              <div className="mt-2 p-3 bg-background/50 rounded border border-border">
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Reason:
                </p>
                <p className="text-sm text-foreground">{message.blockReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // 1. Regex to split by markdown images: ![alt](url)
  // 2. Regex to split by Manual citations: [Manual: ...]
  // We'll process images first, then map the text parts to check for manuals.

  const parts = content.split(/(!\[.*?\]\(.*?\))/g);

  return (
    <>
      {parts.map((part, index) => {
        // Check for Image
        const imageMatch = part.match(/!\[(.*?)\]\((.*?)\)/);
        if (imageMatch) {
          const [_, alt, src] = imageMatch;
          return (
            <img
              key={index}
              src={src}
              alt={alt}
              className="max-w-full rounded-lg border border-border my-2 max-h-64 object-cover"
            />
          );
        }

        // Process citations within text parts
        const subParts = part.split(/(\[Manual:.*?\])/g);
        return (
          <span key={index}>
            {subParts.map((subPart, subIndex) => {
              if (subPart.startsWith('[Manual:')) {
                return (
                  <span
                    key={subIndex}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20 mx-1"
                  >
                    {subPart.replace(/[\[\]]/g, '')}
                  </span>
                );
              }
              return <span key={subIndex}>{subPart}</span>;
            })}
          </span>
        );
      })}
    </>
  );
}

function formatTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'Just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  } catch {
    return timestamp;
  }
}
