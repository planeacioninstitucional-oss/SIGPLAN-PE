import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { eventId, assignees } = body;

        if (!eventId || !assignees || !Array.isArray(assignees)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Mock Email Logic
        console.log('--- EMAIL NOTIFICATION TRIGGERED ---');
        console.log(`Event ID: ${eventId}`);
        console.log(`Sending to User IDs: ${assignees.join(', ')}`);
        console.log('Subject: Se te ha asignado un nuevo evento en el Calendario Institucional');
        console.log('Body: Tienes un nuevo seguimiento o tarea asginada. Por favor revisa la plataforma.');
        console.log('------------------------------------');

        // In the future:
        // 1. Fetch user emails from supabase using the assignee IDs
        // 2. Fetch event details using eventId
        // 3. await resend.emails.send({ ... })

        return NextResponse.json({ success: true, message: 'Emails queued (mock)' });
    } catch (error) {
        console.error('Error in notify route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
