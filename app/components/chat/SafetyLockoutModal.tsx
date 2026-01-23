'use client';

import { useState } from 'react';
import { AlertTriangle, Shield, Lock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/app/components/ui/button';

interface SafetyRule {
  ruleId: string;
  ruleDescription: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  requiredAction: 'disconnect_power' | 'lockout_tagout';
}

interface SafetyLockoutModalProps {
  isOpen: boolean;
  matchedRule?: SafetyRule;
  reasoning: string;
  confidence: number;
  onPhotoUpload: () => void;
  onVerificationComplete: () => void;
  className?: string;
}

export function SafetyLockoutModal({
  isOpen,
  matchedRule,
  reasoning,
  confidence,
  onPhotoUpload,
  onVerificationComplete,
  className,
}: SafetyLockoutModalProps) {
  const [verificationStep, setVerificationStep] = useState<
    'locked' | 'uploading' | 'verified'
  >('locked');

  if (!isOpen) return null;

  const severityColors = {
    CRITICAL: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20',
    HIGH: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
    MEDIUM:
      'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  };

  const actionLabels = {
    disconnect_power: 'Disconnect Power',
    lockout_tagout: 'Apply Lockout/Tagout',
  };

  return (
    <>
      {/* Backdrop - Cannot be dismissed */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        data-testid="safety-lockout-modal-backdrop"
        onClick={(e) => e.stopPropagation()} // Prevent click-outside dismissal
      />

      {/* Modal */}
      <div
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
          'w-full max-w-2xl max-h-[90vh] overflow-y-auto',
          'bg-background border border-border rounded-lg shadow-2xl',
          className
        )}
        data-testid="safety-lockout-modal"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="safety-lockout-title"
      >
        {/* Header - Critical Warning */}
        <div className="bg-destructive/10 border-b border-destructive/20 p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            <div className="flex-1">
              <h2
                id="safety-lockout-title"
                className="text-2xl font-bold text-destructive mb-2"
              >
                CRITICAL SAFETY LOCKOUT
              </h2>
              <p className="text-foreground">
                This request has been blocked to protect your safety.
              </p>
            </div>
            <div className="flex-shrink-0">
              <Lock className="h-6 w-6 text-destructive" />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Matched Rule */}
          {matchedRule && (
            <div
              className={cn(
                'p-4 rounded-lg border',
                severityColors[matchedRule.severity]
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold">Detected Safety Violation</h3>
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-bold rounded',
                    matchedRule.severity === 'CRITICAL' &&
                      'bg-red-500 text-white',
                    matchedRule.severity === 'HIGH' &&
                      'bg-orange-500 text-white',
                    matchedRule.severity === 'MEDIUM' &&
                      'bg-yellow-500 text-black'
                  )}
                >
                  {matchedRule.severity}
                </span>
              </div>
              <p className="text-sm mb-2">{matchedRule.ruleDescription}</p>
              <p className="text-xs opacity-70">Rule ID: {matchedRule.ruleId}</p>
            </div>
          )}

          {/* Reasoning */}
          <div className="bg-muted rounded-lg p-4">
            <h3 className="font-semibold mb-2 flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Why was this blocked?</span>
            </h3>
            <p className="text-sm text-muted-foreground">{reasoning}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Confidence: {(confidence * 100).toFixed(0)}%
            </p>
          </div>

          {/* Isolation Protocol Steps */}
          <div className="bg-background border border-border rounded-lg p-4">
            <h3 className="font-semibold mb-4 flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <span>Safety Isolation Protocol</span>
            </h3>

            <div className="space-y-4">
              {/* Step 1 */}
              <IsolationStep
                number={1}
                title={
                  matchedRule
                    ? actionLabels[matchedRule.requiredAction]
                    : 'Disconnect Power'
                }
                description="Ensure the equipment is completely de-energized before proceeding."
                completed={verificationStep !== 'locked'}
              />

              {/* Step 2 */}
              <IsolationStep
                number={2}
                title="Verify Isolation"
                description="Take a clear photo showing the disconnected power cable or lockout device."
                completed={verificationStep === 'verified'}
              />

              {/* Step 3 */}
              <IsolationStep
                number={3}
                title="Receive Safe Procedure"
                description="After verification, you'll receive step-by-step guidance."
                completed={verificationStep === 'verified'}
              />
            </div>
          </div>

          {/* Verification Status */}
          {verificationStep === 'locked' && (
            <div className="text-center py-6">
              <p className="text-muted-foreground mb-4">
                You must complete the Safety Isolation Protocol to proceed.
              </p>
              <Button
                onClick={() => {
                  setVerificationStep('uploading');
                  onPhotoUpload();
                }}
                size="lg"
                className="bg-primary text-primary-foreground"
                data-testid="begin-verification-button"
              >
                Begin Photo Verification
              </Button>
            </div>
          )}

          {verificationStep === 'uploading' && (
            <div className="text-center py-6 bg-muted rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-3">
                <Shield className="h-6 w-6 text-primary animate-pulse" />
              </div>
              <p className="font-medium">Verifying photo...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please wait while we analyze your safety isolation photo.
              </p>
            </div>
          )}

          {verificationStep === 'verified' && (
            <div className="text-center py-6 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mb-3">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-medium text-green-600 dark:text-green-400">
                Safety Isolation Verified
              </p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                You may now proceed with the procedure safely.
              </p>
              <Button
                onClick={onVerificationComplete}
                size="lg"
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="proceed-button"
              >
                Continue to Safe Procedure
              </Button>
            </div>
          )}

          {/* Warning Footer */}
          <div className="bg-destructive/5 border border-destructive/10 rounded-lg p-4">
            <p className="text-xs text-muted-foreground">
              <strong>Safety Notice:</strong> Working on energized equipment can
              result in electric shock, severe injury, or death. Always follow
              proper lockout/tagout procedures. If you are unsure, contact a
              supervisor or qualified electrician.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

interface IsolationStepProps {
  number: number;
  title: string;
  description: string;
  completed: boolean;
}

function IsolationStep({
  number,
  title,
  description,
  completed,
}: IsolationStepProps) {
  return (
    <div className="flex items-start space-x-3">
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
          completed
            ? 'bg-green-500/20 text-green-600 dark:text-green-400'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {completed ? <CheckCircle className="h-5 w-5" /> : number}
      </div>
      <div className="flex-1">
        <h4 className={cn('font-medium', completed && 'text-green-600 dark:text-green-400')}>
          {title}
        </h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

// Helper function to update verification step from parent component
export function useSafetyLockoutModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [verificationStep, setVerificationStep] = useState<
    'locked' | 'uploading' | 'verified'
  >('locked');

  const openModal = () => {
    setIsOpen(true);
    setVerificationStep('locked');
  };

  const closeModal = () => {
    setIsOpen(false);
    setVerificationStep('locked');
  };

  const startVerification = () => {
    setVerificationStep('uploading');
  };

  const completeVerification = () => {
    setVerificationStep('verified');
  };

  return {
    isOpen,
    verificationStep,
    openModal,
    closeModal,
    startVerification,
    completeVerification,
  };
}
