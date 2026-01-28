import { createClient } from '@/lib/supabase/server';
import { curatorAgent } from '@/lib/agents/curator';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { CoreMessage } from 'ai';

const generateSchema = z.object({
    incidentId: z.string().uuid()
});

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const json = await req.json();
        const { incidentId } = generateSchema.parse(json);

        // 1. Fetch Incident and Messages
        const { data: incident, error: incidentError } = await supabase
            .from('incidents')
            .select('*')
            .eq('id', incidentId)
            .single();

        if (incidentError || !incident) {
            return NextResponse.json({ error: 'Incident not found' }, { status: 404 });
        }

        // Verify Access (RLS handles it, but explicit check good)
        if (incident.user_id !== user.id) {
            // Optionally allow Org Admins to generate reports for their techs
            // TBD: Check org_id
        }

        const { data: messages, error: msgError } = await supabase
            .from('conversation_messages')
            .select('*')
            .eq('incident_id', incidentId)
            .order('created_at', { ascending: true });

        if (msgError) {
            return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
        }

        // Convert messages to CoreMessage format
        const history: CoreMessage[] = messages.map(m => ({
            role: m.role as 'user' | 'assistant' | 'system',
            content: m.content
        }));

        // 2. Run Curator Agent
        const reportData = await curatorAgent({
            conversationHistory: history,
            machineModel: incident.machine_model,
            incidentId: incident.id,
            externalTicketId: incident.external_ticket_id
        });

        // 3. Save to service_reports table
        // Convert reportData to needed columns. 
        // Schema: as_found, work_performed, as_left, generated_at
        // We only have those columns in typical CMMS. 
        // We can store the full JSON in metadata if we add a column, or just fits the text fields.
        // Spec says: "Reports follow the 'As Found / Work Performed / As Left' format"
        // The table `service_reports` has columns: as_found, work_performed, as_left

        const { data: report, error: saveError } = await supabase
            .from('service_reports')
            .upsert({
                incident_id: incidentId,
                work_order: incident.external_ticket_id,
                as_found: reportData.asFound,
                work_performed: `${reportData.workPerformed}\n\nParts Used: ${reportData.partsUsed.join(', ')}\nRecommendations: ${reportData.recommendations.join(', ')}`,
                as_left: reportData.asLeft
            }, { onConflict: 'incident_id' })
            .select()
            .single();

        if (saveError) {
            console.error('Failed to save report', saveError);
            return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
        }

        return NextResponse.json(report);

    } catch (error) {
        console.error('Error generating report:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
