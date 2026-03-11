'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, FileCheck, CheckCircle2, XCircle, AlertCircle, Circle, ChevronRight } from 'lucide-react'
import type { Instrumento, Seguimiento, FrecuenciaInstrumento, Dependencia } from '@/types/database'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'
import { SeguimientoDialog } from '@/components/seguimientos/SeguimientoDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getDependenciasParaInstrumento, formatDependenciaName, getMisDependencias } from '@/lib/responsabilidades'

function getPeriodsForFrecuencia(frecuencia: FrecuenciaInstrumento): string[] {
    switch (frecuencia) {
        case 'mensual': return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        case 'trimestral': return ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
        case 'cuatrimestral': return ['Cuatrimestre 1', 'Cuatrimestre 2', 'Cuatrimestre 3']
        case 'semestral': return ['Semestre 1', 'Semestre 2']
        case 'anual': return ['Anual']
        default: return ['Período 1']
    }
}

const FRECUENCIA_COLOR: Record<FrecuenciaInstrumento, string> = {
    mensual: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    trimestral: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    cuatrimestral: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    semestral: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    anual: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
}

const FRECUENCIA_LABEL: Record<FrecuenciaInstrumento, string> = {
    mensual: 'Mensual',
    trimestral: 'Trimestral',
    cuatrimestral: 'Cuatrimestral',
    semestral: 'Semestral',
    anual: 'Anual',
}

export default function MisInstrumentosPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)

    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
    const [userProfile, setUserProfile] = useState<{ id: string; rol: any; oficina_id: string | null } | null>(null)
    const [misDependenciaIds, setMisDependenciaIds] = useState<string[]>([])
    const [misDependencias, setMisDependencias] = useState<any[]>([])
    const [userLoaded, setUserLoaded] = useState(false)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{
        dependencia: Dependencia
        instrumento: Instrumento
        periodo: string
        seguimiento: Seguimiento | null
    } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setUserLoaded(true)
                return
            }
            const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
            if (data) setUserProfile(data)
            setUserLoaded(true)
        }
        fetchUser()
    }, [])

    const fetchSeguimientos = useCallback(async () => {
        if (!vigenciaActual || !userLoaded) return
        
        // If there's no dependency, no seguimientos to load for the single view
        if (misDependenciaIds.length === 0) {
            setSeguimientos([])
            return
        }

        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('seguimientos')
                .select('*')
                .eq('vigencia_id', vigenciaActual.id)
                .in('dependencia_id', misDependenciaIds)
            if (error) throw error
            setSeguimientos(data ?? [])
        } catch {
            toast.error('Error cargando seguimientos')
        } finally {
            setLoading(false)
        }
    }, [vigenciaActual, userLoaded, misDependenciaIds])

    useEffect(() => {
        if (!vigenciaActual || !userLoaded) return
        
        const fetchInstrumentos = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('instrumentos')
                    .select('*')
                    .eq('activo', true)
                    .order('orden')
                if (error) throw error

                let allInsts = data ?? []

                if (userProfile?.oficina_id) {
                    const { data: todosProcesos } = await supabase.from('procesos_institucionales').select('*')
                    const { data: todasOficinas } = await supabase.from('oficinas').select('*')
                    
                    if (todosProcesos && todasOficinas) {
                        const misDepsData = getMisDependencias(userProfile.oficina_id, todosProcesos, todasOficinas)
                        setMisDependenciaIds(misDepsData.map(d => d.id))
                        setMisDependencias(misDepsData)

                        const aplicables = allInsts.filter(inst => {
                            const validDeps = getDependenciasParaInstrumento(inst.nombre, misDepsData)
                            return validDeps.length > 0
                        })
                        setInstrumentos(aplicables)
                        return
                    }
                }
                
                // If it's an admin or user with no dependency
                setInstrumentos(allInsts)

            } catch {
                toast.error('Error cargando instrumentos')
            } finally {
                setLoading(false)
            }
        }
        fetchInstrumentos()
    }, [vigenciaActual, userProfile])

    useEffect(() => { fetchSeguimientos() }, [fetchSeguimientos])

    const seguimientosMap = useMemo(() => {
        const map = new Map<string, Seguimiento>()
        seguimientos.forEach(s => map.set(`${s.dependencia_id}-${s.instrumento_id}-${s.periodo_corte}`, s))
        return map
    }, [seguimientos])

    const getSeguimientoPara = (depId: string, instrId: string, periodo: string) =>
        seguimientosMap.get(`${depId}-${instrId}-${periodo}`) ?? null

    const handleClick = (dependencia: Dependencia, instrumento: Instrumento, periodo: string) => {
        if (!['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') && userProfile?.rol !== 'jefe_oficina') {
            toast.error('Solo tienes permisos de visualización.')
            return
        }
        setSelectedCell({ dependencia, instrumento, periodo, seguimiento: getSeguimientoPara(dependencia.id, instrumento.id, periodo) })
        setDialogOpen(true)
    }

    if (!vigenciaActual) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
                <FileCheck className="w-16 h-16 text-slate-700" />
                <p className="text-slate-400">Seleccione una vigencia para ver sus instrumentos.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    Mis Instrumentos
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">
                    Reporte su cumplimiento por instrumento — Vigencia{' '}
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{vigenciaActual.anio}</span>
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
            ) : (
                <div className="space-y-10">
                    {misDependencias.map(dep => {
                        const instsParaDep = instrumentos.filter(inst => getDependenciasParaInstrumento(inst.nombre, [dep]).length > 0)
                        if (instsParaDep.length === 0) return null

                        return (
                            <div key={dep.id} className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-slate-100">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                    Proceso: {formatDependenciaName(dep.nombre)}
                                </h2>
                                <div className="grid gap-4">
                                    {instsParaDep.map((inst) => {
                                        const periods = getPeriodsForFrecuencia(inst.frecuencia)
                                        const cumplidos = periods.filter(p => getSeguimientoPara(dep.id, inst.id, p)?.estado_semaforo === 'verde').length
                                        const total = periods.length
                                        const pct = total > 0 ? Math.round((cumplidos / total) * 100) : 0

                                        return (
                                            <Card key={`${dep.id}-${inst.id}`} className="card-glass border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <CardTitle className="text-base text-gray-900 dark:text-slate-100">{inst.nombre}</CardTitle>
                                                            {inst.descripcion && (
                                                                <CardDescription className="text-gray-500 dark:text-slate-500 text-xs mt-1">{inst.descripcion}</CardDescription>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={cn('text-[11px] px-2 py-0.5 rounded border font-semibold', FRECUENCIA_COLOR[inst.frecuencia])}>
                                                                {FRECUENCIA_LABEL[inst.frecuencia]}
                                                            </span>
                                                            <span className="text-xs text-gray-500 dark:text-slate-400">{cumplidos}/{total}</span>
                                                        </div>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div className="w-full h-1.5 bg-gray-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                                        <div
                                                            className={cn('h-full rounded-full transition-all duration-500',
                                                                pct === 100 ? 'bg-green-500' : pct > 50 ? 'bg-yellow-500' : 'bg-red-500'
                                                            )}
                                                            style={{ width: `${pct}%` }}
                                                        />
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex flex-wrap gap-3">
                                                        {periods.map((period) => {
                                                            const seg = getSeguimientoPara(dep.id, inst.id, period)
                                                            const estado = seg?.estado_semaforo ?? 'gris'
                                                            return (
                                                                <button
                                                                    key={period}
                                                                    onClick={() => handleClick(dep, inst, period)}
                                                                    className={cn(
                                                                        'flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200',
                                                                        'hover:bg-gray-50 dark:hover:bg-slate-700/50 hover:border-gray-300 dark:hover:border-slate-600 hover:scale-105',
                                                                        estado === 'gris'
                                                                            ? 'border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/40'
                                                                            : 'border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 shadow-sm'
                                                                    )}
                                                                >
                                                                    <SemaforoCell estado={estado} />
                                                                    <span className="text-[10px] text-gray-500 dark:text-slate-400 font-medium">{period}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {selectedCell && userProfile && vigenciaActual && userProfile.oficina_id && (
                <SeguimientoDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependencia={selectedCell.dependencia}
                    instrumento={selectedCell.instrumento}
                    periodo={selectedCell.periodo}
                    seguimientoExistente={selectedCell.seguimiento}
                    userRole={userProfile.rol}
                    userId={userProfile.id}
                    onSuccess={fetchSeguimientos}
                />
            )}
        </div>
    )
}
