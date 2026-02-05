'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, AlertCircle, FileText, CheckCircle } from 'lucide-react';
import { MessageList, type Message } from '@/app/components/chat/MessageList';
import { MessageInput } from '@/app/components/chat/MessageInput';
import { SafetyLockoutModal } from '@/app/components/chat/SafetyLockoutModal';
import { PhotoUpload } from '@/app/components/chat/PhotoUpload';
import { Button } from '@/app/components/ui/button';

interface Session {
  id: string;
  machineModel: string;
  workOrderId?: string;
  description?: string;
  status: string;
  technician?: {
    full_name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface GuardianBlockResponse {
  blocked: true;
  decision: 'BLOCK';
  confidence: number;
  matchedRule?: {
    ruleId: string;
    ruleDescription: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    requiredAction: 'disconnect_power' | 'lockout_tagout';
  };
  reasoning: string;
  message: string;
}

export default function TroubleshootingSessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.sessionId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Safety Lockout Modal State
  const [isLockoutModalOpen, setIsLockoutModalOpen] = useState(false);
  const [guardianBlock, setGuardianBlock] = useState<GuardianBlockResponse | null>(
    null
  );
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  // Report Generation State
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Fetch session on mount
  useEffect(() => {
    if (!sessionId) return;

    const fetchSession = async () => {
      try {
        setIsLoadingSession(true);
        const response = await fetch(`/api/chat/session?incidentId=${sessionId}`);

        if (!response.ok) {
          throw new Error('Failed to load session');
        }

        const data = await response.json();
        setSession(data.session);

        // Load existing messages from database
        if (data.messages && data.messages.length > 0) {
          const formattedMessages = data.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: msg.created_at,
            isBlocked: msg.is_blocked,
            blockReason: msg.block_reason,
            metadata: msg.metadata,
          }));
          setMessages(formattedMessages);
        }
      } catch (err) {
        console.error('Error fetching session:', err);
        setSessionError(
          err instanceof Error ? err.message : 'Failed to load session'
        );
      } finally {
        setIsLoadingSession(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  // Manual chat state management
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [chatError, setChatError] = useState<Error | null>(null);

  // Load initial messages
  useEffect(() => {
    if (session) {
      // If we fetched messages with the session, set them here
      // But currently session fetch doesn't return messages in the initial 'session' object if api structure is separate?
      // Wait, the API GET /api/chat/session returns { session: ..., messages: ... }
      // The current fetch logic in useEffect setsSession and ignores messages.
      // Need to capture messages from the GET response.
    }
  }, [session]);

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: content,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setChatError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          sessionId,
          machineModel: session?.machineModel || '',
        }),
      });

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response as JSON:', responseText);
        // Check if it looks like an HTML error page
        if (responseText.includes('<!DOCTYPE html>')) {
          throw new Error(`Authentication Error: Session may have expired. Please refresh the page or log in again.`);
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      if (response.status === 403 && data.blocked) {
        setGuardianBlock(data as GuardianBlockResponse);
        setIsLockoutModalOpen(true);

        // Add system message for block
        const blockMessage: Message = {
          id: crypto.randomUUID(),
          role: 'system',
          content: data.message || 'Request blocked by safety guardian.',
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, blockMessage]);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Success - add assistant response
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response, // The API returns 'response' field
        timestamp: new Date().toISOString(),
        // Map metadata if needed (citations etc)
        // The API returns metadata in various fields like citedManuals
      };
      setMessages((prev) => [...prev, assistantMessage]);

    } catch (error) {
      console.error('Chat error:', error);
      setChatError(error instanceof Error ? error : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUploadClick = () => {
    setShowPhotoUpload(true);
  };

  const handleVerificationSuccess = () => {
    setShowPhotoUpload(false);
    setIsLockoutModalOpen(false);
    setGuardianBlock(null);
  };

  const handleVerificationFailure = () => {
    // Keep modal open, user can try again
    setShowPhotoUpload(false);
  };

  const handleVerificationComplete = () => {
    setIsLockoutModalOpen(false);
    setGuardianBlock(null);
  };

  const handleGenerateReport = async () => {
    try {
      setIsGeneratingReport(true);
      setReportError(null);

      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentId: sessionId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate report');
      }

      const report = await response.json();
      setReportGenerated(true);

      // Show success for 3 seconds, then redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Error generating report:', error);
      setReportError(
        error instanceof Error ? error.message : 'Failed to generate report'
      );
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Loading state
  if (isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading session...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (sessionError || !session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <p className="text-muted-foreground mb-6">
            {sessionError || 'This troubleshooting session could not be found.'}
          </p>
          <Button onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-nav text-nav-foreground">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/dashboard')}
                className="text-nav-foreground hover:bg-nav-hover"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold">{session.machineModel}</h1>
                <p className="text-sm opacity-80">
                  {session.workOrderId && `Work Order: ${session.workOrderId} • `}
                  Session ID: {session.id.slice(0, 8)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right text-sm">
                <p className="opacity-80">
                  {session.technician?.full_name || 'Unknown Technician'}
                </p>
                <p className="text-xs opacity-60">
                  Started {new Date(session.createdAt).toLocaleString()}
                </p>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || reportGenerated}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : reportGenerated ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Report Generated
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4 mr-2" />
                      Generate Report
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-hidden">
        <MessageList
          messages={messages as Message[]}
          isLoading={isLoading}
          className="h-full"
        />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={(message) => handleSendMessage(message)}
        onPhotoUploadClick={handlePhotoUploadClick}
        disabled={isLockoutModalOpen || isLoading}
        isLoading={isLoading}
        machineModel={session.machineModel}
        showSafetyIndicator={true}
      />

      {/* Safety Lockout Modal */}
      {guardianBlock && (
        <SafetyLockoutModal
          isOpen={isLockoutModalOpen}
          matchedRule={guardianBlock.matchedRule}
          reasoning={guardianBlock.reasoning}
          confidence={guardianBlock.confidence}
          onPhotoUpload={() => setShowPhotoUpload(true)}
          onVerificationComplete={handleVerificationComplete}
        />
      )}

      {/* Photo Upload Modal */}
      {showPhotoUpload && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" />

          {/* Modal */}
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg bg-background border border-border rounded-lg shadow-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Upload Verification Photo</h2>
            <PhotoUpload
              incidentId={sessionId}
              machineModel={session.machineModel}
              verificationType={
                guardianBlock?.matchedRule?.requiredAction === 'lockout_tagout'
                  ? 'lockout_applied'
                  : 'power_disconnected'
              }
              onVerificationSuccess={handleVerificationSuccess}
              onVerificationFailure={handleVerificationFailure}
              onCancel={() => setShowPhotoUpload(false)}
            />
          </div>
        </>
      )}

      {/* Chat Error */}
      {chatError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-foreground">{chatError.message}</p>
          </div>
        </div>
      )}

      {/* Report Error */}
      {reportError && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-destructive/10 border border-destructive/20 rounded-lg p-4 max-w-md z-50">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Report Generation Failed</p>
              <p className="text-xs text-muted-foreground">{reportError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReportError(null)}
              className="text-muted-foreground hover:text-foreground"
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* Report Success Notification */}
      {reportGenerated && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-green-500/10 border border-green-500/20 rounded-lg p-4 max-w-md z-50">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Report Generated Successfully</p>
              <p className="text-xs text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
