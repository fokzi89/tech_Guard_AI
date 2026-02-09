'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import {
  Upload,
  Camera,
  X,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { validateFile } from '@/lib/utils/file-validation';
import { Button } from '@/app/components/ui/button';
import { createClient } from '@/lib/supabase/client';

interface PhotoUploadProps {
  incidentId: string;
  machineModel: string;
  verificationType?: 'power_disconnected' | 'lockout_applied' | 'general_safety';
  onVerificationSuccess: (result: VerificationResult) => void;
  onVerificationFailure: (result: VerificationResult) => void;
  onCancel?: () => void;
  className?: string;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  analysis: string;
  message: string;
  details?: string[];
}

export function PhotoUpload({
  incidentId,
  machineModel,
  verificationType = 'power_disconnected',
  onVerificationSuccess,
  onVerificationFailure,
  onCancel,
  className,
}: PhotoUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadState, setUploadState] = useState<
    'idle' | 'uploading' | 'verifying' | 'success' | 'error'
  >('idle');
  const [verificationResult, setVerificationResult] =
    useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    // Validate file
    const validation = validateFile(file, ['image/'], 10 * 1024 * 1024);
    if (!validation.valid) {
      setError(validation.error || 'Invalid file');
      return;
    }

    setSelectedFile(file);
    setError(null);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleUploadAndVerify = async () => {
    if (!selectedFile) return;

    try {
      setUploadState('uploading');
      setError(null);

      // Step 1: Upload to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${incidentId}_${Date.now()}.${fileExt}`;
      const filePath = `${incidentId}/${Date.now()}_${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('safety-photos') // Bucket name
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Step 2: Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('safety-photos').getPublicUrl(filePath);

      // Step 3: Call verification API
      setUploadState('verifying');

      const response = await fetch('/api/safety/verify-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          photoUrl: publicUrl,
          incidentId,
          machineModel,
          verificationType,
        }),
      });

      const result: VerificationResult = await response.json();
      setVerificationResult(result);

      if (result.verified) {
        setUploadState('success');
        onVerificationSuccess(result);
      } else {
        setUploadState('error');
        onVerificationFailure(result);
      }
    } catch (err) {
      console.error('Photo verification error:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setUploadState('error');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadState('idle');
    setVerificationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const verificationTypeLabels = {
    power_disconnected: 'Power Disconnection',
    lockout_applied: 'Lockout/Tagout',
    general_safety: 'General Safety',
  };

  return (
    <div className={cn('space-y-4', className)} data-testid="photo-upload">
      {/* Instructions */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="font-semibold mb-2 flex items-center space-x-2">
          <Camera className="h-5 w-5" />
          <span>Safety Verification Photo</span>
        </h3>
        <p className="text-sm text-muted-foreground mb-2">
          Take a clear photo showing:{' '}
          <strong>{verificationTypeLabels[verificationType]}</strong>
        </p>
        <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
          <li>Ensure good lighting</li>
          <li>Hold camera steady for clear focus</li>
          <li>Show the power connection or lockout device clearly</li>
          <li>Photo must be JPEG or PNG, under 10MB</li>
        </ul>
      </div>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // Use rear camera on mobile
        onChange={handleFileSelect}
        className="hidden"
        data-testid="photo-file-input"
      />

      {/* Photo Preview */}
      {previewUrl && (
        <div className="relative h-64 w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <Image
            src={previewUrl}
            alt="Selected photo"
            layout="fill"
            objectFit="cover"
            className="rounded-lg border border-border"
          />
          {uploadState === 'idle' && (
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2"
              onClick={handleReset}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Upload Area with Drag & Drop */}
      {!selectedFile && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50",
            uploadState !== 'idle' && "opacity-50 pointer-events-none"
          )}
        >
          {uploadState === 'idle' ? (
            <div onClick={() => fileInputRef.current?.click()}>
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-4 bg-muted rounded-full">
                  <Camera className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm">
                    {isDragging ? "Drop photo here" : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPEG, PNG up to 10MB
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium">
                {uploadState === 'uploading' ? 'Uploading...' : 'Verifying...'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Upload Button (Legacy/Mobile Fallback if needed, but integration into dropzone usually sufficient) */}
      {/* We replaced the separate button with the dropzone click handler above */}

      {/* Verify Button */}
      {selectedFile && uploadState === 'idle' && (
        <Button
          onClick={handleUploadAndVerify}
          className="w-full"
          size="lg"
          data-testid="verify-photo-button"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload and Verify
        </Button>
      )}

      {/* Verification Result - Success */}
      {uploadState === 'success' && verificationResult && (
        <div
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
          data-testid="verification-success"
        >
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-green-600 dark:text-green-400 mb-1">
                Verification Successful
              </h4>
              <p className="text-sm text-foreground mb-2">
                {verificationResult.message}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                Confidence: {(verificationResult.confidence * 100).toFixed(0)}%
              </p>
              {verificationResult.details && (
                <ul className="text-sm space-y-1">
                  {verificationResult.details.map((detail, index) => (
                    <li key={index} className="flex items-center space-x-2">
                      <CheckCircle className="h-3 w-3 text-green-600 dark:text-green-400" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Verification Result - Failure */}
      {uploadState === 'error' && verificationResult && !error && (
        <div
          className="bg-destructive/10 border border-destructive/20 rounded-lg p-4"
          data-testid="verification-failure"
        >
          <div className="flex items-start space-x-3">
            <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-1">
                Verification Failed
              </h4>
              <p className="text-sm text-foreground mb-2">
                {verificationResult.message}
              </p>
              {verificationResult.details && (
                <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
                  {verificationResult.details.map((detail, index) => (
                    <li key={index}>{detail}</li>
                  ))}
                </ul>
              )}
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-destructive mb-1">Error</h4>
              <p className="text-sm text-foreground">{error}</p>
              <Button
                onClick={handleReset}
                variant="outline"
                size="sm"
                className="mt-3"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Button */}
      {onCancel && uploadState === 'idle' && (
        <Button onClick={onCancel} variant="ghost" className="w-full">
          Cancel
        </Button>
      )}
    </div>
  );
}
