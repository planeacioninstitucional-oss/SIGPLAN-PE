'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2, ShieldOff } from 'lucide-react'
import { usePermisos, type ModuloPermiso } from '@/lib/hooks/usePermisos'

interface Props {
    modulo: ModuloPermiso
    children: React.ReactNode
    /** Optional: roles that bypass the check entirely (default: super_admin, equipo_planeacion) */
    adminRoles?: string[]
}

/**
 * Wraps a page with a permission check.
 * - If loading: shows spinner
 * - If no permission: shows access denied + redirects to /dashboard
 * - If allowed: renders children
 */
export function PermisoGuard({ modulo, children }: Props) {
    const { puedeVer, loading, rol } = usePermisos()
    const router = useRouter()

    const allowed = puedeVer(modulo)

    useEffect(() => {
        if (!loading && !allowed && rol) {
            router.replace('/dashboard')
        }
    }, [loading, allowed, rol, router])

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!allowed && rol) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center">
                <ShieldOff className="w-16 h-16 text-muted-foreground/40" />
                <h2 className="text-xl font-bold text-foreground">Sin acceso</h2>
                <p className="text-muted-foreground text-sm max-w-sm">
                    No tienes permisos para acceder a este módulo.
                    Comunícate con el Equipo de Planeación para solicitar acceso.
                </p>
            </div>
        )
    }

    return <>{children}</>
}
