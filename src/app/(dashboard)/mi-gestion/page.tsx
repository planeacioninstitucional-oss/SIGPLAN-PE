'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, FileText, CheckCircle2, Clock } from 'lucide-react'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'
import { SeguimientoDialog } from '@/components/seguimientos/SeguimientoDialog'
import type { Instrumento, Seguimiento, Dependencia, RolUsuario } from '@/types/database'
import { toast } from 'sonner'

export default function MiGestionPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, dependencia_id: string } | null>(null)
    const [dependencia, setDependencia] = useState<Dependencia | null>(null)

    // Data
    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<{
        instrumento: Instrumento,
        periodo: string,
        seguimiento: Seguimiento | null
    } | null>(null)

    const supabase = createClient()

    // 1. Load User & Dependencia
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Get Profile
            const { data: profile } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (profile && profile.dependencia_id) {
                setUserProfile(profile as any)

                // Get Dependencia Name
                const { data: dep } = await supabase
                    .from('dependencias')
                    .select('*')
                    .eq('id', profile.dependencia_id)
                    .single()
                setDependencia(dep)
            } else {
                setLoading(false)
                // If no dependency assigned, show error or empty state
            }
        }
        init()
    }, [])

    // 2. Load Instruments & Seguimientos
    useEffect(() => {
        if (!userProfile?.dependencia_id || !vigenciaActual) return

        const fetchData = async () => {
            setLoading(true)
            try {
                // Fetch Instruments for this Vigencia
                const { data: insts } = await supabase
                    .from('instrumentos')
                    .select('*')
                    .eq('vigencia_id', vigenciaActual.id)
                    .order('nombre')

                if (insts) setInstrumentos(insts)

                // Fetch Seguimientos for my dependency
                const { data: segs } = await supabase
                    .from('seguimientos')
                    .select('*')
                    .eq('dependencia_id', userProfile.dependencia_id)
                    .eq('vigencia_id', vigenciaActual.id)

                if (segs) setSeguimientos(segs)

            } catch (error) {
                toast.error('Error cargando datos')
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [userProfile, vigenciaActual])

    const handleOpenDialog = (instrumento: Instrumento, periodo: string) => {
        const seguimiento = seguimientos.find(s =>
            s.instrumento_id === instrumento.id &&
            s.periodo_corte === periodo
        ) || null

        setSelectedItem({
            instrumento,
            periodo,
            seguimiento
        })
        setDialogOpen(true)
    }

    const refreshData = async () => {
        if (!userProfile?.dependencia_id || !vigenciaActual) return
        const { data: segs } = await supabase
            .from('seguimientos')
            .select('*')
            .eq('dependencia_id', userProfile.dependencia_id)
            .eq('vigencia_id', vigenciaActual.id)
        if (segs) setSeguimientos(segs)
    }

    // Helper to generate periods. Similar logic to page.tsx but simpler for now
    const getPeriodsForInstrument = (instrumento: Instrumento) => {
        if (instrumento.nombre.toLowerCase().includes('trimestral')) {
            return ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
        }
        return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    }

    const renderInstrumentCard = (inst: Instrumento) => {
        const periods = getPeriodsForInstrument(inst)

        return (
            <Card key={inst.id} className="card-glass border-slate-800 mb-6">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-200">
                        <FileText className="w-5 h-5 text-blue-400" />
                        {inst.nombre}
                    </CardTitle>
                    <CardDescription>{inst.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {periods.map(period => {
                            const seg = seguimientos.find(s => s.instrumento_id === inst.id && s.periodo_corte === period)
                            const status = seg?.estado_semaforo || 'gris'

                            return (
                                <div
                                    key={period}
                                    onClick={() => handleOpenDialog(inst, period)}
                                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 transition-colors cursor-pointer group"
                                >
                                    <span className="text-xs font-medium text-slate-400 mb-2">{period}</span>
                                    <SemaforoCell estado={status} className="w-8 h-8 group-hover:scale-110 transition-transform" />
                                    {status === 'gris' && <span className="text-[10px] text-slate-500 mt-2">Pendiente</span>}
                                    {status === 'verde' && <span className="text-[10px] text-green-500 mt-2">Completado</span>}
                                    {status === 'amarillo' && <span className="text-[10px] text-yellow-500 mt-2">Revisión</span>}
                                    {status === 'rojo' && <span className="text-[10px] text-red-500 mt-2">Incumplido</span>}
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
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!dependencia) {
        return <div className="p-8 text-center text-slate-400">No tienes una dependencia asignada. Contacta al administrador.</div>
    }

    // Group instruments by periodicity for Tabs (rough heuristic)
    const monthly = instrumentos.filter(i => !i.nombre.toLowerCase().includes('trimestral') && !i.nombre.toLowerCase().includes('anual'))
    const quarterly = instrumentos.filter(i => i.nombre.toLowerCase().includes('trimestral'))
    const annual = instrumentos.filter(i => i.nombre.toLowerCase().includes('anual'))

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-white">Mi Gestión</h1>
                <p className="text-slate-400">Reporte de avances para {dependencia.nombre}</p>
            </div>

            <Tabs defaultValue="mensual" className="w-full">
                <TabsList className="mb-4 bg-slate-900/50 border border-slate-800">
                    <TabsTrigger value="mensual">Mensuales ({monthly.length})</TabsTrigger>
                    <TabsTrigger value="trimestral">Trimestrales ({quarterly.length})</TabsTrigger>
                    <TabsTrigger value="anual">Anuales ({annual.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="mensual" className="space-y-6">
                    {monthly.length === 0 && <p className="text-slate-500">No hay instrumentos mensuales.</p>}
                    {monthly.map(renderInstrumentCard)}
                </TabsContent>
                <TabsContent value="trimestral" className="space-y-6">
                    {quarterly.length === 0 && <p className="text-slate-500">No hay instrumentos trimestrales.</p>}
                    {quarterly.map(renderInstrumentCard)}
                </TabsContent>
                <TabsContent value="anual" className="space-y-6">
                    {annual.map(renderInstrumentCard)}
                </TabsContent>
            </Tabs>

            {/* Dialog */}
            {selectedItem && userProfile && vigenciaActual && (
                <SeguimientoDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependencia={dependencia}
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
