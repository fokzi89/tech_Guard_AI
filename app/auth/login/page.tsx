'use client'

import { useState, useEffect, Suspense } from 'react'
import { authService } from '@/lib/services/auth.service'
import { useRouter, useSearchParams } from 'next/navigation'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [loading, setLoading] = useState(false)

    // Check for success message from password reset
    useEffect(() => {
        if (searchParams.get('reset') === 'success') {
            setSuccessMessage('Password reset successful! Please sign in with your new password.')
        }

        // Check for session error from middleware
        if (searchParams.get('error') === 'session_expired') {
            setError('Your session has expired. Please sign in again.')
        }
    }, [searchParams])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await authService.signIn(formData.email, formData.password)

            if (result.success) {
                // Get user info to redirect to role-specific dashboard
                const currentUser = await authService.getCurrentUser()

                if (currentUser) {
                    // Redirect based on role
                    if (currentUser.profile.role === 'super_admin') {
                        router.push('/dashboard')
                    } else if (currentUser.profile.role === 'org_admin') {
                        router.push('/dashboard/organization')
                    } else {
                        router.push('/dashboard/technician')
                    }
                } else {
                    router.push('/dashboard')
                }
            } else {
                setError(result.error || 'Login failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center gradient-blue-bg p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                        <svg className="w-10 h-10 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">TechGuard AI</h1>
                    <p className="gradient-text-muted">Sign in to your account</p>
                </div>

                {/* Login Form */}
                <div className="gradient-card rounded-2xl shadow-2xl p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-card-foreground mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                placeholder="you@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-card-foreground mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                required
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="w-full px-4 py-3 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Success Message */}
                        {successMessage && (
                            <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3 text-green-600 dark:text-green-400 text-sm">
                                {successMessage}
                            </div>
                        )}

                        {/* Error Message */}
                        {error && (
                            <div className="bg-destructive/20 border border-destructive/50 rounded-lg p-3 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-foreground" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Logging in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    {/* Forgot Password */}
                    <div className="mt-4 text-center">
                        <a href="/auth/forgot-password" className="text-accent hover:opacity-80 text-sm font-medium transition-opacity">
                            Forgot your password?
                        </a>
                    </div>
                </div>

                {/* Register Link */}
                <div className="mt-6">
                    <div className="bg-secondary/50 border border-border rounded-lg p-4 text-center">
                        <p className="gradient-text-muted text-sm mb-2">
                            Have an invite code?
                        </p>
                        <a
                            href="/invite"
                            className="text-accent hover:opacity-80 font-medium transition-opacity"
                        >
                            Register with Invite
                        </a>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center gradient-blue-bg">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4">
                        <svg className="w-10 h-10 text-primary-foreground animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    )
}
