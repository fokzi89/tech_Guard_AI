
import { useState, memo } from 'react'
import { Organization } from '@/types/auth'

interface InviteUserModalProps {
    organizations?: Organization[] // Required for Super Admin
    selectedOrg?: Organization | null // Pre-selected for Super Admin
    onClose: () => void
    currentUserRole: 'super_admin' | 'org_admin' | 'technician'
    currentOrgId?: string // Required for Org Admin
    currentOrgName?: string // Required for Org Admin
}

export const InviteUserModal = memo(function InviteUserModal({
    organizations = [],
    selectedOrg,
    onClose,
    currentUserRole,
    currentOrgId,
    currentOrgName
}: InviteUserModalProps) {
    const [formData, setFormData] = useState({
        orgId: currentUserRole === 'org_admin' ? (currentOrgId || '') : (selectedOrg?.id || ''),
        email: '',
        role: 'technician' as 'org_admin' | 'technician',
    })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [inviteLink, setInviteLink] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setInviteLink('')

        try {
            const { generateInviteToken } = await import('@/lib/actions/auth.actions')
            const result = await generateInviteToken(
                formData.orgId,
                formData.email,
                formData.role
            )

            if (result.success && result.inviteLink) {
                setInviteLink(result.inviteLink)
            } else {
                setError(result.error || 'Failed to generate invite')
            }
        } catch (err: any) {
            setError(err.message || 'An unexpected error occurred')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink)
        // Show a temporary success message
        const btn = document.getElementById('copy-btn')
        if (btn) {
            const originalText = btn.textContent
            btn.textContent = 'Copied!'
            setTimeout(() => {
                btn.textContent = 'Copy'
            }, 2000)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-white/20 shadow-2xl animate-slideUp">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-white">Invite User</h3>
                    <button
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {!inviteLink ? (
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Organization Selection Logic */}
                        {currentUserRole === 'super_admin' ? (
                            <div>
                                <label className="block text-sm font-medium text-blue-100 mb-2">
                                    Organization *
                                </label>
                                <select
                                    required
                                    value={formData.orgId}
                                    onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                                >
                                    <option value="" className="bg-slate-800">Select organization...</option>
                                    {organizations.map((org) => (
                                        <option key={org.id} value={org.id} className="bg-slate-800">{org.name}</option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-blue-100 mb-2">
                                    Organization
                                </label>
                                <div className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/70 cursor-not-allowed">
                                    {currentOrgName || 'Your Organization'}
                                </div>
                                <input type="hidden" name="orgId" value={formData.orgId} />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                placeholder="user@example.com"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Role *
                            </label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            >
                                <option value="technician" className="bg-slate-800">Technician - Field user</option>
                                <option value="org_admin" className="bg-slate-800">Organization Admin - Manager</option>
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 text-red-200 text-sm flex items-start">
                                <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <div className="flex space-x-3 pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading || !formData.orgId}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg transition-all disabled:opacity-50 font-medium shadow-lg"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Generating...
                                    </span>
                                ) : (
                                    'Generate Invite Link'
                                )}
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="space-y-5">
                        <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-start">
                            <svg className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div>
                                <p className="text-green-200 font-medium">Invite link generated successfully!</p>
                                <p className="text-green-300/70 text-sm mt-1">Share this link with the user to complete registration.</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-2">
                                Invite Link
                            </label>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={inviteLink}
                                    className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-mono"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <button
                                    id="copy-btn"
                                    onClick={copyToClipboard}
                                    className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all font-medium shadow-lg hover:shadow-xl"
                                >
                                    Copy
                                </button>
                            </div>
                            <p className="text-blue-300/70 text-xs mt-2">
                                This link expires in 7 days and can only be used once.
                            </p>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-lg transition-all font-medium"
                        >
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
})
