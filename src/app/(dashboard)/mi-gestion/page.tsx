'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, FileText, CheckCircle2, Layout, FileCheck } from 'lucide-react'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'
import { SeguimientoDialog } from '@/components/seguimientos/SeguimientoDialog'
import type { Instrumento, Seguimiento, Dependencia, RolUsuario } from '@/types/database'
import { toast } from 'sonner'
import { getMisDependencias, getDependenciasParaInstrumento } from '@/lib/responsabilidades'

export default function MiGestionPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, oficina_id: string } | null>(null)
    const [misDependencias, setMisDependencias] = useState<Dependencia[]>([])

    // Data
    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<{
        dependencia: Dependencia,
        instrumento: Instrumento,
        periodo: string,
        seguimiento: Seguimiento | null
    } | null>(null)

    const supabase = createClient()

    // 1. Load User & Dependencias
    const loadInitialData = useCallback(async () => {
        setLoading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get Profile
            const { data: profile } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile && profile.oficina_id) {
                setUserProfile(profile as any)

                // Fetch all context for mapping
                const [procsRes, ofisRes, depsRes] = await Promise.all([
                    supabase.from('procesos_institucionales').select('*'),
                    supabase.from('oficinas').select('*'),
                    supabase.from('dependencias').select('*')
                ])

                const todasDeps = depsRes.data || []
                const mappedDeps = getMisDependencias(profile.oficina_id, procsRes.data || [], ofisRes.data || [], todasDeps)
                setMisDependencias(mappedDeps)
            }
        } catch (error) {
            console.error('Error in loadInitialData:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        loadInitialData()
    }, [loadInitialData])

    // 2. Load Instruments & Seguimientos
    useEffect(() => {
        if (misDependencias.length === 0 || !vigenciaActual) return

        const fetchData = async () => {
            const depIds = misDependencias.map(d => d.id)
            try {
                // Fetch Instruments for this Vigencia
                const { data: insts } = await supabase
                    .from('instrumentos')
                    .select('*')
                    .eq('activo', true)
                    .order('nombre')

                if (insts) setInstrumentos(insts)

                // Fetch Seguimientos for my dependencias
                const { data: segs } = await supabase
                    .from('seguimientos')
                    .select('*')
                    .eq('vigencia_id', vigenciaActual.id)
                    .in('dependencia_id', depIds)

                if (segs) setSeguimientos(segs)

            } catch (error) {
                toast.error('Error cargando seguimientos')
            }
        }
        fetchData()
    }, [misDependencias, vigenciaActual])

    const handleOpenDialog = (dependencia: Dependencia, instrumento: Instrumento, periodo: string) => {
        if (!['super_admin', 'equipo_planeacion', 'jefe_oficina'].includes(userProfile?.rol || '')) {
            toast.error('Solo tienes permisos de visualización.')
            return
        }

        const seguimiento = seguimientos.find(s =>
            s.dependencia_id === dependencia.id &&
            s.instrumento_id === instrumento.id &&
            s.periodo_corte === periodo
        ) || null

        setSelectedItem({
            dependencia,
            instrumento,
            periodo,
            seguimiento
        })
        setDialogOpen(true)
    }

    const refreshData = async () => {
        if (misDependencias.length === 0 || !vigenciaActual) return
        const depIds = misDependencias.map(d => d.id)
        const { data: segs } = await supabase
            .from('seguimientos')
            .select('*')
            .in('dependencia_id', depIds)
            .eq('vigencia_id', vigenciaActual.id)
        if (segs) setSeguimientos(segs)
    }

    const getPeriodsForInstrument = (instrumento: Instrumento) => {
        if (instrumento.frecuencia === 'trimestral') return ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
        if (instrumento.frecuencia === 'cuatrimestral') return ['Cuatrimestre 1', 'Cuatrimestre 2', 'Cuatrimestre 3']
        if (instrumento.frecuencia === 'semestral') return ['Semestre 1', 'Semestre 2']
        if (instrumento.frecuencia === 'anual') return ['Anual']
        return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    }

    const renderInstrumentCard = (inst: Instrumento, dep: Dependencia) => {
        const periods = getPeriodsForInstrument(inst)

        return (
            <Card key={`${dep.id}-${inst.id}`} className="card-glass border-slate-800 mb-6 bg-slate-900/20">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between gap-2 text-base text-slate-200">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400" />
                            {inst.nombre}
                        </div>
                        <span className="text-[10px] text-slate-500 uppercase font-bold px-2 py-0.5 bg-slate-800 rounded">
                            {dep.nombre}
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-3">
                        {periods.map(period => {
                            const seg = seguimientos.find(s => 
                                s.dependencia_id === dep.id && 
                                s.instrumento_id === inst.id && 
                                s.periodo_corte === period
                            )
                            const status = seg?.estado_semaforo || 'gris'

                            return (
                                <div
                                    key={period}
                                    onClick={() => handleOpenDialog(dep, inst, period)}
                                    className="flex flex-col items-center justify-center p-2 rounded-lg border border-slate-800 bg-slate-900/40 hover:bg-slate-800 transition-all cursor-pointer group w-20"
                                >
                                    <span className="text-[10px] font-medium text-slate-500 mb-1.5 truncate w-full text-center">{period}</span>
                                    <SemaforoCell estado={status} className="w-7 h-7 group-hover:scale-110 transition-transform" />
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center h-[50vh] gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-slate-500 text-sm">Cargando tu gestión...</p>
            </div>
        )
    }

    if (misDependencias.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] gap-4 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center">
                    <Layout className="w-8 h-8 text-slate-600" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-lg">No tienes una oficina asignada</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">Contacta al administrador para que tu perfil sea vinculado a una oficina y sus procesos.</p>
                </div>
            </div>
        )
    }

    const monthly = instrumentos.filter(i => i.frecuencia === 'mensual')
    const quarterly = instrumentos.filter(i => i.frecuencia === 'trimestral' || i.frecuencia === 'cuatrimestral')
    const annual = instrumentos.filter(i => i.frecuencia === 'semestral' || i.frecuencia === 'anual')

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Layout className="w-8 h-8 text-blue-500" />
                        Mi Gestión
                    </h1>
                    <p className="text-slate-400">Resumen de procesos y seguimientos asignados</p>
                </div>
            </div>

            <Tabs defaultValue="mensual" className="w-full">
                <TabsList className="mb-6 bg-slate-900/50 border border-slate-800 p-1">
                    <TabsTrigger value="mensual" className="data-[state=active]:bg-blue-600">Mensuales</TabsTrigger>
                    <TabsTrigger value="trimestral" className="data-[state=active]:bg-teal-600">Trim./Cuatrim.</TabsTrigger>
                    <TabsTrigger value="anual" className="data-[state=active]:bg-purple-600">Sem./Anuales</TabsTrigger>
                </TabsList>

                <TabsContent value="mensual" className="space-y-0">
                    {monthly.length === 0 && <p className="text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">No hay instrumentos mensuales aplicables.</p>}
                    {monthly.map(inst => {
                        const applicableDeps = getDependenciasParaInstrumento(inst.nombre, misDependencias)
                        return applicableDeps.map(dep => renderInstrumentCard(inst, dep))
                    })}
                </TabsContent>
                
                <TabsContent value="trimestral" className="space-y-0">
                    {quarterly.length === 0 && <p className="text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">No hay instrumentos trimestrales aplicables.</p>}
                    {quarterly.map(inst => {
                        const applicableDeps = getDependenciasParaInstrumento(inst.nombre, misDependencias)
                        return applicableDeps.map(dep => renderInstrumentCard(inst, dep))
                    })}
                </TabsContent>

                <TabsContent value="anual" className="space-y-0">
                    {annual.length === 0 && <p className="text-slate-500 py-8 text-center border border-dashed border-slate-800 rounded-xl">No hay instrumentos anuales aplicables.</p>}
                    {annual.map(inst => {
                        const applicableDeps = getDependenciasParaInstrumento(inst.nombre, misDependencias)
                        return applicableDeps.map(dep => renderInstrumentCard(inst, dep))
                    })}
                </TabsContent>
            </Tabs>

            {selectedItem && userProfile && vigenciaActual && (
                <SeguimientoDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependencia={selectedItem.dependencia}
                    instrumento={selectedItem.instrumento}
                    periodo={selectedItem.periodo}
                    seguimientoExistente={selectedItem.seguimiento}
                    userRole={userProfile.rol}
                    userId={userProfile.id}
                    onSuccess={refreshData}
                />
            )}
        </div>
    )
}
