'use client'

import * as React from 'react'
import { Button } from '@/app/components/ui/button'
import { X } from 'lucide-react'

export interface ConfirmationDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  confirmButtonVariant?: 'default' | 'destructive'
  requireTextConfirmation?: boolean
  confirmationText?: string
  isLoading?: boolean
  children?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  confirmButtonVariant = 'default',
  requireTextConfirmation = false,
  confirmationText = 'DELETE',
  isLoading = false,
  children,
}: ConfirmationDialogProps) {
  const [inputValue, setInputValue] = React.useState('')

  const canConfirm = !requireTextConfirmation || inputValue === confirmationText

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm()
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      setInputValue('')
      onClose()
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-md w-full mx-auto border border-border">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">{title}</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            disabled={isLoading}
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">{description}</p>

          {requireTextConfirmation && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Type <span className="font-mono font-bold text-destructive">{confirmationText}</span> to confirm
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={confirmationText}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>
          )}

          {children}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-border bg-muted/50">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant={confirmButtonVariant}
            onClick={handleConfirm}
            disabled={!canConfirm || isLoading}
          >
            {isLoading ? 'Processing...' : confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}
