'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/database'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { JefeDashboard } from '@/components/dashboard/JefeDashboard'
import { Loader2 } from 'lucide-react'

export default function DashboardPage() {
    const [profile, setProfile] = useState<Perfil | null>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase
                    .from('perfiles')
                    .select('*, oficinas(nombre, abreviatura)')
                    .eq('id', user.id)
                    .single()
                setProfile(data)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [])

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!profile) return null

    // Role based rendering
    if (['super_admin', 'equipo_planeacion', 'gerente', 'auditor'].includes(profile.rol)) {
        return (
            <div className="animate-in fade-in duration-500">
                <h1 className="text-3xl font-bold text-white mb-6">Centro de Comando</h1>
                <AdminDashboard />
            </div>
        )
    }

    return (
        <div className="animate-in fade-in duration-500">
            <JefeDashboard profile={profile} />
        </div>
    )
}
