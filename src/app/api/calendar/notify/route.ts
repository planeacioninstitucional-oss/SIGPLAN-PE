import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

        // Create Internal Notifications
        const supabase = await createClient();
        const notifications = assignees.map(userId => ({
            user_id: userId,
            titulo: 'Nuevo Evento en Calendario',
            mensaje: 'Se te ha asignado un nuevo evento o tarea en el Calendario Institucional.',
            tipo: 'calendario',
            link: '/calendario',
            metadata: { event_id: eventId }
        }));

        const { error: notifError } = await supabase.from('notificaciones').insert(notifications);
        if (notifError) console.error('Error creating calendar notifications:', notifError);

        return NextResponse.json({ success: true, message: 'Notifications created and emails queued (mock)' });
    } catch (error) {
        console.error('Error in notify route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
