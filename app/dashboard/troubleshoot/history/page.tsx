'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquare, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { NavigationButton } from '@/app/components/ui/navigation-button';
import { cn } from '@/lib/utils';

interface TroubleshootingSession {
  id: string;
  machine_model: string;
  external_ticket_id?: string;
  status: 'open' | 'resolved' | 'abandoned';
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export default function TroubleshootingHistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TroubleshootingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      // TODO: Create API endpoint to fetch user's sessions
      // For now, we'll use a placeholder
      const response = await fetch('/api/incidents/history');

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionClick = (sessionId: string) => {
    router.push(`/dashboard/troubleshoot/${sessionId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-nav text-nav-foreground">
        <div className="container mx-auto px-4 py-4">
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
              <h1 className="text-xl font-bold">Troubleshooting History</h1>
              <p className="text-sm opacity-80">View all your past troubleshooting sessions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm text-foreground">{error}</p>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h2 className="text-xl font-semibold mb-2">No Sessions Yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't started any troubleshooting sessions.
            </p>
            <NavigationButton href="/dashboard/troubleshoot/new">
              Start New Session
            </NavigationButton>
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl mx-auto">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => handleSessionClick(session.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: TroubleshootingSession;
  onClick: () => void;
}

function SessionCard({ session, onClick }: SessionCardProps) {
  const statusConfig = {
    open: {
      icon: Clock,
      label: 'Open',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    resolved: {
      icon: CheckCircle2,
      label: 'Resolved',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    abandoned: {
      icon: XCircle,
      label: 'Abandoned',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
    },
  };

  const config = statusConfig[session.status];
  const StatusIcon = config.icon;

  return (
    <button
      onClick={onClick}
      className="w-full text-left gradient-card p-6 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-1">{session.machine_model}</h3>
          {session.external_ticket_id && (
            <p className="text-sm text-muted-foreground font-mono">
              Ticket: {session.external_ticket_id}
            </p>
          )}
        </div>
        <div
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
            config.bgColor,
            config.color,
            'border',
            config.borderColor
          )}
        >
          <StatusIcon className="h-3 w-3" />
          <span>{config.label}</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center space-x-4">
          {session.external_ticket_id && (
            <span className="flex items-center space-x-1">
              <span className="font-mono">{session.external_ticket_id}</span>
            </span>
          )}
          <span className="flex items-center space-x-1">
            <MessageSquare className="h-3 w-3" />
            <span>{session.message_count || 0} messages</span>
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{formatRelativeTime(session.created_at)}</span>
        </div>
      </div>
    </button>
  );
}

function formatRelativeTime(timestamp: string): string {
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
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  } catch {
    return timestamp;
  }
}
