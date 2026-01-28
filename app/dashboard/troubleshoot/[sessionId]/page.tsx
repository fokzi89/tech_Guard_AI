'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@ai-sdk/react';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';
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
          // TODO: Set initial messages in useChat
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

  // useChat hook from Vercel AI SDK
  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    error: chatError,
    append,
  } = useChat({
    api: '/api/chat',
    body: {
      incidentId: sessionId,
      machineModel: session?.machineModel || '',
    },
    onResponse: async (response) => {
      // Check if Guardian blocked the request
      if (response.headers.get('content-type')?.includes('application/json')) {
        const data = await response.json();

        if (data.blocked) {
          // Guardian blocked - open lockout modal
          setGuardianBlock(data as GuardianBlockResponse);
          setIsLockoutModalOpen(true);
          return;
        }
      }
    },
    onError: (error) => {
      console.error('Chat error:', error);
    },
  });

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
            <div className="text-right text-sm">
              <p className="opacity-80">
                {session.technician?.full_name || 'Unknown Technician'}
              </p>
              <p className="text-xs opacity-60">
                Started {new Date(session.createdAt).toLocaleString()}
              </p>
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
        onSendMessage={(message) => {
          append({
            role: 'user',
            content: message,
          });
        }}
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
    </div>
  );
}
