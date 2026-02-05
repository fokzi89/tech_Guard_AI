'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/shared/Button'
import Link from 'next/link'

interface InviteToken {
  id: string
  org_id: string
  role: string
  token: string
  expires_at: string
  used: boolean
  organizations: {
    name: string
  }
}

export default function InviteAcceptPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [inviteToken, setInviteToken] = useState<InviteToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    setLoading(true)
    setError('')

    try {
      const supabase = createClient()

      // Validate the invite token
      const { data: tokenData, error: tokenError } = await supabase
        .from('invite_tokens')
        .select('*, organizations(name)')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single()

      if (tokenError || !tokenData) {
        setError('Invalid or expired invite link')
        setLoading(false)
        return
      }

      setInviteToken(tokenData as unknown as InviteToken)
      setLoading(false)
    } catch (err) {
      console.error('Error validating token:', err)
      setError('Failed to validate invite link')
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      // Use the server action for secure registration and linking
      const { registerWithInvite } = await import('@/lib/actions/auth.actions')

      const result = await registerWithInvite(
        token,
        formData.password,
        formData.fullName,
        formData.email
      )

      if (!result.success) {
        setError(result.error || 'Registration failed')
        setIsSubmitting(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      console.error('Error accepting invite:', err)
      setError('Failed to accept invite. Please try again.')
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-blue-bg">
        <div className="glass-panel rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
          <p className="text-center mt-4 gradient-text">Validating invite link...</p>
        </div>
      </div>
    )
  }

  if (error && !inviteToken) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-blue-bg">
        <div className="glass-panel rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-red-600 dark:text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="mt-4 text-xl font-bold gradient-text">Invalid Invite Link</h2>
            <p className="mt-2 text-sm gradient-text-muted">{error}</p>
            <div className="mt-6">
              <Link href="/auth/login">
                <Button variant="default">Go to Login</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center gradient-blue-bg">
      <div className="glass-panel rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold gradient-text">Join {inviteToken?.organizations?.name}</h2>
          <p className="mt-2 text-sm gradient-text-muted">
            You've been invited to join as a technician
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium gradient-text mb-1">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium gradient-text mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium gradient-text mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs gradient-text-muted">
              Password must be at least 8 characters
            </p>
          </div>

          <Button
            type="submit"
            variant="default"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Account...' : 'Accept Invite & Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm gradient-text-muted">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
