'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/app/components/shared/Button'
import { FileText, ArrowLeft, Download, Loader2, Calendar, Wrench, CheckCircle } from 'lucide-react'

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

export default function ReportDetailPage() {
    const params = useParams()
    const router = useRouter()
    const reportId = params?.reportId as string

    const [report, setReport] = useState<Report | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadReport()
    }, [reportId])

    const loadReport = async () => {
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/auth/login')
                return
            }

            // Fetch report with incident details
            const { data, error: fetchError } = await supabase
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
                .eq('id', reportId)
                .eq('incidents.user_id', user.id)
                .single()

            if (fetchError || !data) {
                setError('Report not found or you do not have permission to view it.')
            } else {
                // Cast to any to work around TypeScript inference issues with Supabase joins
                const reportData = data as any
                setReport({
                    id: reportData.id,
                    incident_id: reportData.incident_id,
                    work_order: reportData.work_order,
                    as_found: reportData.as_found,
                    work_performed: reportData.work_performed,
                    as_left: reportData.as_left,
                    generated_at: reportData.generated_at,
                    machine_model: reportData.incidents?.machine_model,
                    incident_status: reportData.incidents?.status
                })
            }
        } catch (err) {
            console.error('Error loading report:', err)
            setError('An error occurred while loading the report.')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = () => {
        if (!report) return

        const reportText = `
SERVICE REPORT
============================================

Machine Model: ${report.machine_model || 'N/A'}
Work Order: ${report.work_order || 'N/A'}
Generated: ${new Date(report.generated_at).toLocaleString()}
Status: ${report.incident_status || 'N/A'}

AS FOUND
--------
${report.as_found}

WORK PERFORMED
--------------
${report.work_performed}

AS LEFT
-------
${report.as_left}

============================================
Report ID: ${report.id}
        `.trim()

        const blob = new Blob([reportText], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `report-${report.work_order || report.id}.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
    }

    if (loading) {
        return (
            <div className="min-h-screen gradient-blue-bg flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
                    <p className="text-blue-200">Loading report...</p>
                </div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="min-h-screen gradient-blue-bg flex items-center justify-center">
                <div className="glass-panel rounded-xl p-8 max-w-md text-center">
                    <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">Report Not Found</h2>
                    <p className="text-blue-200 mb-6">{error}</p>
                    <Button onClick={() => router.push('/dashboard/technician/reports')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Reports
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen gradient-blue-bg p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button
                        onClick={() => router.push('/dashboard/technician/reports')}
                        variant="ghost"
                        className="text-white"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Reports
                    </Button>
                    <Button onClick={handleDownload} className="bg-green-500 hover:bg-green-600">
                        <Download className="h-4 w-4 mr-2" />
                        Download Report
                    </Button>
                </div>

                {/* Report Header */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center space-x-4 mb-4">
                        <div className="p-3 bg-green-500/20 rounded-lg">
                            <FileText className="h-8 w-8 text-green-400" />
                        </div>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">
                                {report.machine_model || 'Service Report'}
                            </h1>
                            <div className="flex items-center space-x-4 text-sm text-blue-200 mt-1">
                                <span className="flex items-center">
                                    <Calendar className="h-4 w-4 mr-1" />
                                    {new Date(report.generated_at).toLocaleString()}
                                </span>
                                {report.work_order && (
                                    <span className="bg-white/10 px-2 py-1 rounded">
                                        WO: {report.work_order}
                                    </span>
                                )}
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    report.incident_status === 'resolved'
                                        ? 'bg-green-500/20 text-green-400'
                                        : 'bg-blue-500/20 text-blue-400'
                                }`}>
                                    {report.incident_status}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* As Found Section */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <Wrench className="h-5 w-5 text-red-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">As Found</h2>
                    </div>
                    <p className="text-blue-100 whitespace-pre-wrap">{report.as_found}</p>
                </div>

                {/* Work Performed Section */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Wrench className="h-5 w-5 text-blue-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Work Performed</h2>
                    </div>
                    <p className="text-blue-100 whitespace-pre-wrap">{report.work_performed}</p>
                </div>

                {/* As Left Section */}
                <div className="glass-panel rounded-xl p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">As Left</h2>
                    </div>
                    <p className="text-blue-100 whitespace-pre-wrap">{report.as_left}</p>
                </div>

                {/* Footer Info */}
                <div className="glass-panel rounded-xl p-4">
                    <p className="text-xs text-blue-300 text-center">
                        Report ID: {report.id} | Incident ID: {report.incident_id}
                    </p>
                </div>
            </div>
        </div>
    )
}
