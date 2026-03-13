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
import { usePermisos } from '@/lib/hooks/usePermisos'
import { Eye } from 'lucide-react'
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
    mensual: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20',
    trimestral: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20',
    cuatrimestral: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20',
    semestral: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20',
    anual: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
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
    const { puedeEditar, esAdmin, loading: permisosLoading } = usePermisos()
    const canEdit = puedeEditar('mis_instrumentos') // only true for super_admin / equipo_planeacion
    const [loading, setLoading] = useState(true)

    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
    const [pams, setPams] = useState<any[]>([])
    const [piips, setPiips] = useState<any[]>([])
    const [userProfile, setUserProfile] = useState<{ id: string; rol: any; oficina_id: string | null } | null>(null)
    const [misDependenciaIds, setMisDependenciaIds] = useState<string[]>([])
    const [misDependencias, setMisDependencias] = useState<Dependencia[]>([])
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

    const fetchAllData = useCallback(async () => {
        if (!vigenciaActual || !userLoaded || !userProfile?.oficina_id) return
        
        setLoading(true)
        try {
            const [procsRes, ofisRes, depsRes] = await Promise.all([
                supabase.from('procesos_institucionales').select('*'),
                supabase.from('oficinas').select('*'),
                supabase.from('dependencias').select('*')
            ])
            
            if (procsRes.data && ofisRes.data) {
                const todasDeps = depsRes.data || []
                const misDepsData = getMisDependencias(userProfile.oficina_id, procsRes.data, ofisRes.data, todasDeps)
                const depIds = misDepsData.map(d => d.id)
                setMisDependenciaIds(depIds)
                setMisDependencias(misDepsData)

                const [instRes, segRes, pamRes, piipRes] = await Promise.all([
                    supabase.from('instrumentos').select('*').eq('activo', true).order('orden'),
                    supabase.from('seguimientos').select('*').eq('vigencia_id', vigenciaActual.id).in('dependencia_id', depIds),
                    supabase.from('plan_accion_municipal').select('*').eq('vigencia_id', vigenciaActual.id).in('dependencia_id', depIds),
                    supabase.from('piip').select('*').eq('vigencia_id', vigenciaActual.id).in('dependencia_id', depIds)
                ])

                if (instRes.data) {
                    const aplicables = instRes.data.filter(inst => {
                        const validDeps = getDependenciasParaInstrumento(inst.nombre, misDepsData)
                        return validDeps.length > 0
                    })
                    setInstrumentos(aplicables)
                }
                if (segRes.data) setSeguimientos(segRes.data)
                if (pamRes.data) setPams(pamRes.data)
                if (piipRes.data) setPiips(piipRes.data)
            }
        } catch (error) {
            toast.error('Error cargando datos')
        } finally {
            setLoading(false)
        }
    }, [vigenciaActual, userLoaded, userProfile])

    useEffect(() => {
        fetchAllData()
    }, [fetchAllData])

    const seguimientosMap = useMemo(() => {
        const map = new Map<string, Seguimiento>()
        seguimientos.forEach(s => map.set(`${s.dependencia_id}-${s.instrumento_id}-${s.periodo_corte}`, s))
        return map
    }, [seguimientos])

    const getSeguimientoPara = (depId: string, instrId: string, periodo: string) =>
        seguimientosMap.get(`${depId}-${instrId}-${periodo}`) ?? null

    const handleClick = (dependencia: Dependencia, instrumento: Instrumento, periodo: string) => {
        // Only admins/equipo_planeacion can edit; jefes just view
        if (!canEdit) {
            // Still open dialog but in read-only mode
            setSelectedCell({ dependencia, instrumento, periodo, seguimiento: getSeguimientoPara(dependencia.id, instrumento.id, periodo) })
            setDialogOpen(true)
            return
        }
        setSelectedCell({ dependencia, instrumento, periodo, seguimiento: getSeguimientoPara(dependencia.id, instrumento.id, periodo) })
        setDialogOpen(true)
    }

    if (!vigenciaActual) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
                <FileCheck className="w-16 h-16 text-slate-700" />
                <p className="text-muted-foreground">Seleccione una vigencia para ver sus instrumentos.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                    Mis Instrumentos
                </h1>
                <p className="text-muted-foreground mt-1">
                    {canEdit
                        ? <>Edite el cumplimiento por instrumento — Vigencia <span className="text-blue-600 dark:text-blue-400 font-semibold">{vigenciaActual.anio}</span></>
                        : <>Consulte su cumplimiento por instrumento — Vigencia <span className="text-blue-600 dark:text-blue-400 font-semibold">{vigenciaActual.anio}</span></>}
                </p>
                {!canEdit && (
                    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-muted border border-border text-sm text-muted-foreground">
                        <Eye className="w-4 h-4 shrink-0 text-blue-500" />
                        <span>Modo <strong>solo lectura</strong> — los estados los actualiza el Equipo de Planeación.</span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
            ) : (
                <div className="space-y-10">
                    {Object.entries(
                        misDependencias.reduce((acc, dep) => {
                            const name = formatDependenciaName(dep.nombre)
                            if (!acc[name]) acc[name] = []
                            acc[name].push(dep)
                            return acc
                        }, {} as Record<string, Dependencia[]>)
                    ).map(([groupName, groupDeps]) => {
                        const groupIds = groupDeps.map(d => d.id)
                        const instsParaGrupo = instrumentos.filter(inst => 
                            groupDeps.some((dep: Dependencia) => getDependenciasParaInstrumento(inst.nombre, [dep]).length > 0)
                        )
                        const pamsParaGrupo = pams.filter(p => groupIds.includes(p.dependencia_id))
                        const piipsParaGrupo = piips.filter(p => groupIds.includes(p.dependencia_id))

                        if (instsParaGrupo.length === 0 && pamsParaGrupo.length === 0 && piipsParaGrupo.length === 0) return null

                        return (
                            <div key={groupName} className="space-y-4">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                                    <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
                                    Proceso: {groupName}
                                </h2>
                                <div className="grid gap-4">
                                    {/* 1. PAM Cards */}
                                    {pamsParaGrupo.map((pam) => (
                                        <Card key={`pam-${pam.id}`} className="card-glass border-blue-200/50 dark:border-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10 border-l-4 border-l-blue-500">
                                            <CardHeader className="py-3 px-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-sm font-bold text-blue-700 dark:text-blue-300 uppercase tracking-tighter">Plan de Acción Municipal</CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-1">{pam.programa}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-600 dark:text-blue-300 uppercase">Estado General</span>
                                                        <SemaforoCell estado={pam.estado || 'gris'} showText className="h-7" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    ))}

                                    {/* 2. PIIP Cards */}
                                    {piipsParaGrupo.map((piip) => (
                                        <Card key={`piip-${piip.id}`} className="card-glass border-emerald-200/50 dark:border-emerald-500/20 bg-emerald-50/10 dark:bg-emerald-900/10 border-l-4 border-l-emerald-500">
                                            <CardHeader className="py-3 px-5">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <CardTitle className="text-sm font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-tighter">Proyecto PIIP</CardTitle>
                                                        <CardDescription className="text-xs text-muted-foreground mt-1 line-clamp-1">{piip.nombre_proyecto}</CardDescription>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 uppercase">Estado General</span>
                                                        <SemaforoCell estado={piip.estado || 'gris'} showText className="h-7" />
                                                    </div>
                                                </div>
                                            </CardHeader>
                                        </Card>
                                    ))}

                                    {/* 3. Instrument Cards */}
                                    {instsParaGrupo.map((inst) => {
                                        const periods = getPeriodsForFrecuencia(inst.frecuencia)
                                        // Count cumplimiento across all deps in group for this instrument
                                        const total = periods.length
                                        // For simplicity, if ANY dep in group has it verde, we count it? 
                                        // No, standard instruments should probably be linked to the MAIN process ID.
                                        // But if they are spread, we sum.
                                        const getStatus = (p: string) => {
                                            for (const dep of groupDeps) {
                                                const s = getSeguimientoPara(dep.id, inst.id, p)
                                                if (s) return s.estado_semaforo
                                            }
                                            return 'gris'
                                        }

                                        const cumplidos = periods.filter(p => getStatus(p) === 'verde').length
                                        const pct = total > 0 ? Math.round((cumplidos / total) * 100) : 0

                                        return (
                                            <Card key={`${groupName}-${inst.id}`} className="card-glass border-border bg-card">
                                                <CardHeader className="pb-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <CardTitle className="text-base text-foreground">{inst.nombre}</CardTitle>
                                                            {inst.descripcion && (
                                                                <CardDescription className="text-muted-foreground text-xs mt-1">{inst.descripcion}</CardDescription>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className={cn('text-[11px] px-2 py-0.5 rounded border font-semibold', FRECUENCIA_COLOR[inst.frecuencia])}>
                                                                {FRECUENCIA_LABEL[inst.frecuencia]}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">{cumplidos}/{total}</span>
                                                        </div>
                                                    </div>
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
                                                            const estado = getStatus(period)
                                                            return (
                                                                <button
                                                                    key={period}
                                                                    onClick={() => {
                                                                        const existingDep = groupDeps.find(d => getSeguimientoPara(d.id, inst.id, period))
                                                                        handleClick(existingDep || groupDeps[0], inst, period)
                                                                    }}
                                                                    title={canEdit ? 'Clic para actualizar' : 'Solo lectura — actualizado por Equipo de Planeación'}
                                                                    className={cn(
                                                                        'flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200',
                                                                        canEdit
                                                                            ? 'hover:bg-muted/50 hover:border-blue-500/30 hover:scale-105 cursor-pointer'
                                                                            : 'cursor-default opacity-90',
                                                                        estado === 'gris'
                                                                            ? 'border-border bg-card'
                                                                            : 'border-border/80 bg-card shadow-sm'
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
                    onSuccess={fetchAllData}
                />
            )}
        </div>
    )
}
