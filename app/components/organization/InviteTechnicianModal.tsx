'use client'

import * as React from 'react'
import { Button } from '@/app/components/ui/button'
import { X, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export interface InviteTechnicianModalProps {
  open: boolean
  onClose: () => void
}

export function InviteTechnicianModal({
  open,
  onClose,
}: InviteTechnicianModalProps) {
  const [inviteLink, setInviteLink] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(true)
  const [copied, setCopied] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    if (open) {
      generateInviteLink()
    }
  }, [open])

  const generateInviteLink = async () => {
    setIsLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setError('You must be logged in to generate invite links')
        setIsLoading(false)
        return
      }

      // Get org_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('org_id')
        .eq('id', user.id)
        .single()

      const profileData = profile as any

      if (!profileData?.org_id) {
        setError('No organization found')
        setIsLoading(false)
        return
      }

      // Generate invite token
      const response = await fetch('/api/org/invite/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: profileData.org_id,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate invite link')
      }

      const data = await response.json()
      const baseUrl = window.location.origin
      const link = `${baseUrl}/auth/invite/${data.token}`

      setInviteLink(link)
      setIsLoading(false)
    } catch (err) {
      console.error('Error generating invite link:', err)
      setError('Failed to generate invite link. Please try again.')
      setIsLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClose = () => {
    setInviteLink('')
    setCopied(false)
    setError('')
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-lg w-full mx-auto border border-border">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">Invite Technician</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Share this link with technicians to join your organization
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium mb-2 text-foreground">
                  Invite Link
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <strong>Note:</strong> This link allows anyone with access to register as a technician in your organization.
                  Share it only with trusted individuals.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-border bg-muted/50">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          {!isLoading && !error && (
            <Button onClick={generateInviteLink}>
              Generate New Link
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
