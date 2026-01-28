'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/app/components/ui/card';
import { CopyButton } from './CopyButton';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';

interface ServiceReport {
    id: string;
    work_order?: string;
    as_found: string;
    work_performed: string;
    as_left: string;
    generated_at: string;
}

interface ServiceReportCardProps {
    report: ServiceReport;
}

export function ServiceReportCard({ report }: ServiceReportCardProps) {
    const fullText = `Work Order: ${report.work_order || 'N/A'}\n\nAS FOUND:\n${report.as_found}\n\nWORK PERFORMED:\n${report.work_performed}\n\nAS LEFT:\n${report.as_left}`;

    return (
        <Card className="w-full shadow-lg border-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted/30">
                <div>
                    <CardTitle className="text-xl">Service Report</CardTitle>
                    <CardDescription>Generated on {new Date(report.generated_at).toLocaleString()}</CardDescription>
                </div>
                <Badge variant="outline" className="text-base px-3 py-1 bg-background">
                    {report.work_order || 'No WO'}
                </Badge>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">

                {/* As Found */}
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">As Found</h3>
                    <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                        {report.as_found}
                    </div>
                </div>

                {/* Work Performed */}
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">Work Performed</h3>
                    <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                        {report.work_performed}
                    </div>
                </div>

                {/* As Left */}
                <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase mb-2">As Left</h3>
                    <div className="p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap">
                        {report.as_left}
                    </div>
                </div>

                <Separator />

                <div className="flex justify-end pt-2">
                    <CopyButton text={fullText} label="Copy Full Report" className="w-full sm:w-auto" />
                </div>
            </CardContent>
        </Card>
    );
}
