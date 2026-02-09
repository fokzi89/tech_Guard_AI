'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/shared/Button'
import { FileText, Search, Calendar, ChevronRight, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Report {
    id: string
    incident_id: string
    work_order: string | null
    as_found: string
    work_performed: string
    as_left: string
    generated_at: string
    machine_model?: string
    incident_status?: string
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
        if (!user) {
            setLoading(false)
            return
        }

        try {
            // Fetch service reports for this technician with incident details
            const { data, error } = await supabase
                .from('service_reports')
                .select(`
                    id,
                    incident_id,
                    work_order,
                    as_found,
                    work_performed,
                    as_left,
                    generated_at,
                    incidents!inner(
                        user_id,
                        machine_model,
                        status
                    )
                `)
                .eq('incidents.user_id', user.id)
                .order('generated_at', { ascending: false })

            if (error) {
                console.error('Error loading reports:', error)
            } else if (data) {
                // Transform the data to flatten incident fields
                const transformedReports = data.map((report: any) => ({
                    id: report.id,
                    incident_id: report.incident_id,
                    work_order: report.work_order,
                    as_found: report.as_found,
                    work_performed: report.work_performed,
                    as_left: report.as_left,
                    generated_at: report.generated_at,
                    machine_model: report.incidents?.machine_model,
                    incident_status: report.incidents?.status
                }))
                setReports(transformedReports)
            }
        } catch (e) {
            console.error('Error loading reports:', e)
        }

        setLoading(false)
    }

    const filteredReports = reports.filter(report =>
        report.machine_model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.work_order?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        report.as_found?.toLowerCase().includes(searchQuery.toLowerCase())
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
                        <div className="p-8 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400 mx-auto mb-2" />
                            <p className="text-blue-200">Loading reports...</p>
                        </div>
                    ) : filteredReports.length === 0 ? (
                        <div className="p-16 text-center">
                            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileText className="h-8 w-8 text-gray-400" />
                            </div>
                            <h3 className="text-xl font-medium text-white mb-2">No reports found</h3>
                            <p className="text-blue-200">
                                {searchQuery
                                    ? 'No reports match your search criteria.'
                                    : 'You haven\'t generated any service reports yet.'}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/10">
                            {filteredReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group cursor-pointer"
                                    onClick={() => router.push(`/dashboard/technician/reports/${report.id}`)}
                                >
                                    <div className="flex items-center space-x-4 flex-1">
                                        <div className="p-2 bg-green-500/20 rounded-lg text-green-400">
                                            <FileText className="h-6 w-6" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-white font-medium">
                                                {report.machine_model || 'Service Report'}
                                            </h4>
                                            <div className="flex items-center text-sm text-blue-200 mt-1 space-x-4">
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(report.generated_at).toLocaleString()}
                                                </span>
                                                {report.work_order && (
                                                    <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
                                                        WO: {report.work_order}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-400 mt-1 line-clamp-1">
                                                {report.as_found}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                            report.incident_status === 'resolved'
                                                ? 'bg-green-500/20 text-green-400'
                                                : report.incident_status === 'open'
                                                ? 'bg-blue-500/20 text-blue-400'
                                                : 'bg-gray-500/20 text-gray-400'
                                        }`}>
                                            {report.incident_status || 'unknown'}
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
