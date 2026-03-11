'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import { useAuthStore } from '@/stores/authStore'
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react'
import type { Piip, Dependencia, RolUsuario } from '@/types/database'
import { PiipDialog } from '@/components/piip/PiipDialog'
import { SemaforoCell } from '@/components/seguimientos/SemaforoCell'

export default function PiipPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const { userProfile, initialized } = useAuthStore()
    const [records, setRecords] = useState<Piip[]>([])
    const [dependencia, setDependencia] = useState<Dependencia | null>(null)
    const [todasDependencias, setTodasDependencias] = useState<Dependencia[]>([])

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
    }, [vigenciaActual, userProfile])

    const fetchProjects = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            let query = supabase
                .from('piip')
                .select('*, dependencias(nombre)')
                .eq('vigencia_id', vigenciaActual.id)

            // If NOT super admin, filter by my dependency
            if (userProfile?.rol === 'jefe_oficina' && (userProfile as any).dependencia_id) {
                query = query.eq('dependencia_id', (userProfile as any).dependencia_id)
            } else {
                const { data: depsData } = await supabase.from('dependencias').select('*').eq('activa', true).order('nombre')
                if (depsData) setTodasDependencias(depsData)
            }

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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">PIIP</h1>
                    <p className="text-gray-500 dark:text-slate-400">Plan Indicativo de Inversión Pública</p>
                </div>
                {/* Always show for admins, or if user has a dependency assigned (Jefes) */}
                {['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') && (
                    <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Proyecto
                    </Button>
                )}
            </div>

            <Card className="card-glass border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-slate-200">Proyectos de Inversión</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-slate-400">
                        Listado de proyectos registrados en la vigencia {vigenciaActual.anio}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/90 dark:bg-slate-900/90 border-b border-gray-200 dark:border-slate-800">
                                <TableRow className="border-gray-200 dark:border-slate-800">
                                    <TableHead className="text-gray-800 dark:text-slate-300 font-semibold">Código</TableHead>
                                    <TableHead className="min-w-[200px] text-gray-800 dark:text-slate-300 font-semibold">Nombre del Proyecto</TableHead>
                                    {['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') && (
                                        <TableHead className="text-gray-800 dark:text-slate-300 font-semibold">Oficina</TableHead>
                                    )}
                                    <TableHead className="text-right text-gray-800 dark:text-slate-300 font-semibold">Presupuesto</TableHead>
                                    <TableHead className="text-right text-gray-800 dark:text-slate-300 font-semibold">Ejecutado</TableHead>
                                    <TableHead className="text-center text-gray-800 dark:text-slate-300 font-semibold">% Fin.</TableHead>
                                    <TableHead className="text-center text-gray-800 dark:text-slate-300 font-semibold">Estado</TableHead>
                                    <TableHead className="text-right text-gray-800 dark:text-slate-300 font-semibold">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {records.map((proj) => {
                                    const loading = false
                                    const percentFin = proj.presupuesto_asignado && proj.presupuesto_asignado > 0
                                        ? ((proj.presupuesto_ejecutado || 0) / proj.presupuesto_asignado) * 100
                                        : 0

                                    return (
                                        <TableRow key={proj.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-200 dark:border-slate-800">
                                            <TableCell className="font-mono text-xs text-gray-600 dark:text-slate-400">{proj.codigo_proyecto}</TableCell>
                                            <TableCell className="text-gray-900 dark:text-slate-300 font-medium">{proj.nombre_proyecto}</TableCell>
                                            {['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') && (
                                                <TableCell className="text-gray-600 dark:text-slate-400 text-xs">{(proj as any).dependencias?.nombre || '—'}</TableCell>
                                            )}
                                            <TableCell className="text-right text-gray-900 dark:text-slate-300">
                                                ${proj.presupuesto_asignado?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-gray-900 dark:text-slate-300">
                                                ${proj.presupuesto_ejecutado?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-xs ${percentFin > 80 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-slate-400'}`}>
                                                    {percentFin.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <SemaforoCell estado={proj.estado} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(proj)} className="hover:bg-gray-200 dark:hover:bg-slate-700">
                                                            <Edit className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(proj.id)} className="hover:bg-red-50 dark:hover:bg-red-900/20">
                                                            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {records.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-slate-500">
                                            No hay proyectos registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {
                (['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '')) && (
                    <PiipDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        vigenciaId={vigenciaActual.id}
                        dependenciaId={(userProfile as any)?.dependencia_id || ''}
                        todasDependencias={todasDependencias}
                        userRole={userProfile?.rol || ''}
                        projectToEdit={editingProject}
                        onSuccess={fetchProjects}
                    />
                )
            }
        </div >
    )
}
