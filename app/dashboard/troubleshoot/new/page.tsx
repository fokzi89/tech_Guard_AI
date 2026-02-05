'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Wrench } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/shared/Input';

const newSessionSchema = z.object({
  machineModel: z.string().min(1, 'Machine model is required'),
  workOrderId: z.string().optional(),
  description: z.string().optional(),
  location: z.string().optional(),
});

type NewSessionForm = z.infer<typeof newSessionSchema>;

export default function NewTroubleshootingSessionPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<NewSessionForm>({
    machineModel: '',
    workOrderId: '',
    description: '',
    location: '',
  });

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof NewSessionForm, string>>
  >({});

  const handleChange = (field: keyof NewSessionForm, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    // Validate form
    const result = newSessionSchema.safeParse(formData);
    if (!result.success) {
      const errors: Partial<Record<keyof NewSessionForm, string>> = {};
      result.error.issues.forEach((err) => {
        const field = err.path[0] as keyof NewSessionForm;
        errors[field] = err.message;
      });
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch('/api/chat/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create session');
      }

      const data = await response.json();

      // Redirect to chat page
      router.push(`/dashboard/troubleshoot/${data.id}`);
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err instanceof Error ? err.message : 'Failed to create session');
      setIsSubmitting(false);
    }
  };

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
              <h1 className="text-xl font-bold">New Troubleshooting Session</h1>
              <p className="text-sm opacity-80">
                Start a new session to troubleshoot equipment
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="gradient-card p-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-6">
            <Wrench className="h-8 w-8 text-primary" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Machine Model */}
            <div>
              <label
                htmlFor="machineModel"
                className="block text-sm font-medium mb-2"
              >
                Machine Model <span className="text-destructive">*</span>
              </label>
              <Input
                id="machineModel"
                type="text"
                placeholder="e.g., Domino M230i, Videojet 1580"
                value={formData.machineModel}
                onChange={(e) => handleChange('machineModel', e.target.value)}
                error={fieldErrors.machineModel}
                disabled={isSubmitting}
                required
                aria-invalid={!!fieldErrors.machineModel}
                aria-describedby="machineModel-hint machineModel-error"
                name="machineModel"
              />
              <p id="machineModel-hint" className="text-xs text-muted-foreground mt-1">
                Enter the exact model number of the equipment
              </p>
              {fieldErrors.machineModel && (
                <p id="machineModel-error" className="text-xs text-destructive mt-1">
                  {fieldErrors.machineModel}
                </p>
              )}
            </div>

            {/* Work Order ID */}
            <div>
              <label
                htmlFor="workOrderId"
                className="block text-sm font-medium mb-2"
              >
                Work Order / Ticket ID
              </label>
              <Input
                id="workOrderId"
                type="text"
                placeholder="e.g., WO-12345, TICKET-789"
                value={formData.workOrderId}
                onChange={(e) => handleChange('workOrderId', e.target.value)}
                disabled={isSubmitting}
                aria-describedby="workOrderId-hint"
                name="workOrderId"
              />
              <p id="workOrderId-hint" className="text-xs text-muted-foreground mt-1">
                Optional: Link this session to a CMMS work order
              </p>
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium mb-2"
              >
                Problem Description
              </label>
              <textarea
                id="description"
                rows={4}
                placeholder="Describe the issue you're experiencing..."
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50"
                aria-describedby="description-hint"
                name="description"
              />
              <p id="description-hint" className="text-xs text-muted-foreground mt-1">
                Optional: Briefly describe what's happening
              </p>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium mb-2">
                Equipment Location
              </label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., Plant 3, Line 2, Building A"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Where is the equipment located?
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
                role="alert"
              >
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Session...
                </>
              ) : (
                'Start Troubleshooting'
              )}
            </Button>
          </form>

          {/* Safety Notice */}
          <div className="mt-8 p-4 bg-muted rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Safety Notice:</strong> TechGuard AI provides guidance to
              assist troubleshooting, but always follow your organization's safety
              procedures. If you're unsure about any procedure, consult a supervisor
              or qualified technician.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
