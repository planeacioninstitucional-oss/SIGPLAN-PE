"use client";

import React, { useState, useEffect, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg } from '@fullcalendar/core';
import { Plus, X, Calendar as CalendarIcon, Clock, AlignLeft, User as UserIcon, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface Perfil {
    id: string;
    nombre_completo: string;
    email: string;
}

interface Event {
    id: string;
    title: string;
    start: Date | string;
    end?: Date | string;
    allDay?: boolean;
    extendedProps?: {
        db_id?: string;
        description?: string;
        funcionario_notes?: string;
        assignees?: Perfil[];
        type?: 'note' | 'task' | 'meeting';
    };
}

export default function Calendar() {
    const supabase = createClient();
    const [events, setEvents] = useState<Event[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [userRole, setUserRole] = useState<'contratista' | 'funcionario'>('funcionario'); 
    const [realUserRol, setRealUserRol] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [allUsers, setAllUsers] = useState<Perfil[]>([]);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [newNote, setNewNote] = useState('');
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]); // array of User IDs
    const [eventType, setEventType] = useState<'note' | 'task' | 'meeting'>('task');
    const [isSaving, setIsSaving] = useState(false);
    const [isUsersDropdownOpen, setIsUsersDropdownOpen] = useState(false); // For custom multi-select dropdown

    const fetchUsers = useCallback(async () => {
        try {
            const { data, error } = await supabase
                .from('perfiles')
                .select('id, nombre_completo, email')
                .eq('activo', true);

            if (error) throw error;
            setAllUsers(data || []);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar la lista de usuarios');
        }
    }, [supabase]);

    const initCurrentUser = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setCurrentUserId(user.id);
                const { data: perfil } = await supabase
                    .from('perfiles')
                    .select('rol')
                    .eq('id', user.id)
                    .single();
                
                if (perfil) {
                    setRealUserRol(perfil.rol);
                    if (['super_admin', 'equipo_planeacion'].includes(perfil.rol)) {
                        setUserRole('contratista');
                    } else {
                        setUserRole('funcionario');
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching current user:', error);
        }
    }, [supabase]);

    const fetchEvents = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from('calendar_events')
                .select(`
                    id,
                    title,
                    start_date,
                    end_date,
                    all_day,
                    event_type,
                    description,
                    funcionario_notes,
                    calendar_event_assignees (
                        perfil:perfiles (
                            id,
                            nombre_completo,
                            email
                        )
                    )
                `);

            if (error) throw error;

            if (data) {
                const formattedEvents: Event[] = data.map((event: any) => ({
                    id: event.id,
                    title: event.title,
                    start: event.start_date,
                    end: event.end_date,
                    allDay: event.all_day,
                    extendedProps: {
                        db_id: event.id,
                        description: event.description,
                        funcionario_notes: event.funcionario_notes,
                        type: event.event_type,
                        assignees: event.calendar_event_assignees.map((a: any) => a.perfil)
                    }
                }));
                setEvents(formattedEvents);
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Error al cargar el calendario');
        } finally {
            setIsLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        initCurrentUser();
        fetchUsers();
        fetchEvents();
    }, [initCurrentUser, fetchUsers, fetchEvents]);

    const handleDateClick = (arg: DateClickArg) => {
        if (userRole === 'funcionario') return; // Funcionario cannot add base events
        resetForm();
        setSelectedDate(arg.date);
        setIsModalOpen(true);
    };

    const handleEventClick = (arg: EventClickArg) => {
        const event = events.find(e => e.id === arg.event.id);
        if (event) {
            setSelectedEvent(event);
            setTitle(event.title);
            setDescription(event.extendedProps?.description || '');
            setNewNote('');

            const assigneeIds = event.extendedProps?.assignees?.map(a => a.id) || [];
            setSelectedAssignees(assigneeIds);

            setEventType(event.extendedProps?.type || 'task');
            setIsModalOpen(true);
        }
    };

    const toggleAssignee = (userId: string) => {
        setSelectedAssignees(prev =>
            prev.includes(userId)
                ? prev.filter(id => id !== userId)
                : [...prev, userId]
        );
    };

    const saveEvent = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title && userRole === 'contratista') return; // Funcionario only updates notes, title not required

        setIsSaving(true);
        try {
            // Construir el registro de comentarios
            let finalNotes = selectedEvent?.extendedProps?.funcionario_notes || '';
            if (newNote.trim() && userRole === 'funcionario') {
                const me = allUsers.find(u => u.id === currentUserId);
                const myName = me ? me.nombre_completo : 'Funcionario';
                const dateStr = new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
                const noteEntry = `👤 ${myName} (${dateStr}):\n"${newNote.trim()}"`;
                finalNotes = finalNotes ? `${finalNotes}\n\n${noteEntry}` : noteEntry;
            } else if (userRole === 'contratista') {
                finalNotes = selectedEvent?.extendedProps?.funcionario_notes || '';
            }

            // -- FUNCIONARIO FLOW: ONLY UPDATE NOTES --
            if (userRole === 'funcionario' && selectedEvent) {
                const { error } = await supabase
                    .from('calendar_events')
                    .update({ funcionario_notes: finalNotes })
                    .eq('id', selectedEvent.id);

                if (error) throw error;
                toast.success('Comentario registrado correctamente');
                await fetchEvents();
                closeModal();
                return;
            }

            // -- CONTRATISTA FLOW: CREATE/UPDATE EVENT --
            let eventId = selectedEvent?.extendedProps?.db_id;

            const eventData = {
                title,
                start_date: selectedDate || selectedEvent?.start || new Date(),
                all_day: true, // simplified
                event_type: eventType,
                description,
                funcionario_notes: finalNotes, // preserve existing or empty
            };

            if (selectedEvent) {
                // Update Event
                const { error: updateError } = await supabase
                    .from('calendar_events')
                    .update(eventData)
                    .eq('id', eventId);

                if (updateError) throw updateError;

                // Update Assignees by wiping and re-inserting
                await supabase.from('calendar_event_assignees').delete().eq('event_id', eventId);

            } else {
                // Create New Event
                const { data: newEvent, error: insertError } = await supabase
                    .from('calendar_events')
                    .insert([eventData])
                    .select()
                    .single();

                if (insertError) throw insertError;
                eventId = newEvent.id;
            }

            // Insert new assignees
            if (eventId && selectedAssignees.length > 0) {
                const assigneeData = selectedAssignees.map(userId => ({
                    event_id: eventId,
                    perfil_id: userId
                }));
                const { error: asgnError } = await supabase.from('calendar_event_assignees').insert(assigneeData);
                if (asgnError) throw asgnError;

                // Trigger notification placeholder
                console.log(`Sending email notifications to ${selectedAssignees.length} assignees for event ${eventId}`);
                fetch('/api/calendar/notify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ eventId, assignees: selectedAssignees })
                }).catch(e => console.error("Notification trigger fail:", e));
            }

            toast.success(selectedEvent ? 'Evento actualizado' : 'Evento creado');
            await fetchEvents();
            closeModal();
        } catch (error: any) {
            console.error('Error saving event:', error);
            toast.error('Error al guardar: ' + error.message);
        } finally {
            setIsSaving(false);
        }
    };

    const deleteEvent = async () => {
        if (!selectedEvent?.extendedProps?.db_id) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('calendar_events')
                .delete()
                .eq('id', selectedEvent.extendedProps.db_id);

            if (error) throw error;

            toast.success('Evento eliminado');
            await fetchEvents();
            closeModal();
        } catch (error: any) {
            console.error('Error deleting event:', error);
            toast.error('Error al eliminar');
        } finally {
            setIsSaving(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedDate(null);
        setSelectedEvent(null);
        setIsUsersDropdownOpen(false);
        resetForm();
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setNewNote('');
        setSelectedAssignees([]);
        setEventType('task');
    };

    const renderEventContent = (eventInfo: any) => {
        const type = eventInfo.event.extendedProps.type;
        const rawAssignees = eventInfo.event.extendedProps.assignees || [];
        
        // Filter out nulls and users without names to avoid crashes
        const assignees = rawAssignees.filter((a: any) => a && a.nombre_completo);

        let bgColor = 'bg-blue-500';
        if (type === 'note') bgColor = 'bg-amber-500';
        if (type === 'meeting') bgColor = 'bg-purple-500';

        return (
            <div className={`flex flex-col p-1.5 rounded w-full text-xs font-medium text-white ${bgColor} overflow-hidden font-sans border-none transition hover:opacity-90`}>
                <span className="truncate block font-bold" title={eventInfo.event.title}>
                    {eventInfo.event.title}
                </span>
                {assignees.length > 0 && (
                    <div className="flex -space-x-1.5 mt-1 overflow-hidden" title={assignees.map((a: any) => a.nombre_completo).join(', ')}>
                        {assignees.slice(0, 3).map((assignee: Perfil) => (
                            <div key={assignee.id} className="w-4 h-4 rounded-full bg-black/20 flex items-center justify-center text-[8px] uppercase border border-white/20">
                                {assignee.nombre_completo?.substring(0, 2) || 'U'}
                            </div>
                        ))}
                        {assignees.length > 3 && (
                            <div className="w-4 h-4 rounded-full bg-black/40 flex items-center justify-center text-[8px] border border-white/20">
                                +{assignees.length - 3}
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.16))] py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <div className="mb-6 flex justify-between items-center bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-4 rounded-xl shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        Calendario Institucional
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Gestiona eventos, seguimientos y notas importantes</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Simulator switch */}
                    {realUserRol === 'super_admin' && (
                        <div className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-slate-800/50 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-slate-700">
                            <span className="text-gray-500 dark:text-slate-400 font-medium transition-all">Modo Simulador:</span>
                            <select
                                value={userRole}
                                onChange={(e) => {
                                    setUserRole(e.target.value as any);
                                    toast.success(`Modo cambiado a: ${e.target.value}`);
                                }}
                                className="bg-transparent font-semibold focus:outline-none w-min border-none text-primary cursor-pointer text-sm"
                            >
                                <option value="contratista" className="bg-white dark:bg-slate-900">Editor (Admin, Planeación)</option>
                                <option value="funcionario" className="bg-white dark:bg-slate-900">Funcionario (Sólo notas)</option>
                            </select>
                        </div>
                    )}

                    {userRole === 'contratista' && (
                        <button
                            onClick={() => {
                                resetForm();
                                setSelectedDate(new Date());
                                setIsModalOpen(true);
                            }}
                            className="inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Nuevo Evento
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900/50 p-2 sm:p-6 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 overflow-hidden main-calendar-wrapper relative z-0">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    /* ===== LIGHT MODE calendar styles ===== */
                    .fc { --fc-button-bg-color: #3b82f6; --fc-button-border-color: #3b82f6; --fc-button-hover-bg-color: #2563eb; --fc-button-hover-border-color: #2563eb; --fc-button-active-bg-color: #1d4ed8; --fc-event-border-color: transparent; --fc-event-bg-color: transparent; --fc-button-text-color: #fff; }
                    .fc-theme-standard td, .fc-theme-standard th { border-color: #e2e8f0; }
                    .fc-col-header-cell { padding: 12px 0 !important; background-color: #f8fafc; font-weight: 600; text-transform: capitalize; color: #475569; }
                    .fc-daygrid-day-number { font-weight: 500; padding: 8px !important; color: #334155; transition: all 0.2s; }
                    .fc-daygrid-day:hover { background-color: #f8fafc; cursor: pointer; }
                    .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 700 !important; color: #0f172a; text-transform: capitalize; }
                    .fc-day-today { background-color: #eff6ff !important; }
                    .fc-day-today .fc-daygrid-day-number { background-color: #3b82f6; color: white !important; border-radius: 999px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; margin: 4px; padding: 0 !important; }
                    .fc-event { margin: 2px 4px !important; }
                    .fc-daygrid-event-harness { margin-top: 2px; }
                    .fc-daygrid-day-top { color: #334155; }
                    .fc-timegrid-slot-label-cushion { color: #64748b; }
                    .fc-timegrid-axis-cushion { color: #64748b; }
                    .fc .fc-button { border-radius: 8px !important; font-weight: 600 !important; }

                    /* ===== DARK MODE calendar styles ===== */
                    .dark .fc { --fc-button-bg-color: #0f172a; --fc-button-border-color: #1e293b; --fc-button-hover-bg-color: #1e293b; --fc-button-hover-border-color: #334155; --fc-button-active-bg-color: #3b82f6; --fc-event-border-color: transparent; --fc-event-bg-color: transparent; --fc-button-text-color: #cbd5e1; }
                    .dark .fc-theme-standard td, .dark .fc-theme-standard th { border-color: #1e293b; }
                    .dark .fc-col-header-cell { background-color: #0f172a; color: #94a3b8; }
                    .dark .fc-daygrid-day-number { color: #cbd5e1; }
                    .dark .fc-daygrid-day:hover { background-color: #1e293b; }
                    .dark .fc .fc-toolbar-title { color: #f8fafc !important; }
                    .dark .fc-day-today { background-color: #1e293b !important; }
                    .dark .fc-day-today .fc-daygrid-day-number { background-color: #3b82f6; }
                    .dark .fc-daygrid-day-top { color: #cbd5e1; }
                    .dark .fc-timegrid-slot-label-cushion { color: #94a3b8; }
                    .dark .fc-timegrid-axis-cushion { color: #94a3b8; }
                `}} />
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    locale="es"
                    events={events}
                    dateClick={handleDateClick}
                    eventClick={handleEventClick}
                    eventContent={renderEventContent}
                    editable={userRole === 'contratista'}
                    droppable={userRole === 'contratista'}
                    height="100%"
                    buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' }}
                />
            </div>

            {/* Modal for Event Details/Creation */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-transparent shrink-0">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    {selectedEvent ? (userRole === 'contratista' ? 'Editar Evento' : (userRole === 'funcionario' ? 'Detalles y Notas' : 'Detalles de Evento')) : 'Nuevo Evento'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={saveEvent} className="p-5 space-y-5 overflow-y-auto overflow-x-hidden">
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Título</label>
                                        <input
                                            type="text"
                                            required={userRole === 'contratista'}
                                            disabled={userRole === 'funcionario'}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-50 dark:disabled:bg-slate-800/50 disabled:text-gray-500 dark:disabled:text-slate-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            placeholder="Ej. Revisión de metas PDD..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    {/* Event Type */}
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${eventType === 'task' ? 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-blue-400' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'} ${userRole === 'funcionario' && 'opacity-70 pointer-events-none'}`}>
                                            <input type="radio" className="sr-only" checked={eventType === 'task'} onChange={() => setEventType('task')} />
                                            <Clock className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-semibold">Tarea</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${eventType === 'meeting' ? 'bg-purple-50 dark:bg-purple-900/40 border-purple-200 dark:border-purple-500/50 text-purple-700 dark:text-purple-400' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'} ${userRole === 'funcionario' && 'opacity-70 pointer-events-none'}`}>
                                            <input type="radio" className="sr-only" checked={eventType === 'meeting'} onChange={() => setEventType('meeting')} />
                                            <UserIcon className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-semibold">Reunión</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${eventType === 'note' ? 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-500/50 text-amber-700 dark:text-amber-400' : 'bg-gray-50 dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'} ${userRole === 'funcionario' && 'opacity-70 pointer-events-none'}`}>
                                            <input type="radio" className="sr-only" checked={eventType === 'note'} onChange={() => setEventType('note')} />
                                            <AlignLeft className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-semibold">Nota</span>
                                        </label>
                                    </div>

                                    <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-slate-200 bg-gray-50 dark:bg-slate-800/40 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary">
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-medium text-gray-400 dark:text-slate-400">Fecha seleccionada</span>
                                            <span className="font-semibold text-gray-700 dark:text-white capitalize">
                                                {selectedDate
                                                    ? selectedDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                    : selectedEvent?.start
                                                        ? new Date(selectedEvent.start).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                        : ''}
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                            Asignado a {selectedAssignees.length > 0 && <span className="text-xs bg-primary/10 dark:bg-primary/20 text-primary dark:text-blue-400 px-2 py-0.5 rounded-full ml-1">{selectedAssignees.length}</span>}
                                        </label>
                                        <div className="relative">
                                            <div
                                                className={`w-full px-4 py-2 border border-gray-300 dark:border-slate-700 rounded-lg min-h-[42px] flex flex-wrap gap-1 items-center bg-white dark:bg-slate-800 ${userRole === 'funcionario' ? 'bg-gray-50 dark:bg-slate-800 opacity-80' : 'cursor-pointer hover:border-primary/50'}`}
                                                onClick={() => userRole === 'contratista' && setIsUsersDropdownOpen(!isUsersDropdownOpen)}
                                            >
                                                {selectedAssignees.length === 0 && (
                                                    <span className="text-gray-400 dark:text-slate-500">Seleccionar usuarios...</span>
                                                )}
                                                {selectedAssignees.map(id => {
                                                    const user = allUsers.find(u => u.id === id);
                                                    return user ? (
                                                        <span key={id} className="bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                            {user.nombre_completo.split(' ')[0]}
                                                            {userRole === 'contratista' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); toggleAssignee(id); }}
                                                                    className="text-gray-400 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>

                                            {isUsersDropdownOpen && userRole === 'contratista' && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsUsersDropdownOpen(false)}></div>
                                                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2">
                                                        {allUsers.length === 0 ? (
                                                            <div className="p-3 text-sm text-center text-gray-500 dark:text-slate-400">No hay usuarios disponibles</div>
                                                        ) : (
                                                            allUsers.map((user) => {
                                                                const isSelected = selectedAssignees.includes(user.id);
                                                                return (
                                                                    <button
                                                                        key={user.id}
                                                                        type="button"
                                                                        onClick={() => toggleAssignee(user.id)}
                                                                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50 dark:bg-slate-700/50' : ''}`}
                                                                    >
                                                                        <div>
                                                                            <div className={`text-sm ${isSelected ? 'font-medium text-primary dark:text-blue-400' : 'text-gray-700 dark:text-slate-200'}`}>{user.nombre_completo}</div>
                                                                            <div className="text-xs text-gray-400 dark:text-slate-400">{user.email}</div>
                                                                        </div>
                                                                        {isSelected && <Check className="w-4 h-4 text-primary" />}
                                                                    </button>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Detalles General (Contratista)</label>
                                        <textarea
                                            rows={2}
                                            disabled={userRole === 'funcionario'}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none disabled:bg-gray-50 dark:disabled:bg-slate-800/50 disabled:text-gray-500 dark:disabled:text-slate-500 placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                            placeholder="Agrega información adicional aquí..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    {((selectedEvent?.extendedProps?.funcionario_notes) || userRole === 'funcionario') && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20">
                                            <label className="block text-sm font-semibold text-blue-900 dark:text-blue-400 mb-2 flex items-center gap-1">
                                                <AlignLeft className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Historial de Asistencias y Notas
                                            </label>
                                            
                                            {selectedEvent?.extendedProps?.funcionario_notes && (
                                                <div className="mb-3 p-3 bg-white dark:bg-slate-900 rounded-lg border border-blue-100 dark:border-slate-700/50 text-sm whitespace-pre-wrap max-h-40 overflow-y-auto font-medium text-gray-700 dark:text-slate-300 shadow-inner">
                                                    {selectedEvent.extendedProps.funcionario_notes}
                                                </div>
                                            )}

                                            {userRole === 'funcionario' && (
                                                <textarea
                                                    rows={2}
                                                    className="w-full px-4 py-2 border border-blue-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-primary transition-colors resize-none text-gray-900 dark:text-white font-medium placeholder:text-gray-400 dark:placeholder:text-slate-500"
                                                    placeholder="Escribe confirmación de asistencia o comentario. Se guardará con tu nombre..."
                                                    value={newNote}
                                                    onChange={(e) => setNewNote(e.target.value)}
                                                />
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 dark:border-slate-800 shrink-0">
                                    {selectedEvent && userRole === 'contratista' && (
                                        <button
                                            type="button"
                                            onClick={deleteEvent}
                                            disabled={isSaving}
                                            className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors mr-auto disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors border border-gray-200 dark:border-slate-700 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>

                                    {/* Both roles can save now (Contratista saves all, Funcionario saves notes) */}
                                    <button
                                        type="submit"
                                        disabled={isSaving || (userRole === 'funcionario' && !selectedEvent)} // Funcionario can't create
                                        className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2 min-w-[100px] justify-center"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
