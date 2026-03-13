'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState, useCallback } from 'react'

export type ModuloPermiso =
    | 'metas_pdd'
    | 'piip'
    | 'pam'
    | 'alistamiento'
    | 'mis_instrumentos'
    | 'seguimientos'
    | 'importar'

interface PermisoRecord {
    modulo: ModuloPermiso
    puede_ver: boolean
    puede_editar: boolean
}

interface UsePermisosResult {
    loading: boolean
    rol: string | null
    /** Puede ver el módulo dado */
    puedeVer: (modulo: ModuloPermiso) => boolean
    /** Puede editar dentro del módulo dado */
    puedeEditar: (modulo: ModuloPermiso) => boolean
    /** Es super_admin (acceso total a todo) */
    esAdmin: boolean
    /** Es miembro del equipo de planeación */
    esEquipoPlaneacion: boolean
}

/**
 * Hook centralizado de permisos.
 *
 * Lógica de resolución (en orden de prioridad):
 * 1. super_admin / equipo_planeacion → acceso total a todo
 * 2. Si existe un permiso en `permisos_usuario` para este usuario → se usa ese
 * 3. Si existe un permiso en `permisos_modulo_oficina` para su oficina → se usa ese
 * 4. Default: puede_ver=false, puede_editar=false
 *
 * EXCEPCIÓN: mis_instrumentos → jefe_oficina/gerente siempre pueden VER pero NUNCA EDITAR
 *            Solo super_admin y equipo_planeacion pueden editar mis_instrumentos.
 *
 * seguimientos: siempre visible para todos los roles registrados.
 */
export function usePermisos(): UsePermisosResult {
    const [loading, setLoading] = useState(true)
    const [rol, setRol] = useState<string | null>(null)
    const [permisos, setPermisos] = useState<Map<ModuloPermiso, PermisoRecord>>(new Map())

    const load = useCallback(async () => {
        const supabase = createClient()
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setLoading(false); return }

            const { data: perfil } = await supabase
                .from('perfiles')
                .select('rol, oficina_id')
                .eq('id', user.id)
                .single()

            if (!perfil) { setLoading(false); return }

            setRol(perfil.rol)

            // super_admin → acceso total a todo
            if (perfil.rol === 'super_admin') {
                setLoading(false)
                return
            }

            // ------------ Cargar permisos por usuario (override individual) ------------
            const { data: userPerms } = await supabase
                .from('permisos_usuario')
                .select('modulo, puede_ver, puede_editar')
                .eq('usuario_id', user.id)

            // ------------ Cargar permisos por oficina (base) ------------
            let officePerms: PermisoRecord[] = []
            if (perfil.oficina_id) {
                const { data: oPerms } = await supabase
                    .from('permisos_modulo_oficina')
                    .select('modulo, puede_ver, puede_editar')
                    .eq('oficina_id', perfil.oficina_id)
                officePerms = (oPerms as PermisoRecord[]) ?? []
            }

            // Merge: permiso de usuario sobreescribe a permiso de oficina
            const mergedMap = new Map<ModuloPermiso, PermisoRecord>()

            // Base: office perms
            officePerms.forEach(p => mergedMap.set(p.modulo as ModuloPermiso, p))

            // Override: user perms (if any)
            if (userPerms) {
                (userPerms as PermisoRecord[]).forEach(p => mergedMap.set(p.modulo as ModuloPermiso, p))
            }

            // REGLA FIJA: mis_instrumentos → jefe siempre puede VER, nunca editar
            const misInstPerm = mergedMap.get('mis_instrumentos')
            if (misInstPerm) {
                mergedMap.set('mis_instrumentos', { ...misInstPerm, puede_ver: true, puede_editar: false })
            } else {
                mergedMap.set('mis_instrumentos', { modulo: 'mis_instrumentos', puede_ver: true, puede_editar: false })
            }

            // REGLA FIJA: seguimientos → jefe siempre puede ver (y editar según su oficina)
            if (!mergedMap.has('seguimientos')) {
                mergedMap.set('seguimientos', { modulo: 'seguimientos', puede_ver: true, puede_editar: true })
            }

            setPermisos(mergedMap)
        } catch (err) {
            console.error('[usePermisos] Error:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { load() }, [load])

    const esAdmin = rol === 'super_admin'
    const esEquipoPlaneacion = rol === 'equipo_planeacion'

    const puedeVer = useCallback((modulo: ModuloPermiso): boolean => {
        // super_admin siempre puede ver todo
        if (esAdmin) return true
        // seguimientos siempre visible para roles registrados
        if (modulo === 'seguimientos' && rol) return true
        
        const p = permisos.get(modulo)
        return p?.puede_ver ?? false
    }, [permisos, esAdmin, rol])

    const puedeEditar = useCallback((modulo: ModuloPermiso): boolean => {
        // super_admin siempre puede editar todo
        if (esAdmin) return true
        // Solo super_admin y equipo_planeacion pueden editar mis_instrumentos (pero equipeo_planeacion necesita permiso explícito si es otro modulo)
        if (modulo === 'mis_instrumentos') return esAdmin || esEquipoPlaneacion
        
        const p = permisos.get(modulo)
        return p?.puede_editar ?? false
    }, [permisos, esAdmin, esEquipoPlaneacion])

    return { loading, rol, puedeVer, puedeEditar, esAdmin, esEquipoPlaneacion }
}
