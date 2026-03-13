'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Notificacion } from '@/types/database'
import { useAuthStore } from '@/stores/authStore'

export function useNotifications() {
    const [notifications, setNotifications] = useState<Notificacion[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(true)
    const { userProfile } = useAuthStore()
    const supabase = createClient()

    const fetchNotifications = async () => {
        if (!userProfile?.id) return

        setLoading(true)
        const { data, error } = await supabase
            .from('notificaciones')
            .select('*')
            .eq('user_id', userProfile.id)
            .order('created_at', { ascending: false })
            .limit(20)

        if (error) {
            console.error('Error fetching notifications:', error)
        } else {
            setNotifications(data || [])
            setUnreadCount(data?.filter(n => !n.leida).length || 0)
        }
        setLoading(false)
    }

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('id', id)

        if (error) {
            console.error('Error marking as read:', error)
        } else {
            setNotifications(prev => 
                prev.map(n => n.id === id ? { ...n, leida: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        }
    }

    const markAllAsRead = async () => {
        if (!userProfile?.id) return

        const { error } = await supabase
            .from('notificaciones')
            .update({ leida: true })
            .eq('user_id', userProfile.id)
            .eq('leida', false)

        if (error) {
            console.error('Error marking all as read:', error)
        } else {
            setNotifications(prev => prev.map(n => ({ ...n, leida: true })))
            setUnreadCount(0)
        }
    }

    useEffect(() => {
        if (!userProfile?.id) return

        fetchNotifications()

        const channel = supabase
            .channel(`notificaciones:${userProfile.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones',
                    filter: `user_id=eq.${userProfile.id}`
                },
                (payload) => {
                    const newNotif = payload.new as Notificacion
                    setNotifications(prev => [newNotif, ...prev])
                    setUnreadCount(prev => prev + 1)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [userProfile?.id])

    return {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        refresh: fetchNotifications
    }
}
