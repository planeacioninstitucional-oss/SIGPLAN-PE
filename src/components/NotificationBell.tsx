'use client'

import { useState } from 'react'
import { Bell, Check, Clock, AlertCircle, Calendar, MessageSquare, ExternalLink } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

export function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    const router = useRouter()

    const getIcon = (tipo: string) => {
        switch (tipo) {
            case 'success': return <Check className="w-4 h-4 text-green-500" />
            case 'warning': return <AlertCircle className="w-4 h-4 text-amber-500" />
            case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />
            case 'meta_update': return <Clock className="w-4 h-4 text-blue-500" />
            case 'observacion': return <MessageSquare className="w-4 h-4 text-purple-500" />
            case 'calendario': return <Calendar className="w-4 h-4 text-indigo-500" />
            default: return <Bell className="w-4 h-4 text-slate-500" />
        }
    }

    const handleNotificationClick = (notif: any) => {
        if (!notif.leida) markAsRead(notif.id)
        if (notif.link) {
            router.push(notif.link)
            setIsOpen(false)
        }
    }

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-white/5"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-in zoom-in">
                        {unreadCount > 9 ? '+9' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/5">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                Notificaciones
                                {unreadCount > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-blue-500 text-[10px] text-white">
                                        {unreadCount} nuevas
                                    </span>
                                )}
                            </h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    Marcar todas como leídas
                                </button>
                            )}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto">
                            {notifications.length > 0 ? (
                                <div className="divide-y divide-gray-100 dark:divide-white/5">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            onClick={() => handleNotificationClick(notif)}
                                            className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer relative ${!notif.leida ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                                        >
                                            {!notif.leida && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                                            )}
                                            <div className="flex gap-3">
                                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-white/10`}>
                                                    {getIcon(notif.tipo)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <p className={`text-sm font-semibold truncate ${!notif.leida ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-slate-400'}`}>
                                                            {notif.titulo}
                                                        </p>
                                                        <span className="text-[10px] text-gray-400 dark:text-slate-500 whitespace-nowrap">
                                                            {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: es })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-500 dark:text-slate-500 mt-1 line-clamp-2">
                                                        {notif.mensaje}
                                                    </p>
                                                    {notif.link && (
                                                        <div className="mt-2 flex items-center gap-1 text-[10px] text-blue-500 font-medium">
                                                            Ver detalles <ExternalLink className="w-2.5 h-2.5" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-8 text-center">
                                    <div className="w-12 h-12 rounded-full border-4 border-dashed border-gray-200 dark:border-white/10 flex items-center justify-center mx-auto mb-3">
                                        <Bell className="w-6 h-6 text-gray-300 dark:text-slate-600" />
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-slate-500">No tienes notificaciones aún</p>
                                </div>
                            )}
                        </div>

                        {notifications.length > 0 && (
                            <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 text-center">
                                <p className="text-[10px] text-gray-400 dark:text-slate-500">Mostrando las últimas 20 notificaciones</p>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
