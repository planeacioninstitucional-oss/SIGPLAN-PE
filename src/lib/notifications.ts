import { createClient } from '@/lib/supabase/client'
import { Notificacion } from '@/types/database'

export async function createNotification(notification: Omit<Notificacion, 'id' | 'leida' | 'created_at'>) {
    const supabase = createClient()
    const { data, error } = await supabase
        .from('notificaciones')
        .insert({
            ...notification,
            leida: false
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating notification:', error)
        return null
    }

    return data
}

export async function notifyUsersByRole(roles: string[], notification: Omit<Notificacion, 'id' | 'leida' | 'created_at' | 'user_id'>) {
    const supabase = createClient()
    const { data: users } = await supabase
        .from('perfiles')
        .select('id')
        .in('rol', roles)
        .eq('activa', true) // Not sure if 'activa' or 'activo', perfiles migration used 'activo' but some tables use 'activa'. Perfiles used 'activo' in migration.

    if (!users) return

    const notifications = users.map((u: any) => ({
        ...notification,
        user_id: u.id,
        leida: false
    }))

    const { error } = await supabase.from('notificaciones').insert(notifications)
    if (error) console.error('Error batch creating notifications:', error)
}
