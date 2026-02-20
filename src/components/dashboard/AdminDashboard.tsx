'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, AlertTriangle, CheckCircle2, Clock } from 'lucide-react'

export function AdminDashboard() {
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
                        <div className="h-[200px] flex items-center justify-center text-slate-500 bg-white/[0.02] rounded-lg border border-dashed border-white/10 font-mono text-xs">
                            [ GRÁFICA DE BARRAS: AVANCE FÍSICO VS FINANCIERO ]
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3 card-glass border-white/5">
                    <CardHeader>
                        <CardTitle className="text-slate-200">Actividad Reciente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-start group cursor-pointer">
                                    <span className="relative flex h-2 w-2 mr-4 mt-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 group-hover:opacity-100"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                    </span>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium text-slate-300 leading-none group-hover:text-primary transition-colors">
                                            Gestión Tecnológica
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Actualizó reporte de indicadores mensual
                                        </p>
                                    </div>
                                    <div className="text-xs text-slate-500 font-mono">Hace {i * 2}h</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
