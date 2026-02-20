'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronRight, FileText, AlertCircle } from 'lucide-react'
import type { Perfil } from '@/types/database'

export function JefeDashboard({ profile }: { profile: Perfil }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-white mb-1 font-space">
                        Hola, <span className="text-primary">{profile.nombre_completo.split(' ')[0]}</span> 👋
                    </h2>
                    <p className="text-slate-400">
                        Aquí tienes el estado de tu gestión para <span className="font-semibold text-slate-300">{profile.dependencias?.nombre || 'tu dependencia'}</span>.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-sm text-slate-500">Vigencia Actual</p>
                    <p className="text-xl font-bold text-primary font-mono">2026</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Progress Card */}
                <Card className="card-glass relative overflow-hidden ring-1 ring-white/10 hover:ring-primary/50 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText className="w-32 h-32 text-primary" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            Avance Mensual
                        </CardTitle>
                        <CardDescription className="text-slate-400">Febrero 2026</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-5xl font-bold text-white font-space">65%</span>
                            <span className="text-sm text-slate-400 uppercase tracking-wider">completado</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                            <div className="h-full bg-primary w-[65%] rounded-full shadow-[0_0_15px_hsl(var(--primary)/0.5)] animate-in slide-in-from-left duration-1000" />
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Button size="sm" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                Continuar Reporte
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Items */}
                <Card className="card-glass col-span-1 lg:col-span-2 ring-1 ring-white/10">
                    <CardHeader>
                        <CardTitle className="text-slate-200">Pendientes por Reportar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                            {[
                                { name: 'Plan de Acción Institucional', deadline: '28 Feb', status: 'pending', type: 'PAI' },
                                { name: 'Materialización de Riesgos SARO', deadline: '28 Feb', status: 'pending', type: 'Risk' },
                                { name: 'Indicadores de Gestión', deadline: '5 Mar', status: 'upcoming', type: 'KPI' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-primary/30 transition-all cursor-pointer group">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-1 w-2.5 h-2.5 rounded-full ${item.status === 'pending' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-slate-500'}`} />
                                        <div>
                                            <span className="font-medium text-slate-200 block group-hover:text-primary transition-colors">{item.name}</span>
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">{item.type}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span className={`text-xs font-mono px-2 py-0.5 rounded ${item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                            {item.deadline}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/20 flex flex-col items-center justify-center text-center gap-2 hover:bg-green-500/10 transition-colors">
                    <CheckCircle2 className="w-8 h-8 text-green-400 mb-2" />
                    <div>
                        <div className="text-3xl font-bold text-green-400 font-space">12</div>
                        <div className="text-xs text-green-400/80 uppercase tracking-widest font-bold">Reportes OK</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20 flex flex-col items-center justify-center text-center gap-2 hover:bg-yellow-500/10 transition-colors">
                    <AlertCircle className="w-8 h-8 text-yellow-400 mb-2" />
                    <div>
                        <div className="text-3xl font-bold text-yellow-400 font-space">2</div>
                        <div className="text-xs text-yellow-400/80 uppercase tracking-widest font-bold">Observaciones</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
