import { createClient } from '@/lib/supabase/server';
import { Card, CardHeader, CardTitle, CardContent } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import Link from 'next/link';

export default async function HistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return <div>Unauthorized</div>;

    const { data: incidents, error } = await supabase
        .from('incidents')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        return <div className="p-8 text-destructive">Error loading history.</div>;
    }

    return (
        <div className="container mx-auto py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Troubleshooting History</h1>
                <Link href="/troubleshoot/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm">
                    New Session
                </Link>
            </div>

            <div className="grid gap-4">
                {incidents.length === 0 && (
                    <div className="text-muted-foreground text-center py-12 bg-muted/50 rounded-lg">
                        No history found. Start a new session.
                    </div>
                )}
                {incidents.map((incident) => (
                    <Link key={incident.id} href={`/troubleshoot/${incident.id}`}>
                        <Card className="hover:bg-accent transition-colors">
                            <CardContent className="p-4 flex justify-between items-center">
                                <div>
                                    <h3 className="font-semibold">{incident.machine_model || 'Unknown Machine'}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        {incident.external_ticket_id ? `Ticket: ${incident.external_ticket_id}` : 'No Ticket ID'}
                                        {' • '}
                                        {new Date(incident.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <Badge variant={incident.status === 'open' ? 'default' : 'secondary'}>
                                    {incident.status}
                                </Badge>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
