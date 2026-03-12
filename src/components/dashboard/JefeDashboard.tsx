'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ChevronRight, FileText, AlertCircle, Loader2, TrendingUp, Inbox } from 'lucide-react'
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
            if (!vigenciaActual || !profile.oficina_id) {
                setLoading(false)
                return
            }
            try {
                const [instRes, segRes, pamRes, piipRes, depRes, ofisRes, procsRes] = await Promise.all([
                    supabase.from('instrumentos').select('*').eq('activo', true),
                    supabase.from('seguimientos').select('*').eq('vigencia_id', vigenciaActual.id),
                    supabase.from('plan_accion_municipal').select('*').eq('vigencia_id', vigenciaActual.id),
                    supabase.from('piip').select('*').eq('vigencia_id', vigenciaActual.id),
                    supabase.from('dependencias').select('*'),
                    supabase.from('oficinas').select('*'),
                    supabase.from('procesos_institucionales').select('*')
                ])

                const todasDeps = depRes.data || []
                const todasOfis = ofisRes.data || []
                const todosProcs = procsRes.data || []
                
                const misDeps = getMisDependencias(profile.oficina_id, todosProcs, todasOfis, todasDeps)
                const misDepsIds = misDeps.map(d => d.id)

                if (misDepsIds.length === 0) {
                    setLoading(false)
                    return
                }

                const allInsts = instRes.data || []
                const segs = (segRes.data || []).filter(s => misDepsIds.includes(s.dependencia_id))
                const pams = (pamRes.data || []).filter(p => misDepsIds.includes(p.dependencia_id))
                const piips = (piipRes.data || []).filter(p => misDepsIds.includes(p.dependencia_id))

                let totalPoints = 0
                let greenPoints = 0
                let obsCount = 0
                const pendingList: any[] = []

                const currDate = new Date().toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })

                misDeps.forEach(dep => {
                    const instsParaDep = allInsts.filter(inst => getDependenciasParaInstrumento(inst.nombre, [dep]).length > 0)
                    
                    instsParaDep.forEach(inst => {
                        const periods = getPeriodsForFrecuencia(inst.frecuencia)
                        totalPoints += periods.length

                        periods.forEach(p => {
                            const seg = segs.find(s => s.dependencia_id === dep.id && s.instrumento_id === inst.id && s.periodo_corte === p)
                            if (seg && seg.estado_semaforo === 'verde') {
                                greenPoints++
                            } else {
                                if (seg && (seg.estado_semaforo === 'amarillo' || seg.estado_semaforo === 'rojo')) {
                                    obsCount++
                                }
                                pendingList.push({
                                    name: `[${formatDependenciaName(dep.nombre)}] ${inst.nombre}`,
                                    deadline: currDate,
                                    status: (seg && seg.estado_semaforo === 'rojo') ? 'alert' : 'pending',
                                    type: p
                                })
                            }
                        })
                    })
                })

                pams.forEach(pam => {
                    totalPoints++
                    if (pam.estado === 'verde') {
                        greenPoints++
                    } else {
                        if (pam.estado === 'amarillo' || pam.estado === 'rojo') {
                            obsCount++
                        }
                        const depObj = misDeps.find(d => d.id === pam.dependencia_id)
                        pendingList.push({
                            name: `[${formatDependenciaName(depObj?.nombre || 'PAM')}] ${pam.programa?.substring(0, 40)}`,
                            deadline: currDate,
                            status: pam.estado === 'rojo' ? 'alert' : 'pending',
                            type: 'Plan Acción'
                        })
                    }
                })

                piips.forEach(piip => {
                    totalPoints++
                    if (piip.estado === 'verde') {
                        greenPoints++
                    } else {
                        if (piip.estado === 'amarillo' || piip.estado === 'rojo') {
                            obsCount++
                        }
                        const depObj = misDeps.find(d => d.id === piip.dependencia_id)
                        pendingList.push({
                            name: `[${formatDependenciaName(depObj?.nombre || 'PIIP')}] ${piip.nombre_proyecto?.substring(0, 40)}`,
                            deadline: currDate,
                            status: piip.estado === 'rojo' ? 'alert' : 'pending',
                            type: 'Proyecto PIIP'
                        })
                    }
                })

                setData({
                    avance: totalPoints > 0 ? Math.round((greenPoints / totalPoints) * 100) : 0,
                    pendientes: pendingList,
                    reportesOk: greenPoints,
                    observaciones: obsCount
                })
            } catch (err) {
                console.error('Error fetching Jefe dashboard data:', err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [vigenciaActual, profile])


    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-gray-900 dark:text-white mb-2 font-space">
                        Hola, <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">{profile.nombre_completo?.split(' ')[0] ?? 'Usuario'}</span> 👋
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Estado de gestión para: <span className="text-blue-600 dark:text-blue-400 font-bold">{formatDependenciaName((profile.oficinas as any)?.nombre || 'Tu Dependencia')}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3 bg-white/10 dark:bg-white/5 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 shadow-lg">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                    <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500">Vigencia Actual</p>
                        <p className="text-xl font-black text-primary font-mono leading-none">{vigenciaActual?.anio || '2026'}</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Progress Card */}
                <Card className="card-glass relative overflow-hidden border-blue-500/20 bg-blue-500/5 hover:border-blue-500/40 transition-all duration-500 group shadow-xl">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp className="w-32 h-32 text-blue-500" />
                    </div>
                    <CardHeader>
                        <CardTitle className="text-xl font-bold flex items-center gap-2">
                            <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
                            Avance de Gestión
                        </CardTitle>
                        <CardDescription>Consolidado de metas físicas cumplidas</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative flex items-center justify-center">
                                <svg className="w-24 h-24 transform -rotate-90">
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200 dark:text-slate-800" />
                                    <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * data.avance) / 100} className="text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)] transition-all duration-1000 ease-out" />
                                </svg>
                                <span className="absolute text-2xl font-black font-space">{data.avance}%</span>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-slate-500 uppercase tracking-tighter">Instrumentos</p>
                                <p className="text-xs text-slate-400">Progreso real vs proyectado</p>
                            </div>
                        </div>
                        <Link href="/mis-instrumentos" className="w-full">
                            <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/20 group-hover:scale-[1.02] transition-transform">
                                REPORTAR AVANCES
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Pending Items */}
                <Card className="card-glass col-span-1 lg:col-span-2 border-slate-200 dark:border-white/10 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50 dark:bg-white/5 border-b border-border">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-lg font-bold">Pendientes por Reportar</CardTitle>
                                <CardDescription>Actividades sin meta verde en el actual periodo</CardDescription>
                            </div>
                            <div className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-black">
                                {data.pendientes.length} ALERTA(S)
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-border">
                                {data.pendientes.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-50">
                                        <Inbox className="w-12 h-12" />
                                        <p className="text-sm font-medium">¡Todo está al día!</p>
                                    </div>
                                ) : (
                                    data.pendientes.map((item, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-all group">
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1.5 w-3 h-3 rounded-full ${item.status === 'alert' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'} shadow-[0_0_8px_currentColor]`} />
                                                <div>
                                                    <span className="font-bold text-gray-900 dark:text-white block group-hover:text-blue-500 transition-colors text-sm">{item.name}</span>
                                                    <div className="flex gap-2 mt-1">
                                                        <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">{item.type}</span>
                                                        <span className="text-[10px] font-bold text-red-500 uppercase">{item.status === 'alert' ? '¡Muy Atrazado!' : 'Pendiente'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Corte</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-slate-300 font-mono italic">
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
            <div className="grid gap-6 grid-cols-2 lg:grid-cols-4">
                <div className="p-6 rounded-3xl bg-green-500/10 border border-green-500/20 flex items-center gap-4 hover:scale-[1.05] transition-transform duration-300 shadow-lg shadow-green-500/5">
                    <div className="bg-green-500 p-3 rounded-2xl shadow-lg shadow-green-500/30">
                        <CheckCircle2 className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white font-space leading-none mb-1">{data.reportesOk}</div>
                        <div className="text-[10px] text-green-600 dark:text-green-500 uppercase font-black tracking-widest">Reportes OK</div>
                    </div>
                </div>
                
                <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-4 hover:scale-[1.05] transition-transform duration-300 shadow-lg shadow-amber-500/5">
                    <div className="bg-amber-500 p-3 rounded-2xl shadow-lg shadow-amber-500/30">
                        <AlertCircle className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <div className="text-3xl font-black text-gray-900 dark:text-white font-space leading-none mb-1">{data.observaciones}</div>
                        <div className="text-[10px] text-amber-600 dark:text-amber-500 uppercase font-black tracking-widest">Observaciones</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
