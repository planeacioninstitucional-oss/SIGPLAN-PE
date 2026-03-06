'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle2, Clock, BarChart3, LineChart as LineChartIcon } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { createClient } from '@/lib/supabase/client'

export function AdminDashboard() {
    const supabase = createClient()
    const [actividadReciente, setActividadReciente] = useState<any[]>([])

    useEffect(() => {
        const fetchActividad = async () => {
            // Buscamos perfiles o seguimientos recientes de manera genérica
            const { data } = await supabase
                .from('perfiles')
                .select('nombre_completo, cargo, created_at, oficinas(nombre)')
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) {
                setActividadReciente(data.map(p => ({
                    oficina: p.oficinas ? (p.oficinas as any).nombre : 'Sin Oficina',
                    accion: `Nuevo ingreso: ${p.nombre_completo} (${p.cargo})`,
                    fecha: p.created_at
                })))
            }
        }
        fetchActividad()
    }, [supabase])

    // Mock data para reflejar el "Avance Físico vs Financiero"
    const chartData = [
        { name: 'OAPI', fisico: 85, financiero: 75 },
        { name: 'GG', fisico: 92, financiero: 88 },
        { name: 'OCPC', fisico: 60, financiero: 50 },
        { name: 'OGTTD', fisico: 78, financiero: 82 },
        { name: 'DOC', fisico: 95, financiero: 90 },
        { name: 'DPSF', fisico: 88, financiero: 85 },
        { name: 'SG', fisico: 70, financiero: 65 },
        { name: 'DSA', fisico: 82, financiero: 78 },
        { name: 'DF', fisico: 90, financiero: 95 },
    ]

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="card-glass border-primary/20 hover:border-primary/50 transition-all hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Cumplimiento Global
                        </CardTitle>
                        <Activity className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-space">85.4%</div>
                        <p className="text-xs text-slate-400 mt-1">
                            <span className="text-green-400 font-bold">+2.1%</span> vs mes anterior
                        </p>
                    </CardContent>
                </Card>
                <Card className="card-glass border-green-500/20 hover:border-green-500/50 transition-all hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Instrumentos al día
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-space">142/156</div>
                        <p className="text-xs text-slate-400 mt-1">
                            <span className="text-green-400 font-bold">91%</span> de reportes entregados
                        </p>
                    </CardContent>
                </Card>
                <Card className="card-glass border-yellow-500/20 hover:border-yellow-500/50 transition-all hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Pendientes Revisión
                        </CardTitle>
                        <Clock className="h-4 w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-space">14</div>
                        <p className="text-xs text-slate-400 mt-1">
                            Requieren evaluación
                        </p>
                    </CardContent>
                </Card>
                <Card className="card-glass border-red-500/20 hover:border-red-500/50 transition-all hover:scale-[1.02]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-slate-200">
                            Alertas Críticas
                        </CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-white font-space">3</div>
                        <p className="text-xs text-slate-400 mt-1">
                            Dependencias con bajo desempeño
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4 card-glass border-white/5">
                    <CardHeader>
                        <CardTitle className="text-slate-200">Resumen de Ejecución</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                    barSize={12}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                    />
                                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    <Bar dataKey="fisico" name="Avance Físico %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="financiero" name="Avance Financiero %" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 card-glass border-white/5">
                    <CardHeader>
                        <CardTitle className="text-slate-200">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {actividadReciente.length > 0 ? actividadReciente.map((item, i) => {
                                const dateObj = new Date(item.fecha)
                                const dateStr = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                return (
                                    <div key={i} className="flex items-start group cursor-pointer">
                                        <span className="relative flex h-2 w-2 mr-4 mt-2 shrink-0">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75 group-hover:opacity-100"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                                        </span>
                                        <div className="flex-1 space-y-1 min-w-0 pr-2">
                                            <p className="text-sm font-medium text-slate-300 truncate group-hover:text-blue-400 transition-colors">
                                                {item.oficina}
                                            </p>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-tight">
                                                {item.accion}
                                            </p>
                                        </div>
                                        <div className="text-[10px] text-slate-600 font-mono shrink-0 whitespace-nowrap mt-1">{dateStr}</div>
                                    </div>
                                )
                            }) : (
                                <p className="text-sm text-slate-500 text-center py-4">No hay actividad reciente registrada.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
