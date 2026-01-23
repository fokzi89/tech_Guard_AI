'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, Shield, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  onPhotoUploadClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  machineModel: string;
  placeholder?: string;
  maxLength?: number;
  showSafetyIndicator?: boolean;
  className?: string;
}

interface SafetyCheckResult {
  safe: boolean;
  decision: 'ALLOW' | 'BLOCK';
  confidence: number;
  reasoning?: string;
  matchedRule?: {
    ruleId: string;
    severity: string;
  };
}

export function MessageInput({
  onSendMessage,
  onPhotoUploadClick,
  disabled = false,
  isLoading = false,
  machineModel,
  placeholder = 'Ask a question about troubleshooting...',
  maxLength = 5000,
  showSafetyIndicator = true,
  className,
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [safetyCheck, setSafetyCheck] = useState<SafetyCheckResult | null>(null);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const safetyCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  // Real-time safety check with debounce
  useEffect(() => {
    if (!showSafetyIndicator || message.trim().length === 0) {
      setSafetyCheck(null);
      return;
    }

    // Clear previous timeout
    if (safetyCheckTimeoutRef.current) {
      clearTimeout(safetyCheckTimeoutRef.current);
    }

    // Debounce safety check (500ms after user stops typing)
    safetyCheckTimeoutRef.current = setTimeout(async () => {
      await performSafetyCheck(message);
    }, 500);

    return () => {
      if (safetyCheckTimeoutRef.current) {
        clearTimeout(safetyCheckTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [message, showSafetyIndicator, machineModel]);

  const performSafetyCheck = async (text: string) => {
    if (text.trim().length < 5) return; // Skip very short messages

    setIsCheckingSafety(true);

    try {
      const response = await fetch('/api/safety/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          machineModel,
        }),
      });

      if (response.ok) {
        const result: SafetyCheckResult = await response.json();
        setSafetyCheck(result);
      }
    } catch (error) {
      console.error('Safety check failed:', error);
      // Don't block on check failure - let server-side Guardian handle it
    } finally {
      setIsCheckingSafety(false);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled || isLoading) return;
    if (trimmedMessage.length > maxLength) return;

    onSendMessage(trimmedMessage);
    setMessage('');
    setSafetyCheck(null);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isDisabled = disabled || isLoading;
  const characterCount = message.length;
  const isOverLimit = characterCount > maxLength;
  const showWarning = safetyCheck && !safetyCheck.safe;

  return (
    <div className={cn('border-t border-border bg-background', className)}>
      {/* Safety Warning Banner */}
      {showWarning && (
        <div
          className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-start space-x-2"
          data-testid="safety-warning-banner"
        >
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-destructive">
              Potential Safety Concern
            </p>
            {safetyCheck.reasoning && (
              <p className="text-xs text-muted-foreground mt-1">
                {safetyCheck.reasoning}
              </p>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-2">
          {/* Photo Upload Button */}
          {onPhotoUploadClick && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onPhotoUploadClick}
              disabled={isDisabled}
              className="flex-shrink-0"
              data-testid="photo-upload-trigger"
            >
              <ImageIcon className="h-5 w-5" />
            </Button>
          )}

          {/* Message Input Area */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={isDisabled}
              rows={1}
              maxLength={maxLength}
              className={cn(
                'w-full resize-none rounded-lg border border-border bg-input px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
                'min-h-[48px] max-h-[200px]',
                isOverLimit && 'border-destructive focus:ring-destructive'
              )}
              data-testid="message-input"
            />

            {/* Bottom Row: Safety Indicator + Character Count */}
            <div className="flex items-center justify-between mt-2 px-1">
              {/* Safety Indicator */}
              <div className="flex items-center space-x-2">
                {showSafetyIndicator && message.trim().length > 0 && (
                  <>
                    {isCheckingSafety ? (
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Checking safety...</span>
                      </div>
                    ) : safetyCheck ? (
                      <div
                        className={cn(
                          'flex items-center space-x-1 text-xs',
                          safetyCheck.safe
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-destructive'
                        )}
                        data-testid="safety-indicator"
                      >
                        <Shield
                          className={cn(
                            'h-3 w-3',
                            safetyCheck.safe && 'fill-current'
                          )}
                        />
                        <span>
                          {safetyCheck.safe
                            ? 'Safe to send'
                            : 'May be blocked'}
                        </span>
                      </div>
                    ) : null}
                  </>
                )}
              </div>

              {/* Character Count */}
              <div
                className={cn(
                  'text-xs',
                  isOverLimit
                    ? 'text-destructive font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {characterCount} / {maxLength}
              </div>
            </div>
          </div>

          {/* Send Button */}
          <Button
            type="submit"
            disabled={
              isDisabled ||
              !message.trim() ||
              isOverLimit
            }
            size="icon"
            className="flex-shrink-0"
            data-testid="send-message-button"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Keyboard Hint */}
        <div className="text-xs text-muted-foreground mt-2 px-1">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-muted rounded border border-border">Shift + Enter</kbd> for new line
        </div>
      </form>
    </div>
  );
}
