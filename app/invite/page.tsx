'use client'

export default function InviteLandingPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-2xl mb-4">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Invite Required</h1>
                    <p className="text-blue-200">You need an invite link to register</p>
                </div>

                {/* Info Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                    <div className="space-y-4">
                        <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4">
                            <p className="text-blue-100 text-sm">
                                <strong>How to Register:</strong>
                            </p>
                            <ol className="mt-2 space-y-2 text-blue-200 text-sm list-decimal list-inside">
                                <li>Request an invite from your organization administrator</li>
                                <li>Check your email for the invite link</li>
                                <li>Click the link to complete your registration</li>
                            </ol>
                        </div>

                        <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4">
                            <p className="text-yellow-100 text-sm">
                                <strong>Note:</strong> Invite links are unique and can only be used once. They expire after 7 days.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <a
                            href="/auth/login"
                            className="inline-block bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                            Go to Login
                        </a>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 text-center">
                    <p className="text-blue-200 text-sm">
                        Need help? Contact your system administrator
                    </p>
                </div>
            </div>
        </div>
    )
}
