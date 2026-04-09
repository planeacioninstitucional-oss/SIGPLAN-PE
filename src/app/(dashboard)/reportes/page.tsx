'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, TrendingUp, AlertTriangle, CheckCircle2, Bot } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const COLORS = ['#22c55e', '#eab308', '#ef4444', '#94a3b8'] // Verde, Amarillo, Rojo, Gris

export default function ReportesPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [loadingAI, setLoadingAI] = useState(false)
    const [aiSummary, setAiSummary] = useState<string | null>(null)
    const [stats, setStats] = useState({
        total: 0,
        verde: 0,
        amarillo: 0,
        rojo: 0,
        gris: 0,
        promedioFisico: 0,
        promedioFinanciero: 0
    })
    const [dependencyStats, setDependencyStats] = useState<any[]>([])

    const supabase = createClient()

    useEffect(() => {
        if (!vigenciaActual) return
        fetchStats()
    }, [vigenciaActual])

    const fetchStats = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            // Fetch all seguimientos for current vigencia
            const { data: seguimientos } = await supabase
                .from('seguimientos')
                .select(`
            estado_semaforo,
            porcentaje_fisico,
            porcentaje_financiero,
            dependencias(nombre)
        `)
                .eq('vigencia_id', vigenciaActual.id)

            if (!seguimientos) return

            // Global Stats
            let verde = 0, amarillo = 0, rojo = 0, gris = 0
            let sumFisico = 0, sumFinanciero = 0, countPercents = 0

            // Dependency grouping
            const depMap = new Map<string, { name: string, verde: number, amarillo: number, rojo: number, total: number }>()

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

                const deps = s.dependencias as any
                const depName = (Array.isArray(deps) ? deps[0]?.nombre : deps?.nombre) || 'Desconocida'
                if (!depMap.has(depName)) {
                    depMap.set(depName, { name: depName, verde: 0, amarillo: 0, rojo: 0, total: 0 })
                }
                const stats = depMap.get(depName)!
                if (s.estado_semaforo === 'verde') stats.verde++
                if (s.estado_semaforo === 'amarillo') stats.amarillo++
                if (s.estado_semaforo === 'rojo') stats.rojo++
                stats.total++
            })

            setStats({
                total: seguimientos.length,
                verde,
                amarillo,
                rojo,
                gris,
                promedioFisico: countPercents ? sumFisico / countPercents : 0,
                promedioFinanciero: countPercents ? sumFinanciero / countPercents : 0
            })

            // Calculate efficiency score per dependency (simple formula)
            const depArray = Array.from(depMap.values()).map(d => ({
                ...d,
                score: d.total > 0 ? ((d.verde * 1 + d.amarillo * 0.5) / d.total) * 100 : 0
            })).sort((a, b) => b.score - a.score)

            setDependencyStats(depArray)

        } catch (error) {
            toast.error('Error cargando estadísticas')
        } finally {
            setLoading(false)
        }
    }

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
            toast.error('Error generando resumen', { 
                description: error.message || 'Verifique configuración de API Key' 
            })
        } finally {
            setLoadingAI(false)
        }
    }

    const pieData = [
        { name: 'Cumplido', value: stats.verde },
        { name: 'Alerta', value: stats.amarillo },
        { name: 'Crítico', value: stats.rojo },
        { name: 'Sin Dato', value: stats.gris },
    ]

    if (!vigenciaActual) return <div className="p-8 text-center text-slate-400">Seleccione una vigencia</div>

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-white">Reportes Gerenciales</h1>
                    <p className="text-muted-foreground">Visión estratégica de la vigencia {vigenciaActual.anio}</p>
                </div>
                <Button
                    onClick={generateAiSummary}
                    className="bg-purple-600 hover:bg-purple-500 border border-purple-400/30 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
                    disabled={loadingAI}
                >
                    {loadingAI ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
                    Generar Análisis IA
                </Button>
            </div>

            {/* AI Summary Section */}
            {aiSummary && (
                <Card className="card-glass border-purple-500/50 bg-purple-950/10">
                    <CardHeader>
                        <CardTitle className="flex items-center text-purple-200">
                            <Bot className="mr-2 h-5 w-5 text-purple-400" />
                            Análisis Ejecutivo (IA)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-foreground dark:text-slate-300 prose prose-invert mx-auto max-w-none">
                        <div className="whitespace-pre-line">{aiSummary}</div>
                    </CardContent>
                </Card>
            )}

            {/* Global KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="card-glass border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avance Físico Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground dark:text-white">{stats.promedioFisico.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Promedio ponderado</p>
                    </CardContent>
                </Card>
                <Card className="card-glass border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Avance Financiero</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground dark:text-white">{stats.promedioFinanciero.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Ejecución presupuestal</p>
                    </CardContent>
                </Card>
                <Card className="card-glass border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Instrumentos Reportados</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-foreground dark:text-white">{stats.total}</div>
                        <p className="text-xs text-muted-foreground">Total monitoreado</p>
                    </CardContent>
                </Card>
                <Card className="card-glass border-border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Estado Crítico</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-400">{stats.rojo}</div>
                        <p className="text-xs text-muted-foreground">Alertas activas</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart: Semáforo Distribution */}
                <Card className="card-glass border-border lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-foreground dark:text-slate-200">Estado General</CardTitle>
                        <CardDescription>Distribución de cumplimiento en instrumentos</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                                    itemStyle={{ color: '#e2e8f0' }}
                                />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card className="card-glass border-border lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-foreground dark:text-slate-200">Ranking de Cumplimiento</CardTitle>
                        <CardDescription>Desempeño por dependencia (Score de Eficiencia)</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow className="border-border">
                                    <TableHead className="text-foreground dark:text-slate-300">Dependencia</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Entregas</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Verdes</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Rojos</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Score</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dependencyStats.slice(0, 5).map((dep, i) => (
                                    <TableRow key={i} className="border-border">
                                        <TableCell className="text-foreground dark:text-slate-300 font-medium">
                                            <div className="flex items-center gap-2">
                                                {i === 0 && <span className="text-yellow-500">🥇</span>}
                                                {i === 1 && <span className="text-slate-400">🥈</span>}
                                                {i === 2 && <span className="text-amber-700">🥉</span>}
                                                {dep.name}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground">{dep.total}</TableCell>
                                        <TableCell className="text-right text-green-400">{dep.verde}</TableCell>
                                        <TableCell className="text-right text-red-400">{dep.rojo}</TableCell>
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
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
