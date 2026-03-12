'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { getDependenciasParaInstrumento, formatDependenciaName } from '@/lib/responsabilidades'

export function AdminDashboard() {
    const supabase = createClient()
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [actividadReciente, setActividadReciente] = useState<any[]>([])
    const [stats, setStats] = useState({
        cumplimientoGlobal: 0,
        instrumentosDia: 0,
        totalInstrumentos: 0,
        pendientesRevision: 0,
        alertasCriticas: 0
    })
    const [chartData, setChartData] = useState<any[]>([])

    useEffect(() => {
        const fetchActividad = async () => {
            const { data } = await supabase
                .from('perfiles')
                .select('nombre_completo, cargo, created_at, oficinas(nombre)')
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) {
                setActividadReciente(data.map(p => ({
                    oficina: p.oficinas ? formatDependenciaName((p.oficinas as any).nombre) : 'Sin Oficina',
                    accion: `Ingreso: ${p.nombre_completo}`,
                    fecha: p.created_at
                })))
            }
        }
        fetchActividad()
    }, [supabase])

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!vigenciaActual) return
            setLoading(true)

            try {
                const [instRes, segRes, ofisRes, depsRes] = await Promise.all([
                    supabase.from('instrumentos').select('*').eq('activo', true),
                    supabase.from('seguimientos').select('*').eq('vigencia_id', vigenciaActual.id),
                    supabase.from('oficinas').select('id, nombre, abreviatura').eq('activa', true),
                    supabase.from('dependencias').select('*')
                ])

                const instrumentos = instRes.data || []
                const seguimientos = segRes.data || []
                const oficinas = ofisRes.data || []
                const dependencias = depsRes.data || []

                let totalExpectedReports = 0
                let reportsCompleted = 0
                let itemsReviewPending = 0
                let criticalAlertsCount = 0

                const getPeriodsCount = (frecuencia: string) => {
                    switch (frecuencia) {
                        case 'mensual': return 12
                        case 'trimestral': return 4
                        case 'cuatrimestral': return 3
                        case 'semestral': return 2
                        case 'anual': return 1
                        default: return 1
                    }
                }

                dependencias.forEach(dep => {
                    const instsParaDep = instrumentos.filter(inst => 
                        getDependenciasParaInstrumento(inst.nombre, [dep]).length > 0
                    )
                    
                    instsParaDep.forEach(inst => {
                        const periodsCount = getPeriodsCount(inst.frecuencia)
                        totalExpectedReports += periodsCount
                        const segsForPair = seguimientos.filter(s => s.dependencia_id === dep.id && s.instrumento_id === inst.id)
                        reportsCompleted += segsForPair.filter(s => s.estado_semaforo === 'verde').length
                        itemsReviewPending += segsForPair.filter(s => s.estado_semaforo === 'amarillo').length
                        criticalAlertsCount += segsForPair.filter(s => s.estado_semaforo === 'rojo').length
                    })
                })

                const oficinaStats = oficinas.map(ofi => {
                    const depsOfOfi = dependencias.filter(d => 
                        d.nombre.toUpperCase().trim().includes(ofi.nombre.toUpperCase().trim()) ||
                        ofi.nombre.toUpperCase().trim().includes(d.nombre.toUpperCase().trim())
                    )

                    const ofiSegs = seguimientos.filter(s => depsOfOfi.some(d => d.id === s.dependencia_id))
                    
                    let ofiTotalPoints = 0
                    let ofiGreenPoints = 0
                    let ofiFinancieroSum = 0
                    let ofiFinancieroCount = 0

                    depsOfOfi.forEach(dep => {
                        const instsParaDep = instrumentos.filter(inst => getDependenciasParaInstrumento(inst.nombre, [dep]).length > 0)
                        instsParaDep.forEach(inst => {
                            ofiTotalPoints += getPeriodsCount(inst.frecuencia)
                        })
                    })

                    ofiSegs.forEach(s => {
                        if (s.estado_semaforo === 'verde') ofiGreenPoints++
                        if (s.porcentaje_financiero !== null) {
                            ofiFinancieroSum += s.porcentaje_financiero
                            ofiFinancieroCount++
                        }
                    })

                    const fisico = ofiTotalPoints > 0 ? Math.round((ofiGreenPoints / ofiTotalPoints) * 100) : 0
                    const financiero = ofiFinancieroCount > 0 ? Math.round(ofiFinancieroSum / ofiFinancieroCount) : 0

                    return {
                        name: ofi.abreviatura || ofi.nombre.substring(0, 10),
                        fisico,
                        financiero
                    }
                }).filter(o => o.fisico > 0 || o.financiero > 0)

                setStats({
                    cumplimientoGlobal: totalExpectedReports > 0 ? Math.round((reportsCompleted / totalExpectedReports) * 1000) / 10 : 0,
                    instrumentosDia: reportsCompleted,
                    totalInstrumentos: totalExpectedReports,
                    pendientesRevision: itemsReviewPending,
                    alertasCriticas: criticalAlertsCount
                })

                setChartData(oficinaStats)

            } catch (error) {
                console.error('Error fetching dashboard stats:', error)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [supabase, vigenciaActual])

    if (loading) {
        return (
            <div className="flex h-[40vh] items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-glass border-blue-500/30 bg-blue-500/5 hover:border-blue-500/50 transition-all hover:scale-[1.02] shadow-lg shadow-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Cumplimiento Global
                        </CardTitle>
                        <Activity className="h-5 w-5 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-gray-900 dark:text-white font-space">{stats.cumplimientoGlobal}%</div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Promedio de avance físico total</p>
                    </CardContent>
                </Card>

                <Card className="card-glass border-green-500/30 bg-green-500/5 hover:border-green-500/50 transition-all hover:scale-[1.02] shadow-lg shadow-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">
                            Instrumentos al día
                        </CardTitle>
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-gray-900 dark:text-white font-space">{stats.instrumentosDia}</div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Reportes con meta <span className="text-green-500 font-bold">CUMPLIDA</span></p>
                    </CardContent>
                </Card>

                <Card className="card-glass border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-500/50 transition-all hover:scale-[1.02] shadow-lg shadow-yellow-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-yellow-600 dark:text-yellow-400 uppercase tracking-wider">
                            Pendientes Revisión
                        </CardTitle>
                        <Clock className="h-5 w-5 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-gray-900 dark:text-white font-space">{stats.pendientesRevision}</div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Alertas en estado <span className="text-yellow-500 font-bold">PREVENTIVO</span></p>
                    </CardContent>
                </Card>

                <Card className="card-glass border-red-500/30 bg-red-500/5 hover:border-red-500/50 transition-all hover:scale-[1.02] shadow-lg shadow-red-500/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                            Alertas Críticas
                        </CardTitle>
                        <AlertTriangle className="h-5 w-5 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-black text-gray-900 dark:text-white font-space">{stats.alertasCriticas}</div>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">Reportes con meta <span className="text-red-500 font-bold">CRÍTICA</span></p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 card-glass border-border overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-border">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-blue-500" />
                            Resumen de Ejecución por Oficinas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                                    barSize={20}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:hidden" />
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" className="hidden dark:block" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
                                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                                    <Tooltip
                                        cursor={{ fill: 'currentColor', opacity: 0.1 }}
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                            borderColor: 'rgba(255, 255, 255, 0.1)',
                                            borderRadius: '12px',
                                            color: '#fff',
                                            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                                        }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '30px' }} />
                                    <Bar dataKey="fisico" name="Avance Físico" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                                    <Bar dataKey="financiero" name="Avance Financiero" fill="#10b981" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3 card-glass border-border overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-border">
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-amber-500" />
                            Actividad Reciente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-6">
                            {actividadReciente.length > 0 ? actividadReciente.map((item, i) => {
                                const dateObj = new Date(item.fecha)
                                const dateStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                return (
                                    <div key={i} className="flex items-start group">
                                        <div className="relative flex flex-col items-center mr-4">
                                            <div className="h-full w-px bg-border absolute top-4' group-last:hidden" />
                                            <span className="relative flex h-3 w-3 shrink-0">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-20"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500 border-2 border-slate-900 shadow-sm"></span>
                                            </span>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate group-hover:text-blue-500 transition-colors">
                                                    {item.oficina}
                                                </p>
                                                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-500 font-mono">
                                                    {dateStr}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground leading-relaxed italic">
                                                {item.accion}
                                            </p>
                                        </div>
                                    </div>
                                )
                            }) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No hay actividad reciente.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
