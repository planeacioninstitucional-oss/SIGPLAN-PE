import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import type { Perfil, Oficina, ProcesoInstitucional } from '@/types/database'

export interface PerfilCompleto {
    perfil: Perfil | null
    oficina: Oficina | null
    procesos: ProcesoInstitucional[]
    loading: boolean
    error: string | null
}

/**
 * Hook que retorna el perfil del usuario autenticado,
 * su oficina y los procesos institucionales asignados.
 */
export function usePerfilUsuario(): PerfilCompleto {
    const [perfil, setPerfil] = useState<Perfil | null>(null)
    const [oficina, setOficina] = useState<Oficina | null>(null)
    const [procesos, setProcesos] = useState<ProcesoInstitucional[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const supabase = createClient()
        let cancel = false

        async function load() {
            try {
                setLoading(true)
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) { setLoading(false); return }

                // 1. Perfil con oficina
                const { data: perfilData, error: perfilError } = await supabase
                    .from('perfiles')
                    .select('*, oficinas(*)')
                    .eq('id', user.id)
                    .single()

                if (perfilError) throw perfilError
                if (cancel) return

                setPerfil(perfilData as Perfil)
                const of = perfilData?.oficinas as Oficina | null
                setOficina(of ?? null)

                // 2. Procesos de la oficina del usuario
                if (perfilData?.oficina_id) {
                    const { data: procesosData, error: procesosError } = await supabase
                        .from('procesos_institucionales')
                        .select('*, grupos_proceso(*), oficinas(*)')
                        .eq('oficina_id', perfilData.oficina_id)
                        .eq('activo', true)
                        .order('orden')

                    if (procesosError) throw procesosError
                    if (!cancel) setProcesos(procesosData as ProcesoInstitucional[])
                }
            } catch (err: any) {
                if (!cancel) setError(err.message ?? 'Error cargando perfil')
            } finally {
                if (!cancel) setLoading(false)
            }
        }

        load()
        return () => { cancel = true }
    }, [])

    return { perfil, oficina, procesos, loading, error }
}
