'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { useAuthStore } from '@/stores/authStore'
import { formatDependenciaName } from '@/lib/responsabilidades'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react'
import type { Piip, Dependencia } from '@/types/database'
import { PiipDialog } from '@/components/piip/PiipDialog'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'

export default function PiipPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const { userProfile, initialized } = useAuthStore()
    const [records, setRecords] = useState<Piip[]>([])
    const [dependencia, setDependencia] = useState<Dependencia | null>(null)
    const [todasDependencias, setTodasDependencias] = useState<Dependencia[]>([])

    const isPiipAdmin = useMemo(() => {
        if (!userProfile) return false;
        return ['super_admin', 'equipo_planeacion'].includes(userProfile.rol) || 
               userProfile.nombre_completo?.toUpperCase().includes('ANDRES LAMPREA ARROYO');
    }, [userProfile]);

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Piip | null>(null)

    const supabase = createClient()

    useEffect(() => {
        if (!initialized) return
        if (userProfile) {
            setDependencia((userProfile as any).oficinas as Dependencia)
        }
    }, [initialized, userProfile])

    useEffect(() => {
        if (!vigenciaActual || !userProfile) return
        fetchProjects()
    }, [vigenciaActual, userProfile, isPiipAdmin])

    const fetchProjects = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            let query = supabase
                .from('piip')
                .select('*, dependencias(nombre)')
                .eq('vigencia_id', vigenciaActual.id)

            // If NOT admin, filter by my dependency
            if (!isPiipAdmin && (userProfile as any).oficina_id) {
                query = query.eq('dependencia_id', (userProfile as any).oficina_id)
            }

            const { data: depsData } = await supabase.from('dependencias').select('*').eq('activa', true).order('nombre')
            if (depsData) setTodasDependencias(depsData)

            const { data, error } = await query.order('created_at', { ascending: false })
            if (error) throw error
            setRecords(data || [])
        } catch (error) {
            toast.error('Error cargando proyectos')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (project: Piip | null) => {
        setEditingProject(project)
        setDialogOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este proyecto?')) return
        try {
            const { error } = await supabase.from('piip').delete().eq('id', id)
            if (error) throw error
            toast.success('Proyecto eliminado')
            fetchProjects()
        } catch (error) {
            toast.error('Error al eliminar')
        }
    }

    if (!vigenciaActual) {
        return <div className="p-8 text-center text-slate-400">Seleccione una vigencia</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground dark:text-white">PIIP</h1>
                    <p className="text-muted-foreground">Plan Indicativo de Inversión Pública</p>
                </div>
                {isPiipAdmin && (
                    <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Proyecto
                    </Button>
                )}
            </div>

            <Card className="card-glass border-border bg-white dark:bg-slate-900/40">
                <CardHeader>
                    <CardTitle className="text-foreground dark:text-slate-200">Proyectos de Inversión</CardTitle>
                    <CardDescription className="text-muted-foreground">
                        Listado de proyectos registrados en la vigencia {vigenciaActual.anio}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50 border-b border-border">
                                <TableRow className="border-border">
                                    <TableHead className="text-foreground dark:text-slate-300 font-semibold">Codigo BPIN</TableHead>
                                    <TableHead className="min-w-[200px] text-foreground dark:text-slate-300 font-semibold">Meta de plan de desarrollo</TableHead>
                                    <TableHead className="text-foreground dark:text-slate-300 font-semibold">Dependencia</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300 font-semibold">Costos</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300 font-semibold">Ejecutado</TableHead>
                                    <TableHead className="text-center text-foreground dark:text-slate-300 font-semibold">Porcentaje de avance</TableHead>
                                    <TableHead className="text-center text-foreground dark:text-slate-300 font-semibold">Estado cumplimiento</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300 font-semibold">acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((proj) => {
                                    const percentFin = proj.presupuesto_asignado && proj.presupuesto_asignado > 0
                                        ? ((proj.presupuesto_ejecutado || 0) / proj.presupuesto_asignado) * 100
                                        : 0

                                    return (
                                        <TableRow key={proj.id} className="hover:bg-muted/50 border-border">
                                            <TableCell className="font-mono text-xs text-muted-foreground">{proj.codigo_proyecto}</TableCell>
                                            <TableCell className="text-foreground dark:text-slate-300 font-medium">{proj.nombre_proyecto}</TableCell>
                                            <TableCell className="text-muted-foreground text-xs">{formatDependenciaName((proj as any).dependencias?.nombre) || '—'}</TableCell>
                                            <TableCell className="text-right text-foreground dark:text-slate-300">
                                                ${proj.presupuesto_asignado?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-foreground dark:text-slate-300">
                                                ${proj.presupuesto_ejecutado?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-xs ${percentFin > 80 ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'}`}>
                                                    {percentFin.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <SemaforoCell estado={proj.estado} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isPiipAdmin && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(proj)} className="hover:bg-muted dark:hover:bg-slate-700">
                                                            <Edit className="w-4 h-4 text-muted-foreground" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(proj.id)} className="hover:bg-red-900/10 hover:text-red-500">
                                                            <Trash2 className="w-4 h-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {records.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            No hay proyectos registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <PiipDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                vigenciaId={vigenciaActual.id}
                dependenciaId={(userProfile as any)?.oficina_id || (userProfile as any)?.dependencia_id || ''}
                todasDependencias={todasDependencias}
                userRole={userProfile?.rol || ''}
                isAdmin={isPiipAdmin}
                projectToEdit={editingProject}
                onSuccess={fetchProjects}
            />
        </div >
    )
}
