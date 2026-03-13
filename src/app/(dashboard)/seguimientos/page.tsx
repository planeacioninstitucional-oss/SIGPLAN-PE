'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Download, BarChart3, CheckCircle2, XCircle, AlertCircle, Circle } from 'lucide-react'
import type { Dependencia, Instrumento, Seguimiento, RolUsuario, FrecuenciaInstrumento } from '@/types/database'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'
import { SeguimientoDialog } from '@/components/seguimientos/SeguimientoDialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { canViewInstrumento, getDependenciasParaInstrumento, formatDependenciaName } from '@/lib/responsabilidades'

// ─── Period generation based on instrument frequency ───────────────────────
function getPeriodsForFrecuencia(frecuencia: FrecuenciaInstrumento): string[] {
    switch (frecuencia) {
        case 'mensual':
            return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        case 'trimestral':
            return ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
        case 'cuatrimestral':
            return ['Cuatrimestre 1', 'Cuatrimestre 2', 'Cuatrimestre 3']
        case 'semestral':
            return ['Semestre 1', 'Semestre 2']
        case 'anual':
            return ['Anual']
        default:
            return ['Período 1']
    }
}

const FRECUENCIA_BADGE: Record<FrecuenciaInstrumento, { label: string; color: string }> = {
    mensual: { label: 'Mensual', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20' },
    trimestral: { label: 'Trimestral', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20' },
    cuatrimestral: { label: 'Cuatrimestral', color: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20' },
    semestral: { label: 'Semestral', color: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/20' },
    anual: { label: 'Anual', color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' },
}

const SEMAFORO_STATS_CONFIG = [
    { key: 'verde', label: 'Cumplidos', icon: CheckCircle2, color: 'text-green-400' },
    { key: 'amarillo', label: 'Parciales', icon: AlertCircle, color: 'text-yellow-400' },
    { key: 'rojo', label: 'Sin cumplir', icon: XCircle, color: 'text-red-400' },
    { key: 'gris', label: 'Sin reporte', icon: Circle, color: 'text-muted-foreground' },
] as const

export default function SeguimientosPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(false)

    // Data
    const [dependencias, setDependencias] = useState<Dependencia[]>([])
    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
    const [userProfile, setUserProfile] = useState<{ id: string; rol: RolUsuario; dependencia_id: string | null; nombre_completo?: string | null } | null>(null)
    const [myAssignedIds, setMyAssignedIds] = useState<string[]>([])  // IDs de instrumentos asignados al usuario

    // Selection
    const [selectedInstrumentoId, setSelectedInstrumentoId] = useState<string>('')

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{
        dependencia: Dependencia
        periodo: string
        seguimiento: Seguimiento | null
    } | null>(null)

    const supabase = createClient()

    // ── 1. Fetch user profile + assignments ────────────────────────────────
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
            if (profile) {
                setUserProfile(profile)
                // Fetch assignments for evaluadores
                if (profile.rol === 'equipo_planeacion') {
                    const { data: asignaciones } = await supabase
                        .from('asignaciones_evaluador')
                        .select('instrumento_id')
                        .eq('perfil_id', user.id)
                    setMyAssignedIds(asignaciones?.map(a => a.instrumento_id) ?? [])
                }
            }
        }
        fetchUser()
    }, [])

    // ── 2. Fetch master data (Dependencias + Instrumentos) ─────────────────
    useEffect(() => {
        if (!vigenciaActual) return
        const fetchMasterData = async () => {
            setLoading(true)
            try {
                const [depsRes, instRes] = await Promise.all([
                    supabase.from('dependencias').select('*').eq('activa', true).order('nombre'),
                    // Instruments are NOT per-vigencia, they are global catalogs
                    supabase.from('instrumentos').select('*').eq('activo', true).order('orden'),
                ])
                if (depsRes.error) throw depsRes.error
                if (instRes.error) throw instRes.error

                setDependencias(depsRes.data ?? [])
                const insts = instRes.data ?? []

                setInstrumentos(insts)

                // Select first visible instrument
                if (insts.length > 0 && !selectedInstrumentoId) {
                    setSelectedInstrumentoId(insts[0].id)
                }
            } catch {
                toast.error('Error cargando datos maestros')
            } finally {
                setLoading(false)
            }
        }
        fetchMasterData()
    }, [vigenciaActual])

    // ── 3. Fetch seguimientos when instrument or vigencia changes ──────────
    const fetchSeguimientos = useCallback(async () => {
        if (!selectedInstrumentoId || !vigenciaActual) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('seguimientos')
                .select('*')
                .eq('instrumento_id', selectedInstrumentoId)
                .eq('vigencia_id', vigenciaActual.id)
            if (error) throw error
            setSeguimientos(data ?? [])
        } catch {
            toast.error('Error cargando seguimientos')
        } finally {
            setLoading(false)
        }
    }, [selectedInstrumentoId, vigenciaActual])

    useEffect(() => { fetchSeguimientos() }, [fetchSeguimientos])

    // ── Helpers ─────────────────────────────────────────────────────────────

    // Filter instruments based on user profile responsibility explicitly mapping the list provided
    const visibleInstrumentos = instrumentos.filter(i => {
        if (!userProfile) return false;
        return canViewInstrumento(i.nombre, userProfile.nombre_completo, userProfile.rol);
    });

    const currentInstrumento = instrumentos.find(i => i.id === selectedInstrumentoId)
    const periods = currentInstrumento ? getPeriodsForFrecuencia(currentInstrumento.frecuencia) : []

    // Filtra las dependencias que aplican para este instrumento
    const visibleDependencias = currentInstrumento
        ? getDependenciasParaInstrumento(currentInstrumento.nombre, dependencias)
        : dependencias;
        
    const seguimientosMap = useMemo(() => {
        const map = new Map<string, Seguimiento>()
        seguimientos.forEach(s => map.set(`${s.dependencia_id}-${s.periodo_corte}`, s))
        return map
    }, [seguimientos])

    const getSeguimiento = (depId: string, periodo: string) =>
        seguimientosMap.get(`${depId}-${periodo}`) ?? null

    const handleCellClick = (dep: Dependencia, periodo: string) => {
        // Evaluadores can only click cells for their assigned instruments
        if (userProfile?.rol === 'equipo_planeacion' && !myAssignedIds.includes(selectedInstrumentoId) && myAssignedIds.length > 0) {
            toast.error('No tienes asignado este instrumento para evaluación')
            return
        }
        setSelectedCell({ dependencia: dep, periodo, seguimiento: getSeguimiento(dep.id, periodo) })
        setDialogOpen(true)
    }

    // ── Stats ────────────────────────────────────────────────────────────────
    const stats = {
        verde: seguimientos.filter(s => s.estado_semaforo === 'verde').length,
        amarillo: seguimientos.filter(s => s.estado_semaforo === 'amarillo').length,
        rojo: seguimientos.filter(s => s.estado_semaforo === 'rojo').length,
        gris: (visibleDependencias.length * periods.length) - seguimientos.filter(s => s.estado_semaforo !== 'gris').length,
    }

    const canInteract = userProfile && ['super_admin', 'equipo_planeacion', 'jefe_oficina'].includes(userProfile.rol)

    if (!vigenciaActual) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-4">
                <BarChart3 className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground dark:text-slate-300">Seleccione una vigencia</h2>
                <p className="text-muted-foreground">Use el selector de vigencia en el header para continuar.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-white flex items-center gap-3">
                        <BarChart3 className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                        Mesa de Control
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Instrumentos de Planeación — Vigencia <span className="text-blue-600 dark:text-blue-400 font-semibold">{vigenciaActual.anio}</span>
                    </p>
                </div>
                <Button variant="outline" size="sm" className="hidden md:flex border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Informe
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {SEMAFORO_STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
                    <Card key={key} className="card-glass border-border bg-card">
                        <CardContent className="p-4 flex items-center gap-3">
                            <Icon className={cn('w-8 h-8 opacity-90', 
                                key === 'verde' ? 'text-green-600 dark:text-green-400' :
                                key === 'amarillo' ? 'text-yellow-600 dark:text-yellow-400' :
                                key === 'rojo' ? 'text-red-600 dark:text-red-400' :
                                'text-muted-foreground'
                            )} />
                            <div>
                                <p className="text-2xl font-bold text-foreground">{stats[key]}</p>
                                <p className="text-xs text-muted-foreground">{label}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Instrument Selector — horizontal pills */}
            <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Instrumento de Planeación</p>
                <div className="flex flex-wrap gap-2">
                    {visibleInstrumentos.map((inst) => {
                        const isSelected = inst.id === selectedInstrumentoId
                        const freq = FRECUENCIA_BADGE[inst.frecuencia]
                        const isMyAssignment = myAssignedIds.includes(inst.id)
                        return (
                            <button
                                key={inst.id}
                                onClick={() => setSelectedInstrumentoId(inst.id)}
                                className={cn(
                                    'group flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 border',
                                    isSelected
                                        ? 'bg-blue-50 dark:bg-blue-600/20 border-blue-200 dark:border-blue-500/50 text-blue-700 dark:text-white shadow-[0_0_20px_-5px_rgba(37,99,235,0.2)] dark:shadow-[0_0_20px_-5px_rgba(37,99,235,0.5)]'
                                        : 'bg-white dark:bg-slate-900/60 border-border dark:border-slate-800 text-foreground dark:text-slate-400 hover:text-gray-900 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800/80',
                                )}
                            >
                                <span className="truncate max-w-[220px]">{inst.nombre}</span>
                                <span className={cn('text-[10px] px-1.5 py-0.5 rounded border font-semibold shrink-0', freq.color)}>
                                    {freq.label}
                                </span>
                                {isMyAssignment && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" title="Asignado a ti" />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Main Table */}
            <Card className="card-glass border-gray-200 dark:border-slate-800">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-lg text-foreground dark:text-slate-100 flex items-center gap-2">
                                {currentInstrumento?.nombre || '—'}
                            </CardTitle>
                            <CardDescription className="text-muted-foreground">
                                {currentInstrumento?.descripcion || 'Seleccione un instrumento'}
                                {currentInstrumento && (
                                    <span className={cn('ml-2 text-[11px] px-2 py-0.5 rounded border font-semibold',
                                        FRECUENCIA_BADGE[currentInstrumento.frecuencia]?.color)}>
                                        {FRECUENCIA_BADGE[currentInstrumento.frecuencia]?.label}
                                    </span>
                                )}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative overflow-hidden rounded-b-xl border-t border-gray-200 dark:border-slate-800">
                        {loading && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-950/60 z-20 flex items-center justify-center backdrop-blur-sm">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
                            </div>
                        )}

                        <Table wrapperClassName="max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-slate-700">
                            <TableHeader className="sticky top-0 z-10 bg-muted/95 dark:bg-slate-900/95 backdrop-blur-sm">
                                <TableRow className="border-border dark:border-slate-800 hover:bg-transparent">
                                    <TableHead className="w-[280px] min-w-[220px] sticky left-0 bg-muted/95 dark:bg-slate-900/95 z-20 border-r border-border dark:border-slate-800 text-foreground dark:text-slate-300 font-bold py-4 pl-5">
                                        Dependencia / Oficina
                                    </TableHead>
                                    {periods.map((period) => (
                                        <TableHead key={period} className="text-center min-w-[110px] text-muted-foreground font-semibold text-xs uppercase tracking-wide py-4">
                                            {period}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleDependencias.length === 0 && !loading && (
                                    <TableRow>
                                        <TableCell colSpan={periods.length + 1} className="text-center text-slate-500 py-16">
                                            No hay dependencias registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                                {visibleDependencias.map((dep, i) => (
                                    <TableRow
                                        key={dep.id}
                                        className={cn(
                                            'border-gray-200 dark:border-slate-800/50 transition-colors',
                                            i % 2 === 0 ? 'bg-gray-50/50 dark:bg-slate-950/20' : 'bg-transparent',
                                            'hover:bg-blue-50/50 dark:hover:bg-slate-800/40'
                                        )}
                                    >
                                        <TableCell className="font-medium text-foreground dark:text-slate-200 sticky left-0 bg-white dark:bg-slate-950 z-10 border-r border-border dark:border-slate-800 py-3 pl-5 group-hover:bg-blue-50/50 dark:group-hover:bg-slate-900/80">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-sm font-semibold line-clamp-2 max-w-[240px]">{formatDependenciaName(dep.nombre)}</span>
                                            </div>
                                        </TableCell>
                                        {periods.map((period) => {
                                            const seg = getSeguimiento(dep.id, period)
                                            const estado = seg?.estado_semaforo ?? 'gris'
                                            return (
                                                <TableCell key={`${dep.id}-${period}`} className="text-center p-2">
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => canInteract && handleCellClick(dep, period)}
                                                            title={seg ? `${estado} — Click para editar` : 'Sin reporte — Click para registrar'}
                                                            className={cn(
                                                                'transition-all duration-200',
                                                                canInteract ? 'hover:scale-125 cursor-pointer' : 'cursor-default opacity-70'
                                                            )}
                                                        >
                                                            <SemaforoCell estado={estado} />
                                                        </button>
                                                    </div>
                                                </TableCell>
                                            )
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {/* Legend */}
                        <div className="flex items-center gap-6 px-5 py-3 border-t border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50">
                            {SEMAFORO_STATS_CONFIG.map(({ key, label, icon: Icon, color }) => (
                                <div key={key} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-400">
                                    <Icon className={cn('w-3.5 h-3.5', color)} />
                                    <span>{label}</span>
                                </div>
                            ))}
                            {canInteract && (
                                <span className="ml-auto text-xs text-slate-600 italic">
                                    * Click en el semáforo para registrar o editar
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog */}
            {selectedCell && currentInstrumento && userProfile && vigenciaActual && (
                <SeguimientoDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependencia={selectedCell.dependencia}
                    instrumento={currentInstrumento}
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
