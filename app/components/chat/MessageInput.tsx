'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, AlertTriangle, Shield, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';

interface MessageInputProps {
  onSendMessage: (message: string, file?: File) => void;
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
        credentials: 'include',
        body: JSON.stringify({
          userMessage: text,
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

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      // Handle error or just ignore
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setPreviewUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();

    const trimmedMessage = message.trim();
    if ((!trimmedMessage && !selectedFile) || disabled || isLoading) return;
    if (trimmedMessage.length > maxLength) return;

    onSendMessage(trimmedMessage, selectedFile || undefined);
    setMessage('');
    setSafetyCheck(null);
    clearFile();

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
          role="alert"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
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

      {/* Photo Preview */}
      {previewUrl && (
        <div className="px-4 pt-4 pb-0 relative inline-block">
          <div className="relative inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Preview" className="h-20 w-auto rounded border border-border" />
            <button
              onClick={clearFile}
              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5 shadow-sm hover:bg-destructive/90"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 18 18" /></svg>
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end space-x-2">
          {/* Photo Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={handleFileSelect}
          />
          <Button
            type="button"
            variant={selectedFile ? "secondary" : "outline"}
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDisabled}
            className="flex-shrink-0"
            data-testid="photo-upload-trigger"
            aria-label="Upload photo"
          >
            <ImageIcon className="h-5 w-5" aria-hidden="true" />
          </Button>

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
              aria-label="Message input"
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
            aria-label="Send message"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="h-5 w-5" aria-hidden="true" />
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
