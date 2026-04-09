'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
    Loader2, TrendingUp, Bot,
    BarChart3, Activity, Target, ShieldAlert,
    FileText
} from 'lucide-react'
import {
    PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
    Tooltip, Legend, CartesianGrid
} from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Paleta de colores profesional ───────────────────────────────────────────
const SEMAFORO_COLORS = {
    verde: '#22c55e',
    amarillo: '#eab308',
    rojo: '#ef4444',
    gris: '#64748b'
}
const PIE_COLORS = [SEMAFORO_COLORS.verde, SEMAFORO_COLORS.amarillo, SEMAFORO_COLORS.rojo, SEMAFORO_COLORS.gris]

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface DependencyStats {
    name: string
    verde: number
    amarillo: number
    rojo: number
    gris: number
    total: number
    score: number
    avgFisico: number
    avgFinanciero: number
}

// ─── Componente auxiliar: KPI Card ───────────────────────────────────────────
function KpiCard({ title, value, subtitle, icon: Icon, color = 'text-foreground dark:text-white' }: {
    title: string, value: string | number, subtitle: string, icon: any, color?: string
}) {
    return (
        <Card className="card-glass border-border hover:border-primary/30 transition-all duration-300">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            </CardContent>
        </Card>
    )
}

// ─── Componente auxiliar: Barra de progreso ──────────────────────────────────
function ProgressBar({ value, max = 100, color = '#22c55e' }: { value: number, max?: number, color?: string }) {
    const pct = Math.min((value / max) * 100, 100)
    return (
        <div className="w-full bg-slate-700/50 rounded-full h-2.5">
            <div
                className="h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
            />
        </div>
    )
}

// ─── Custom Tooltip para gráficos ────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload) return null
    return (
        <div className="bg-slate-900/95 border border-slate-700 rounded-lg px-4 py-3 shadow-xl">
            <p className="text-sm font-semibold text-white mb-1">{label}</p>
            {payload.map((entry: any, i: number) => (
                <p key={i} className="text-xs" style={{ color: entry.fill || entry.color }}>
                    {entry.name}: <span className="font-bold">{entry.value}</span>
                </p>
            ))}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function ReportesPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [loadingAI, setLoadingAI] = useState(false)
    const [aiSummary, setAiSummary] = useState<string | null>(null)

    // Stats globales
    const [stats, setStats] = useState({
        total: 0, verde: 0, amarillo: 0, rojo: 0, gris: 0,
        promedioFisico: 0, promedioFinanciero: 0
    })

    // Stats por dependencia
    const [dependencyStats, setDependencyStats] = useState<DependencyStats[]>([])

    // Stats por instrumento
    const [instrumentStats, setInstrumentStats] = useState<{ name: string, total: number, verde: number, rojo: number }[]>([])

    const supabase = createClient()

    useEffect(() => {
        if (!vigenciaActual) return
        fetchStats()
    }, [vigenciaActual])

    // ─── Fetch de datos ──────────────────────────────────────────────────────
    const fetchStats = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            const { data: seguimientos } = await supabase
                .from('seguimientos')
                .select(`
                    estado_semaforo,
                    porcentaje_fisico,
                    porcentaje_financiero,
                    dependencias(nombre),
                    instrumentos(nombre)
                `)
                .eq('vigencia_id', vigenciaActual.id)

            if (!seguimientos) return

            // ─── Estadísticas Globales ───
            let verde = 0, amarillo = 0, rojo = 0, gris = 0
            let sumFisico = 0, sumFinanciero = 0, countPercents = 0

            // ─── Agrupación por dependencia ───
            const depMap = new Map<string, DependencyStats>()
            const instrMap = new Map<string, { name: string, total: number, verde: number, rojo: number }>()

            seguimientos.forEach(s => {
                if (s.estado_semaforo === 'verde') verde++
                if (s.estado_semaforo === 'amarillo') amarillo++
                if (s.estado_semaforo === 'rojo') rojo++
                if (s.estado_semaforo === 'gris') gris++

                if (s.porcentaje_fisico !== null) {
                    sumFisico += s.porcentaje_fisico
                    sumFinanciero += (s.porcentaje_financiero || 0)
                    countPercents++
                }

                // Dependencias
                const deps = s.dependencias as any
                const depName = (Array.isArray(deps) ? deps[0]?.nombre : deps?.nombre) || 'Desconocida'
                if (!depMap.has(depName)) {
                    depMap.set(depName, {
                        name: depName, verde: 0, amarillo: 0, rojo: 0, gris: 0,
                        total: 0, score: 0, avgFisico: 0, avgFinanciero: 0
                    })
                }
                const depStat = depMap.get(depName)!
                if (s.estado_semaforo === 'verde') depStat.verde++
                if (s.estado_semaforo === 'amarillo') depStat.amarillo++
                if (s.estado_semaforo === 'rojo') depStat.rojo++
                if (s.estado_semaforo === 'gris') depStat.gris++
                depStat.total++
                if (s.porcentaje_fisico !== null) {
                    depStat.avgFisico += s.porcentaje_fisico
                    depStat.avgFinanciero += (s.porcentaje_financiero || 0)
                }

                // Instrumentos
                const instr = s.instrumentos as any
                const instrName = (Array.isArray(instr) ? instr[0]?.nombre : instr?.nombre) || 'Desconocido'
                if (!instrMap.has(instrName)) {
                    instrMap.set(instrName, { name: instrName, total: 0, verde: 0, rojo: 0 })
                }
                const instrStat = instrMap.get(instrName)!
                instrStat.total++
                if (s.estado_semaforo === 'verde') instrStat.verde++
                if (s.estado_semaforo === 'rojo') instrStat.rojo++
            })

            setStats({
                total: seguimientos.length,
                verde, amarillo, rojo, gris,
                promedioFisico: countPercents ? sumFisico / countPercents : 0,
                promedioFinanciero: countPercents ? sumFinanciero / countPercents : 0
            })

            // Calcular promedios y scores por dependencia
            const depArray = Array.from(depMap.values()).map(d => {
                const reportedCount = d.verde + d.amarillo + d.rojo
                return {
                    ...d,
                    score: d.total > 0 ? ((d.verde * 1 + d.amarillo * 0.5) / d.total) * 100 : 0,
                    avgFisico: reportedCount > 0 ? d.avgFisico / reportedCount : 0,
                    avgFinanciero: reportedCount > 0 ? d.avgFinanciero / reportedCount : 0,
                }
            }).sort((a, b) => b.score - a.score)

            setDependencyStats(depArray)

            const instrArray = Array.from(instrMap.values()).sort((a, b) => b.total - a.total)
            setInstrumentStats(instrArray)

        } catch (error) {
            toast.error('Error cargando estadísticas')
        } finally {
            setLoading(false)
        }
    }

    // ─── Resumen ejecutivo automático (basado en datos, sin IA) ──────────────
    const autoSummary = useMemo(() => {
        if (loading || stats.total === 0) return null

        const pctVerde = ((stats.verde / stats.total) * 100).toFixed(1)
        const pctRojo = ((stats.rojo / stats.total) * 100).toFixed(1)
        const pctAmarillo = ((stats.amarillo / stats.total) * 100).toFixed(1)

        const topDeps = dependencyStats.slice(0, 3).map(d => d.name)
        const criticalDeps = dependencyStats.filter(d => d.rojo > 0).sort((a, b) => b.rojo - a.rojo).slice(0, 3)
        const lowPerformers = dependencyStats.filter(d => d.score < 50)

        // Determinar nivel general
        let nivel = '🟢 Satisfactorio'
        let nivelColor = 'text-green-400'
        if (stats.rojo > stats.verde) { nivel = '🔴 Crítico'; nivelColor = 'text-red-400' }
        else if (stats.amarillo > stats.verde) { nivel = '🟡 En Alerta'; nivelColor = 'text-yellow-400' }

        return {
            nivel, nivelColor, pctVerde, pctRojo, pctAmarillo, topDeps, criticalDeps, lowPerformers
        }
    }, [stats, dependencyStats, loading])

    // ─── Generar análisis IA (opcional — Gemini 2.0 Flash) ───────────────────
    const generateAiSummary = async () => {
        if (!vigenciaActual) return
        setLoadingAI(true)
        try {
            const res = await fetch('/api/gemini-summary', {
                method: 'POST',
                body: JSON.stringify({ vigenciaId: vigenciaActual.id })
            })
            const data = await res.json()
            if (data.error) throw new Error(data.error)
            setAiSummary(data.summary)
        } catch (error: any) {
            toast.error('Error generando análisis IA', {
                description: error.message || 'El servicio de IA no está disponible en este momento.'
            })
        } finally {
            setLoadingAI(false)
        }
    }

    // ─── Datos para gráficos ─────────────────────────────────────────────────
    const pieData = [
        { name: 'Cumplido', value: stats.verde },
        { name: 'Alerta', value: stats.amarillo },
        { name: 'Crítico', value: stats.rojo },
        { name: 'Sin Dato', value: stats.gris },
    ]

    // Top 10 dependencias para el gráfico de barras apiladas
    const stackedBarData = dependencyStats.slice(0, 10).map(d => ({
        name: d.name.length > 20 ? d.name.substring(0, 18) + '...' : d.name,
        Verde: d.verde,
        Amarillo: d.amarillo,
        Rojo: d.rojo,
    }))

    if (!vigenciaActual) return <div className="p-8 text-center text-slate-400">Seleccione una vigencia</div>

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
            <span className="ml-3 text-muted-foreground">Cargando estadísticas...</span>
        </div>
    )

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ─── Header ─────────────────────────────────────────────────── */}
            <div className="flex justify-between items-end flex-wrap gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-white">
                        Reportes Gerenciales
                    </h1>
                    <p className="text-muted-foreground">
                        Visión estratégica de la vigencia {vigenciaActual.anio} — Generado el {new Date().toLocaleDateString('es-CO')}
                    </p>
                </div>
                <Button
                    onClick={generateAiSummary}
                    className="bg-purple-600 hover:bg-purple-500 border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                    disabled={loadingAI}
                    size="sm"
                >
                    {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Análisis IA (Opcional)
                </Button>
            </div>

            {/* ─── Resumen Ejecutivo Automático ────────────────────────────── */}
            {autoSummary && (
                <Card className="card-glass border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-indigo-950/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center text-blue-200">
                                <FileText className="mr-2 h-5 w-5 text-blue-400" />
                                Resumen Ejecutivo
                            </CardTitle>
                            <Badge className={`${autoSummary.nivelColor} border-current bg-transparent`}>
                                {autoSummary.nivel}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {/* Cumplimiento */}
                            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                                <p className="text-slate-400 font-medium mb-2">📊 Estado de Cumplimiento</p>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between">
                                        <span className="text-green-400">Cumplidos</span>
                                        <span className="font-bold text-green-400">{stats.verde} ({autoSummary.pctVerde}%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-yellow-400">En alerta</span>
                                        <span className="font-bold text-yellow-400">{stats.amarillo} ({autoSummary.pctAmarillo}%)</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-red-400">Críticos</span>
                                        <span className="font-bold text-red-400">{stats.rojo} ({autoSummary.pctRojo}%)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Top Dependencias */}
                            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                                <p className="text-slate-400 font-medium mb-2">🏆 Mejor Desempeño</p>
                                <ul className="space-y-1 text-slate-300">
                                    {autoSummary.topDeps.map((name, i) => (
                                        <li key={i} className="flex items-center gap-2 text-xs">
                                            <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                                            <span className="truncate">{name}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Alertas */}
                            <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50">
                                <p className="text-slate-400 font-medium mb-2">⚠️ Alertas Críticas</p>
                                {autoSummary.criticalDeps.length > 0 ? (
                                    <ul className="space-y-1 text-slate-300">
                                        {autoSummary.criticalDeps.map((dep, i) => (
                                            <li key={i} className="text-xs flex justify-between">
                                                <span className="truncate">{dep.name}</span>
                                                <Badge variant="outline" className="text-red-400 border-red-500/50 text-[10px] ml-1">
                                                    {dep.rojo} rojo{dep.rojo > 1 ? 's' : ''}
                                                </Badge>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-green-400 text-xs">✅ Sin alertas críticas</p>
                                )}
                            </div>
                        </div>

                        {/* Recomendaciones automáticas */}
                        {autoSummary.lowPerformers.length > 0 && (
                            <div className="bg-amber-950/20 border border-amber-500/30 rounded-lg p-4 mt-2">
                                <p className="text-amber-400 font-medium text-sm mb-2">💡 Recomendaciones</p>
                                <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                                    {autoSummary.lowPerformers.slice(0, 3).map((dep, i) => (
                                        <li key={i}>
                                            <span className="font-medium">{dep.name}</span> presenta un score de{' '}
                                            <span className="text-red-400 font-bold">{dep.score.toFixed(0)}/100</span>.
                                            Se recomienda priorizar la revisión de sus {dep.rojo} reporte(s) en estado crítico.
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* ─── Análisis IA (opcional, si se generó) ───────────────────── */}
            {aiSummary && (
                <Card className="card-glass border-purple-500/50 bg-purple-950/10">
                    <CardHeader>
                        <CardTitle className="flex items-center text-purple-200">
                            <Bot className="mr-2 h-5 w-5 text-purple-400" />
                            Análisis Ejecutivo (IA — Gemini)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-foreground dark:text-slate-300 mx-auto max-w-none">
                        <div className="prose prose-invert prose-purple max-w-none prose-sm">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {aiSummary}
                            </ReactMarkdown>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* ─── KPIs ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    title="Avance Físico Global"
                    value={`${stats.promedioFisico.toFixed(1)}%`}
                    subtitle="Promedio ponderado"
                    icon={TrendingUp}
                    color={stats.promedioFisico >= 50 ? 'text-green-400' : 'text-amber-400'}
                />
                <KpiCard
                    title="Ejecución Financiera"
                    value={`${stats.promedioFinanciero.toFixed(1)}%`}
                    subtitle="Ejecución presupuestal"
                    icon={Activity}
                    color={stats.promedioFinanciero >= 50 ? 'text-blue-400' : 'text-amber-400'}
                />
                <KpiCard
                    title="Instrumentos Monitoreados"
                    value={stats.total}
                    subtitle={`${stats.verde + stats.amarillo + stats.rojo} con reporte`}
                    icon={Target}
                    color="text-foreground dark:text-white"
                />
                <KpiCard
                    title="Alertas Activas"
                    value={stats.rojo}
                    subtitle={`${stats.amarillo} en precaución`}
                    icon={ShieldAlert}
                    color="text-red-400"
                />
            </div>

            {/* ─── Gráficos: Fila 1 ──────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Donut Chart — Estado General */}
                <Card className="card-glass border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground dark:text-slate-200 text-base">Estado General</CardTitle>
                        <CardDescription>Distribución de cumplimiento</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData.filter(d => d.value > 0)}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={55}
                                    outerRadius={85}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={(props: any) => `${props.name || ''} ${((props.percent || 0) * 100).toFixed(0)}%`}
                                    labelLine={false}
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Barras Apiladas — Por Dependencia */}
                <Card className="card-glass border-border lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-foreground dark:text-slate-200 text-base">Desempeño por Dependencia</CardTitle>
                        <CardDescription>Estado semáforo apilado (Top 10)</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stackedBarData} layout="vertical" margin={{ left: 10, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <YAxis
                                    type="category"
                                    dataKey="name"
                                    width={150}
                                    tick={{ fill: '#cbd5e1', fontSize: 11 }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend />
                                <Bar dataKey="Verde" stackId="a" fill={SEMAFORO_COLORS.verde} radius={[0, 0, 0, 0]} />
                                <Bar dataKey="Amarillo" stackId="a" fill={SEMAFORO_COLORS.amarillo} />
                                <Bar dataKey="Rojo" stackId="a" fill={SEMAFORO_COLORS.rojo} radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* ─── Avance Físico por Dependencia (barras horizontales) ────── */}
            <Card className="card-glass border-border">
                <CardHeader>
                    <CardTitle className="text-foreground dark:text-slate-200 text-base flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-400" />
                        Avance Físico por Dependencia
                    </CardTitle>
                    <CardDescription>Promedio de avance físico reportado</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {dependencyStats.filter(d => d.avgFisico > 0).slice(0, 12).map((dep, i) => (
                            <div key={i} className="flex items-center gap-4">
                                <span className="text-xs text-slate-300 w-48 truncate flex-shrink-0" title={dep.name}>
                                    {dep.name}
                                </span>
                                <div className="flex-1">
                                    <ProgressBar
                                        value={dep.avgFisico}
                                        color={dep.avgFisico >= 70 ? '#22c55e' : dep.avgFisico >= 40 ? '#eab308' : '#ef4444'}
                                    />
                                </div>
                                <span className={`text-xs font-bold w-12 text-right ${dep.avgFisico >= 70 ? 'text-green-400' : dep.avgFisico >= 40 ? 'text-yellow-400' : 'text-red-400'
                                    }`}>
                                    {dep.avgFisico.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* ─── Tabla Ranking Completa ──────────────────────────────────── */}
            <Card className="card-glass border-border">
                <CardHeader>
                    <CardTitle className="text-foreground dark:text-slate-200 text-base">Ranking de Cumplimiento por Dependencia</CardTitle>
                    <CardDescription>Desempeño integral — Todas las dependencias</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-foreground dark:text-slate-300">#</TableHead>
                                    <TableHead className="text-foreground dark:text-slate-300">Dependencia</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Total</TableHead>
                                    <TableHead className="text-right text-green-400">Verdes</TableHead>
                                    <TableHead className="text-right text-yellow-400">Amarillos</TableHead>
                                    <TableHead className="text-right text-red-400">Rojos</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Avance Físico</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Avance Financiero</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dependencyStats.map((dep, i) => (
                                    <TableRow key={i} className="border-border hover:bg-slate-800/30 transition-colors">
                                        <TableCell className="text-muted-foreground font-mono text-xs">
                                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                                        </TableCell>
                                        <TableCell className="text-foreground dark:text-slate-300 font-medium text-sm">
                                            {dep.name}
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{dep.total}</TableCell>
                                        <TableCell className="text-right text-green-400 font-semibold">{dep.verde}</TableCell>
                                        <TableCell className="text-right text-yellow-400 font-semibold">{dep.amarillo}</TableCell>
                                        <TableCell className="text-right text-red-400 font-semibold">{dep.rojo}</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{dep.avgFisico.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right text-muted-foreground">{dep.avgFinanciero.toFixed(1)}%</TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="outline" className={`
                                                ${dep.score >= 80 ? 'text-green-400 border-green-500/50' :
                                                    dep.score >= 50 ? 'text-yellow-400 border-yellow-500/50' :
                                                        'text-red-400 border-red-500/50'}
                                            `}>
                                                {dep.score.toFixed(0)}/100
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* ─── Tabla por Instrumento ───────────────────────────────────── */}
            {instrumentStats.length > 0 && (
                <Card className="card-glass border-border">
                    <CardHeader>
                        <CardTitle className="text-foreground dark:text-slate-200 text-base">Resumen por Instrumento de Planeación</CardTitle>
                        <CardDescription>Cantidad de reportes y estado por instrumento</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-border">
                                        <TableHead className="text-foreground dark:text-slate-300">Instrumento</TableHead>
                                        <TableHead className="text-right text-foreground dark:text-slate-300">Total Reportes</TableHead>
                                        <TableHead className="text-right text-green-400">Verdes</TableHead>
                                        <TableHead className="text-right text-red-400">Rojos</TableHead>
                                        <TableHead className="text-right text-foreground dark:text-slate-300">% Cumplimiento</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {instrumentStats.map((instr, i) => {
                                        const pct = instr.total > 0 ? (instr.verde / instr.total) * 100 : 0
                                        return (
                                            <TableRow key={i} className="border-border hover:bg-slate-800/30 transition-colors">
                                                <TableCell className="text-foreground dark:text-slate-300 font-medium text-sm">
                                                    {instr.name}
                                                </TableCell>
                                                <TableCell className="text-right text-muted-foreground">{instr.total}</TableCell>
                                                <TableCell className="text-right text-green-400 font-semibold">{instr.verde}</TableCell>
                                                <TableCell className="text-right text-red-400 font-semibold">{instr.rojo}</TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className={
                                                        pct >= 70 ? 'text-green-400 border-green-500/50' :
                                                            pct >= 40 ? 'text-yellow-400 border-yellow-500/50' :
                                                                'text-red-400 border-red-500/50'
                                                    }>
                                                        {pct.toFixed(0)}%
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
