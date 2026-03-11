'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronRight, FileText, AlertCircle, Loader2 } from 'lucide-react'
import type { Perfil } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import Link from 'next/link'
import { getDependenciasParaInstrumento, getMisDependencias, formatDependenciaName } from '@/lib/responsabilidades'

function getPeriodsForFrecuencia(frecuencia: string): string[] {
    switch (frecuencia) {
        case 'mensual': return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        case 'trimestral': return ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
        case 'cuatrimestral': return ['Cuatrimestre 1', 'Cuatrimestre 2', 'Cuatrimestre 3']
        case 'semestral': return ['Semestre 1', 'Semestre 2']
        case 'anual': return ['Anual']
        default: return ['Período 1']
    }
}

export function JefeDashboard({ profile }: { profile: Perfil }) {
    const { vigenciaActual } = useVigenciaStore()
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        avance: 0,
        pendientes: [] as any[],
        reportesOk: 0,
        observaciones: 0
    })

    useEffect(() => {
        const fetchData = async () => {
            if (!vigenciaActual || !(profile as any).dependencia_id) {
                setLoading(false)
                return
            }

            const { data: allDeps } = await supabase.from('dependencias').select('*')
            const misDeps = allDeps ? getMisDependencias((profile as any).dependencia_id, allDeps) : []
            const misDepsIds = misDeps.map(d => d.id)

            if (misDepsIds.length === 0) {
                setLoading(false)
                return
            }

            const [instRes, segRes] = await Promise.all([
                supabase.from('instrumentos').select('*').eq('activo', true),
                supabase.from('seguimientos')
                    .select('*')
                    .eq('vigencia_id', vigenciaActual.id)
                    .in('dependencia_id', misDepsIds)
            ])

            const allInsts = instRes.data || []
            const segs = segRes.data || []

            let totalPeriods = 0
            let greenPeriods = 0
            let obsCount = 0
            const pendingList: any[] = []

            const currDate = new Date().toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })

            misDeps.forEach(dep => {
                const instsParaDep = allInsts.filter(inst => getDependenciasParaInstrumento(inst.nombre, [dep]).length > 0)
                
                instsParaDep.forEach(inst => {
                    const periods = getPeriodsForFrecuencia(inst.frecuencia)
                    totalPeriods += periods.length

                    periods.forEach(p => {
                        const seg = segs.find(s => s.dependencia_id === dep.id && s.instrumento_id === inst.id && s.periodo_corte === p)
                        if (seg && seg.estado_semaforo === 'verde') {
                            greenPeriods++
                        } else {
                            if (seg && (seg.estado_semaforo === 'amarillo' || seg.estado_semaforo === 'rojo')) {
                                obsCount++
                            }
                            pendingList.push({
                                name: `[${formatDependenciaName(dep.nombre)}] ${inst.nombre}`,
                                deadline: currDate,
                                status: 'pending',
                                type: p
                            })
                        }
                    })
                })
            })

            setData({
                avance: totalPeriods > 0 ? Math.round((greenPeriods / totalPeriods) * 100) : 0,
                pendientes: pendingList,
                reportesOk: greenPeriods,
                observaciones: obsCount
            })
            setLoading(false)
        }
        fetchData()
    }, [vigenciaActual, profile])


    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-1 font-space">
                        Hola, <span className="text-primary">{profile.nombre_completo?.split(' ')[0] ?? 'Usuario'}</span> 👋
                    </h2>
                    <p className="text-gray-500 dark:text-slate-400">
                        Aquí tienes el estado de tu gestión para <span className="font-semibold text-gray-700 dark:text-slate-300">{formatDependenciaName((profile.oficinas as any)?.nombre || profile.cargo || 'tu dependencia')}</span>.
                    </p>
                </div>
                <div className="text-right hidden md:block">
                    <p className="text-base text-gray-500 dark:text-slate-300">Vigencia Actual</p>
                    <p className="text-2xl font-bold text-primary font-mono">2026</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Progress Card */}
                <Card className="card-glass relative overflow-hidden ring-1 ring-gray-200 dark:ring-white/10 hover:ring-primary/50 transition-all duration-300 group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <FileText className="w-32 h-32 text-primary" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-slate-200 flex items-center gap-2">
                            <span className="w-2 h-8 bg-primary rounded-full"></span>
                            Avance General
                        </CardTitle>
                        <CardDescription className="text-gray-500 dark:text-slate-400">Progreso total de instrumentos en la vigencia</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-5xl font-bold text-gray-900 dark:text-white font-space">{data.avance}%</span>
                            <span className="text-base text-gray-500 dark:text-slate-200 uppercase tracking-wider">completado</span>
                        </div>
                        <div className="h-3 w-full bg-gray-200 dark:bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm border border-gray-300 dark:border-white/5">
                            <div className="h-full bg-primary rounded-full shadow-[0_0_15px_hsl(var(--primary)/0.5)] transition-all duration-1000" style={{ width: `${data.avance}%` }} />
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Link href="/mis-instrumentos" className="w-full">
                                <Button size="sm" className="w-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    IR A MIS INSTRUMENTOS
                                    <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Pending Items */}
                <Card className="card-glass col-span-1 lg:col-span-2 ring-1 ring-gray-200 dark:ring-white/10">
                    <CardHeader>
                        <CardTitle className="text-gray-900 dark:text-slate-200">Pendientes por Reportar ({data.pendientes.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                {data.pendientes.length === 0 ? (
                                    <p className="text-gray-500 dark:text-slate-400 py-4 col-span-2 text-center text-sm">No tienes reportes pendientes. ¡Excelente trabajo!</p>
                                ) : (
                                    data.pendientes.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/5 hover:bg-blue-50 dark:hover:bg-white/[0.08] hover:border-primary/30 transition-all cursor-pointer group">
                                            <div className="flex items-start gap-3 w-2/3">
                                                <div className={`mt-1.5 w-2 flex-shrink-0 h-2 rounded-full ${item.status === 'pending' ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.4)]' : 'bg-slate-500'}`} />
                                                <div className="overflow-hidden">
                                                    <span className="font-medium text-gray-900 dark:text-white block group-hover:text-primary transition-colors text-sm truncate" title={item.name}>{item.name}</span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-300 uppercase tracking-wider">{item.type}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                <span className={`text-xs font-mono px-2 py-1 rounded ${item.status === 'pending' ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border border-yellow-500/20' : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-200'}`}>
                                                    {item.deadline}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
                <div className="p-4 rounded-xl bg-green-50 dark:bg-green-500/5 border border-green-200 dark:border-green-500/20 flex flex-col items-center justify-center text-center gap-2 hover:bg-green-100 dark:hover:bg-green-500/10 transition-colors">
                    <CheckCircle2 className="w-8 h-8 text-green-500 dark:text-green-400 mb-2" />
                    <div>
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 font-space">{data.reportesOk}</div>
                        <div className="text-xs text-green-600/80 dark:text-green-400/80 uppercase tracking-widest font-bold">Reportes OK</div>
                    </div>
                </div>
                <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-500/5 border border-yellow-200 dark:border-yellow-500/20 flex flex-col items-center justify-center text-center gap-2 hover:bg-yellow-100 dark:hover:bg-yellow-500/10 transition-colors">
                    <AlertCircle className="w-8 h-8 text-yellow-500 dark:text-yellow-400 mb-2" />
                    <div>
                        <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 font-space">{data.observaciones}</div>
                        <div className="text-xs text-yellow-600/80 dark:text-yellow-400/80 uppercase tracking-widest font-bold">Observaciones</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
