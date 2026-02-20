'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Filter, Download } from 'lucide-react'
import type { Dependencia, Instrumento, Seguimiento, RolUsuario } from '@/types/database'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'
import { SeguimientoDialog } from '@/components/seguimientos/SeguimientoDialog'
import { toast } from 'sonner'

export default function SeguimientosPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(false)

    // Data State
    const [dependencias, setDependencias] = useState<Dependencia[]>([])
    const [instrumentos, setInstrumentos] = useState<Instrumento[]>([])
    const [seguimientos, setSeguimientos] = useState<Seguimiento[]>([])
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, dependencia_id: string | null } | null>(null)

    // Filter State
    const [selectedInstrumentoId, setSelectedInstrumentoId] = useState<string>('')

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedCell, setSelectedCell] = useState<{
        dependencia: Dependencia,
        periodo: string,
        seguimiento: Seguimiento | null
    } | null>(null)

    const supabase = createClient()

    // 1. Fetch User Profile
    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
                if (data) setUserProfile(data)
            }
        }
        fetchUser()
    }, [])

    // 2. Fetch Master Data (Dependencias, Instrumentos) when Vigencia changes
    useEffect(() => {
        if (!vigenciaActual) return

        const fetchData = async () => {
            setLoading(true)
            try {
                const [depsRes, instRes] = await Promise.all([
                    supabase.from('dependencias').select('*').order('nombre'),
                    supabase.from('instrumentos').select('*').eq('vigencia_id', vigenciaActual.id).order('nombre')
                ])

                if (depsRes.error) throw depsRes.error
                if (instRes.error) throw instRes.error

                setDependencias(depsRes.data)
                setInstrumentos(instRes.data)

                if (instRes.data.length > 0 && !selectedInstrumentoId) {
                    setSelectedInstrumentoId(instRes.data[0].id)
                }
            } catch (error) {
                toast.error('Error cargando datos maestros')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [vigenciaActual])

    // 3. Fetch Seguimientos when Instrumento changes
    useEffect(() => {
        if (!selectedInstrumentoId || !vigenciaActual) return

        fetchSeguimientos()
    }, [selectedInstrumentoId, vigenciaActual])

    const fetchSeguimientos = async () => {
        if (!selectedInstrumentoId) return
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('seguimientos')
                .select('*')
                .eq('instrumento_id', selectedInstrumentoId)

            if (error) throw error
            setSeguimientos(data)
        } catch (error) {
            toast.error('Error cargando seguimientos')
        } finally {
            setLoading(false)
        }
    }

    // Helpers
    const getPeriods = () => {
        // Generate simple periods based on basic logic. Ideally this comes from DB or config.
        // For now assuming all are "Mensual" or similar. 
        // TODO: Parse 'periodicidad' from Instrumento if complex.
        const instrumento = instrumentos.find(i => i.id === selectedInstrumentoId)
        if (instrumento?.nombre.toLowerCase().includes('trimestral')) {
            return ['Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4']
        }
        return ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
    }

    const periods = getPeriods()
    const currentInstrumento = instrumentos.find(i => i.id === selectedInstrumentoId)

    const handleCellClick = (dependencia: Dependencia, periodo: string) => {
        const seguimiento = seguimientos.find(s =>
            s.dependencia_id === dependencia.id &&
            s.periodo_corte === periodo
        ) || null

        setSelectedCell({
            dependencia,
            periodo,
            seguimiento
        })
        setDialogOpen(true)
    }

    if (!vigenciaActual) {
        return <div className="p-8 text-center text-slate-400">Seleccione una vigencia para continuar</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Mesa de Control</h1>
                    <p className="text-slate-400">Monitoreo de instrumentos de planeación</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <Filter className="w-4 h-4 text-slate-500 ml-2" />
                    <Select value={selectedInstrumentoId} onValueChange={setSelectedInstrumentoId}>
                        <SelectTrigger className="w-[280px] border-0 bg-transparent focus:ring-0">
                            <SelectValue placeholder="Seleccionar Instrumento" />
                        </SelectTrigger>
                        <SelectContent>
                            {instrumentos.map((inst) => (
                                <SelectItem key={inst.id} value={inst.id}>
                                    {inst.nombre}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="card-glass border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-lg text-slate-200">
                            {currentInstrumento?.nombre || 'Cargando...'}
                        </CardTitle>
                        <CardDescription>
                            {currentInstrumento?.descripcion || 'Vista general de cumplimiento por dependencia'}
                        </CardDescription>
                    </div>
                    <Button variant="outline" size="sm" className="hidden md:flex">
                        <Download className="w-4 h-4 mr-2" />
                        Exportar
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-hidden rounded-md border border-slate-800">
                        {loading && (
                            <div className="absolute inset-0 bg-black/50 z-10 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                            </div>
                        )}

                        <div className="overflow-x-auto max-h-[600px]">
                            <Table>
                                <TableHeader className="bg-slate-900/90 py-4 sticky top-0 z-20">
                                    <TableRow>
                                        <TableHead className="w-[300px] min-w-[300px] bg-slate-900/90 text-slate-300 font-bold sticky left-0 z-20">
                                            Dependencia
                                        </TableHead>
                                        {periods.map((period) => (
                                            <TableHead key={period} className="text-center min-w-[100px] text-slate-300">
                                                {period}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dependencias.map((dep) => (
                                        <TableRow key={dep.id} className="hover:bg-slate-800/50 transition-colors">
                                            <TableCell className="font-medium text-slate-300 sticky left-0 bg-slate-950/90 z-10 border-r border-slate-800">
                                                {dep.nombre}
                                            </TableCell>
                                            {periods.map((period) => {
                                                const seg = seguimientos.find(s =>
                                                    s.dependencia_id === dep.id &&
                                                    s.periodo_corte === period
                                                )
                                                const estado = seg?.estado_semaforo || 'gris'

                                                return (
                                                    <TableCell key={`${dep.id}-${period}`} className="text-center p-2">
                                                        <div className="flex justify-center">
                                                            <SemaforoCell
                                                                estado={estado}
                                                                onClick={() => handleCellClick(dep, period)}
                                                                className="cursor-pointer hover:scale-110 transition-transform"
                                                            />
                                                        </div>
                                                    </TableCell>
                                                )
                                            })}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dialog for Editing/Viewing */}
            {selectedCell && currentInstrumento && userProfile && vigenciaActual && (
                <SeguimientoDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependencia={selectedCell.dependencia}
                    instrumento={currentInstrumento}
                    periodo={selectedCell.periodo}
                    seguimientoExistente={selectedCell.seguimiento}
                    userRole={userProfile.rol}
                    userId={userProfile.id}
                    onSuccess={fetchSeguimientos}
                />
            )}
        </div>
    )
}
