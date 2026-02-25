'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, FileCheck, CheckCircle2, XCircle, AlertCircle, Circle, ChevronRight } from 'lucide-react'
import type { Instrumento, Seguimiento, FrecuenciaInstrumento } from '@/types/database'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'
import { SeguimientoDialog } from '@/components/seguimientos/SeguimientoDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

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
    const [userProfile, setUserProfile] = useState<{ id: string; rol: any; dependencia_id: string | null } | null>(null)

    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{
        instrumento: Instrumento
        periodo: string
        seguimiento: Seguimiento | null
    } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
            if (data) setUserProfile(data)
        }
        fetchUser()
    }, [])

    const fetchSeguimientos = useCallback(async () => {
        if (!vigenciaActual || !userProfile?.dependencia_id) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('seguimientos')
                .select('*')
                .eq('vigencia_id', vigenciaActual.id)
                .eq('dependencia_id', userProfile.dependencia_id)
            if (error) throw error
            setSeguimientos(data ?? [])
        } catch {
            toast.error('Error cargando seguimientos')
        } finally {
            setLoading(false)
        }
    }, [vigenciaActual, userProfile?.dependencia_id])

    useEffect(() => {
        if (!vigenciaActual) return
        const fetchInstrumentos = async () => {
            setLoading(true)
            try {
                const { data, error } = await supabase
                    .from('instrumentos')
                    .select('*')
                    .eq('activo', true)
                    .order('orden')
                if (error) throw error
                setInstrumentos(data ?? [])
            } catch {
                toast.error('Error cargando instrumentos')
            } finally {
                setLoading(false)
            }
        }
        fetchInstrumentos()
    }, [vigenciaActual])

    useEffect(() => { fetchSeguimientos() }, [fetchSeguimientos])

    const seguimientosMap = useMemo(() => {
        const map = new Map<string, Seguimiento>()
        seguimientos.forEach(s => map.set(`${s.instrumento_id}-${s.periodo_corte}`, s))
        return map
    }, [seguimientos])

    const getSeguimientoPara = (instrId: string, periodo: string) =>
        seguimientosMap.get(`${instrId}-${periodo}`) ?? null

    const handleClick = (instrumento: Instrumento, periodo: string) => {
        setSelectedCell({ instrumento, periodo, seguimiento: getSeguimientoPara(instrumento.id, periodo) })
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
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <FileCheck className="w-8 h-8 text-blue-400" />
                    Mis Instrumentos
                </h1>
                <p className="text-slate-400 mt-1">
                    Reporte su cumplimiento por instrumento — Vigencia{' '}
                    <span className="text-blue-400 font-semibold">{vigenciaActual.anio}</span>
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                </div>
            ) : (
                <div className="grid gap-4">
                    {instrumentos.map((inst) => {
                        const periods = getPeriodsForFrecuencia(inst.frecuencia)
                        const cumplidos = periods.filter(p => getSeguimientoPara(inst.id, p)?.estado_semaforo === 'verde').length
                        const total = periods.length
                        const pct = total > 0 ? Math.round((cumplidos / total) * 100) : 0

                        return (
                            <Card key={inst.id} className="card-glass border-slate-800 bg-slate-900/40">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <CardTitle className="text-base text-slate-100">{inst.nombre}</CardTitle>
                                            {inst.descripcion && (
                                                <CardDescription className="text-slate-500 text-xs mt-1">{inst.descripcion}</CardDescription>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className={cn('text-[11px] px-2 py-0.5 rounded border font-semibold', FRECUENCIA_COLOR[inst.frecuencia])}>
                                                {FRECUENCIA_LABEL[inst.frecuencia]}
                                            </span>
                                            <span className="text-xs text-slate-400">{cumplidos}/{total}</span>
                                        </div>
                                    </div>
                                    {/* Progress bar */}
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
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
                                            const seg = getSeguimientoPara(inst.id, period)
                                            const estado = seg?.estado_semaforo ?? 'gris'
                                            return (
                                                <button
                                                    key={period}
                                                    onClick={() => handleClick(inst, period)}
                                                    className={cn(
                                                        'flex flex-col items-center gap-1.5 px-3 py-2 rounded-lg border transition-all duration-200',
                                                        'hover:bg-slate-700/50 hover:border-slate-600 hover:scale-105',
                                                        estado === 'gris'
                                                            ? 'border-slate-800 bg-slate-900/40'
                                                            : 'border-slate-700 bg-slate-900/60'
                                                    )}
                                                >
                                                    <SemaforoCell estado={estado} />
                                                    <span className="text-[10px] text-slate-400 font-medium">{period}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}

            {selectedCell && userProfile && vigenciaActual && userProfile.dependencia_id && (
                <SeguimientoDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependencia={{ id: userProfile.dependencia_id, nombre: '', proceso_macro_id: '', correo_responsable: null, activa: true, reporte_pdd: false, created_at: '', updated_at: '' }}
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
