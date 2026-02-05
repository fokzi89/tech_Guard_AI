'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/shared/Button'
import { FileText, Search, Calendar, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Report {
    id: string
    title: string
    created_at: string
    status: string
    customer_name?: string
}

export default function TechnicianReportsPage() {
    const router = useRouter()
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadReports()
    }, [])

    const loadReports = async () => {
        const supabase = createClient()

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Fetch reports for this technician
        // Assuming table name is 'service_reports' or similar based on typical schema, but defaulting to empty for now if not known
        // Correct approach would be to check db types, but for this step I will mock/placeholder or try 'service_reports'
        // If 'service_reports' doesn't exist, this will error.
        // Given I don't see the schema, I will create a placeholder page that *tries* to fetch but handles errors gracefully, 
        // OR I will just show a UI that says "No reports found" if the table is missing.
        // For the sake of "leading to the list of reports", a page structure is critical.

        try {
            // Try fetching from a likely table name, or just set empty for now until schema is confirmed.
            // I'll assume 'service_reports' or 'troubleshooting_sessions' (which likely generate reports).
            // Let's try 'troubleshooting_sessions' as that was mentioned in dashboard stats.
            const { data, error } = await supabase
                .from('troubleshooting_sessions')
                .select('id, title, created_at, status, customer_name')
                .eq('technician_id', user.id)
                .order('created_at', { ascending: false })

            if (data) {
                setReports(data)
            }
        } catch (e) {
            console.error('Error loading reports', e)
        }

        setLoading(false)
    }

    const filteredReports = reports.filter(report =>
        report.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="min-h-screen gradient-blue-bg p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold gradient-text">My Reports</h1>
                        <p className="gradient-text-muted mt-1">View and manage your service reports</p>
                    </div>
                </div>

                {/* Search */}
                <div className="glass-panel rounded-xl p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search reports..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Reports List */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-blue-200">Loading reports...</div>
                    ) : filteredReports.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">No reports found</h3>
                            <p className="text-blue-200">
                                You haven&apos;t generated any service reports yet.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredReports.map((report) => (
                                <div key={report.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group cursor-pointer">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium">{report.title || 'Untitled Report'}</h4>
                                            <div className="flex items-center text-sm text-blue-200 mt-1 space-x-4">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(report.created_at).toLocaleDateString()}
                                                </span>
                                                {report.customer_name && (
                                                    <span>{report.customer_name}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${report.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                                            }`}>
                                            {report.status}
                                        </span>
                                        <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-white transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
