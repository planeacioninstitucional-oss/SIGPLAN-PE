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
    const [userRole, setUserRole] = useState<'contratista' | 'funcionario'>('contratista'); // Mock role for now
    const [isLoading, setIsLoading] = useState(true);

    const [allUsers, setAllUsers] = useState<Perfil[]>([]);

    // Form states
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [funcionarioNotes, setFuncionarioNotes] = useState('');
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
        fetchUsers();
        fetchEvents();
    }, [fetchUsers, fetchEvents]);

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
            setFuncionarioNotes(event.extendedProps?.funcionario_notes || '');

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
            // -- FUNCIONARIO FLOW: ONLY UPDATE NOTES --
            if (userRole === 'funcionario' && selectedEvent) {
                const { error } = await supabase
                    .from('calendar_events')
                    .update({ funcionario_notes: funcionarioNotes })
                    .eq('id', selectedEvent.id);

                if (error) throw error;
                toast.success('Notas actualizadas correctamente');
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
                funcionario_notes: funcionarioNotes, // preserve existing or empty
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
        setFuncionarioNotes('');
        setSelectedAssignees([]);
        setEventType('task');
    };

    const renderEventContent = (eventInfo: any) => {
        const type = eventInfo.event.extendedProps.type;
        const assignees = eventInfo.event.extendedProps.assignees || [];

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
                                {assignee.nombre_completo.substring(0, 2)}
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
            <div className="mb-6 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                        <CalendarIcon className="w-6 h-6 text-primary" />
                        Calendario Institucional
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Gestiona eventos, seguimientos y notas importantes</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Simulator switch */}
                    <div className="flex items-center gap-2 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                        <span className="text-gray-500 font-medium transition-all">Modo Simulador:</span>
                        <select
                            value={userRole}
                            onChange={(e) => {
                                setUserRole(e.target.value as any);
                                toast.success(`Modo cambiado a: ${e.target.value}`);
                            }}
                            className="bg-transparent font-semibold focus:outline-none w-min border-none text-primary cursor-pointer text-sm"
                        >
                            <option value="contratista">Contratista</option>
                            <option value="funcionario">Funcionario</option>
                        </select>
                    </div>

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

            <div className="flex-1 bg-white p-2 sm:p-6 rounded-xl shadow-sm border border-gray-200 overflow-hidden main-calendar-wrapper relative z-0">
                {isLoading && (
                    <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    </div>
                )}
                <style dangerouslySetInnerHTML={{
                    __html: `
                    .fc { --fc-button-bg-color: #0f172a; --fc-button-border-color: #0f172a; --fc-button-hover-bg-color: #1e293b; --fc-button-hover-border-color: #1e293b; --fc-button-active-bg-color: #334155; --fc-event-border-color: transparent; --fc-event-bg-color: transparent; }
                    .fc-theme-standard td, .fc-theme-standard th { border-color: #f1f5f9; }
                    .fc-col-header-cell { padding: 12px 0 !important; background-color: #f8fafc; font-weight: 600; text-transform: capitalize; color: #475569; }
                    .fc-daygrid-day-number { font-weight: 500; padding: 8px !important; color: #334155; transition: all 0.2s; }
                    .fc-daygrid-day:hover { background-color: #f8fafc; cursor: pointer; }
                    .fc .fc-toolbar-title { font-size: 1.25rem !important; font-weight: 700 !important; color: #0f172a; text-transform: capitalize; }
                    .fc-day-today { background-color: #f0fdf4 !important; }
                    .fc-day-today .fc-daygrid-day-number { background-color: #22c55e; color: white !important; border-radius: 999px; width: 28px; height: 28px; display: inline-flex; align-items: center; justify-content: center; margin: 4px; padding: 0 !important; }
                    .fc-event { margin: 2px 4px !important; }
                    .fc-daygrid-event-harness { margin-top: 2px; }
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
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {selectedEvent ? (userRole === 'contratista' ? 'Editar Evento' : (userRole === 'funcionario' ? 'Detalles y Notas' : 'Detalles de Evento')) : 'Nuevo Evento'}
                                </h2>
                                <button
                                    onClick={closeModal}
                                    className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={saveEvent} className="p-5 space-y-5 overflow-y-auto overflow-x-hidden">
                                <div className="space-y-4">
                                    {/* Title */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                        <input
                                            type="text"
                                            required={userRole === 'contratista'}
                                            disabled={userRole === 'funcionario'}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-gray-500"
                                            placeholder="Ej. Revisión de metas PDD..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                        />
                                    </div>

                                    {/* Event Type */}
                                    <div className="flex gap-4">
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${eventType === 'task' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'hover:bg-gray-50 border-gray-200 text-gray-500'} ${userRole === 'funcionario' && 'opacity-70 pointer-events-none'}`}>
                                            <input type="radio" className="sr-only" checked={eventType === 'task'} onChange={() => setEventType('task')} />
                                            <Clock className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-semibold">Tarea</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${eventType === 'meeting' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'hover:bg-gray-50 border-gray-200 text-gray-500'} ${userRole === 'funcionario' && 'opacity-70 pointer-events-none'}`}>
                                            <input type="radio" className="sr-only" checked={eventType === 'meeting'} onChange={() => setEventType('meeting')} />
                                            <UserIcon className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-semibold">Reunión</span>
                                        </label>
                                        <label className={`flex-1 flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${eventType === 'note' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'hover:bg-gray-50 border-gray-200 text-gray-500'} ${userRole === 'funcionario' && 'opacity-70 pointer-events-none'}`}>
                                            <input type="radio" className="sr-only" checked={eventType === 'note'} onChange={() => setEventType('note')} />
                                            <AlignLeft className="w-5 h-5 mb-1" />
                                            <span className="text-xs font-semibold">Nota</span>
                                        </label>
                                    </div>

                                    {/* Date display */}
                                    <div className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <CalendarIcon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <span className="block text-xs font-medium text-gray-400">Fecha seleccionada</span>
                                            <span className="font-semibold text-gray-700">
                                                {selectedDate
                                                    ? selectedDate.toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                    : selectedEvent?.start
                                                        ? new Date(selectedEvent.start).toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                                                        : ''}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Assignees Multi-select Dropdown */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Asignado a {selectedAssignees.length > 0 && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">{selectedAssignees.length}</span>}
                                        </label>
                                        <div className="relative">
                                            <div
                                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg min-h-[42px] flex flex-wrap gap-1 items-center bg-white ${userRole === 'funcionario' ? 'bg-gray-50 opacity-90' : 'cursor-pointer hover:border-primary/50'}`}
                                                onClick={() => userRole === 'contratista' && setIsUsersDropdownOpen(!isUsersDropdownOpen)}
                                            >
                                                {selectedAssignees.length === 0 && (
                                                    <span className="text-gray-400">Seleccionar usuarios...</span>
                                                )}
                                                {selectedAssignees.map(id => {
                                                    const user = allUsers.find(u => u.id === id);
                                                    return user ? (
                                                        <span key={id} className="bg-slate-100 text-slate-700 text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                                            {user.nombre_completo.split(' ')[0]}
                                                            {userRole === 'contratista' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => { e.stopPropagation(); toggleAssignee(id); }}
                                                                    className="hover:text-red-500"
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            )}
                                                        </span>
                                                    ) : null;
                                                })}
                                            </div>

                                            {/* Dropdown UI */}
                                            {isUsersDropdownOpen && userRole === 'contratista' && (
                                                <>
                                                    <div className="fixed inset-0 z-40" onClick={() => setIsUsersDropdownOpen(false)}></div>
                                                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1 animate-in fade-in slide-in-from-top-2">
                                                        {allUsers.length === 0 ? (
                                                            <div className="p-3 text-sm text-center text-gray-500">No hay usuarios disponibles</div>
                                                        ) : (
                                                            allUsers.map((user) => {
                                                                const isSelected = selectedAssignees.includes(user.id);
                                                                return (
                                                                    <button
                                                                        key={user.id}
                                                                        type="button"
                                                                        onClick={() => toggleAssignee(user.id)}
                                                                        className={`w-full text-left px-4 py-2 hover:bg-slate-50 flex items-center justify-between transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
                                                                    >
                                                                        <div>
                                                                            <div className={`text-sm ${isSelected ? 'font-medium text-primary' : 'text-gray-700'}`}>{user.nombre_completo}</div>
                                                                            <div className="text-xs text-gray-400">{user.email}</div>
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Detalles General (Contratista)</label>
                                        <textarea
                                            rows={2}
                                            disabled={userRole === 'funcionario'}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors resize-none disabled:bg-gray-50 disabled:text-gray-500"
                                            placeholder="Agrega información adicional aquí..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        />
                                    </div>

                                    {/* Funcionario Notes */}
                                    {(userRole === 'funcionario' || funcionarioNotes) && (
                                        <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                                            <label className="block text-sm font-semibold text-blue-900 mb-1 flex items-center gap-1">
                                                <AlignLeft className="w-4 h-4 text-blue-600" /> Notas del Funcionario
                                            </label>
                                            <textarea
                                                rows={2}
                                                disabled={userRole !== 'funcionario'}
                                                className="w-full px-4 py-2 border border-blue-200 bg-white rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none disabled:opacity-80"
                                                placeholder={userRole === 'funcionario' ? "Escribe tus observaciones del seguimiento aquí..." : "Sin observaciones"}
                                                value={funcionarioNotes}
                                                onChange={(e) => setFuncionarioNotes(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100 shrink-0">
                                    {selectedEvent && userRole === 'contratista' && (
                                        <button
                                            type="button"
                                            onClick={deleteEvent}
                                            disabled={isSaving}
                                            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors mr-auto disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={isSaving}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200 disabled:opacity-50"
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
