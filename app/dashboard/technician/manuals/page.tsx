'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/shared/Button'
import { ArrowLeft, FileText, Search, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Manual {
    id: string
    title: string
    machine_model: string
    file_url: string
    created_at: string
}

export default function TechnicianManualsPage() {
    const router = useRouter()
    const [manuals, setManuals] = useState<Manual[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadManuals()
    }, [])

    const loadManuals = async () => {
        const supabase = createClient()

        // Get current user's profile to find org_id
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profileData } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single()

        const profile = profileData as any;

        if (!profile?.org_id) {
            console.error('No organization found')
            setLoading(false)
            return
        }

        // Fetch manuals for this organization
        const { data, error } = await supabase
            .from('manuals')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error loading manuals:', error)
        } else {
            setManuals(data || [])
        }
        setLoading(false)
    }

    const filteredManuals = manuals.filter(manual =>
        manual.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        manual.machine_model.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen gradient-blue-bg p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">Technical Manuals</h1>
                            <p className="gradient-text-muted mt-1">Access documentation and guides</p>
                        </div>
                    </div>
                </div>

                {/* Search */}
                <div className="glass-panel rounded-xl p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by title or model..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Manuals List */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="glass-panel rounded-xl p-6 h-40 animate-pulse"></div>
                        ))}
                    </div>
                ) : filteredManuals.length === 0 ? (
                    <div className="text-center py-16 glass-panel rounded-xl">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-medium text-white mb-2">No manuals found</h3>
                        <p className="text-blue-200">
                            {searchQuery ? 'Try adjusting your search terms' : 'No manuals have been uploaded yet'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredManuals.map((manual) => (
                            <div key={manual.id} className="glass-panel glass-panel-hover rounded-xl p-6 group transition-all duration-300">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 bg-blue-500/20 rounded-lg">
                                        <FileText className="h-6 w-6 text-blue-400" />
                                    </div>
                                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10 text-blue-200 border border-white/10">
                                        PDF
                                    </span>
                                </div>

                                <h3 className="text-lg font-semibold text-white mb-2 line-clamp-1" title={manual.title}>
                                    {manual.title}
                                </h3>

                                <div className="flex items-center text-sm text-blue-200 mb-4">
                                    <span className="opacity-70 mr-2">Model:</span>
                                    <span className="font-medium">{manual.machine_model}</span>
                                </div>

                                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                                    <span className="text-xs text-blue-300/60">
                                        Added {new Date(manual.created_at).toLocaleDateString()}
                                    </span>
                                    <a
                                        href={manual.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
                                    >
                                        View
                                        <ExternalLink className="h-4 w-4 ml-1" />
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
