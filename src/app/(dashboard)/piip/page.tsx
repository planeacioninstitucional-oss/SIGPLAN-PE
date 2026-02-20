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
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, dependencia_id: string } | null>(null)
    const [projects, setProjects] = useState<Piip[]>([])
    const [dependencia, setDependencia] = useState<Dependencia | null>(null)

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingProject, setEditingProject] = useState<Piip | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: profile } = await supabase
                .from('perfiles')
                .select('*, dependencias(*)')
                .eq('id', user.id)
                .single()

            if (profile) {
                setUserProfile(profile as any)
                setDependencia(profile.dependencias as any)
            }
        }
        init()
    }, [])

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
                .select('*')
                .eq('vigencia_id', vigenciaActual.id)

            // If NOT super admin, filter by my dependency
            if (userProfile?.rol === 'jefe_oficina' && userProfile.dependencia_id) {
                query = query.eq('dependencia_id', userProfile.dependencia_id)
            }

            const { data, error } = await query.order('created_at', { ascending: false })
            if (error) throw error
            setProjects(data || [])
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
                    <h1 className="text-3xl font-bold text-white">PIIP</h1>
                    <p className="text-slate-400">Plan Indicativo de Inversión Pública</p>
                </div>
                {/* Only show Add button if user has a dependency assigned (Jefes) */}
                {userProfile?.dependencia_id && (
                    <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Proyecto
                    </Button>
                )}
            </div>

            <Card className="card-glass border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-200">Proyectos de Inversión</CardTitle>
                    <CardDescription>
                        Listado de proyectos registrados en la vigencia {vigenciaActual.anio}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-900/90">
                                <TableRow>
                                    <TableHead className="text-slate-300">Código</TableHead>
                                    <TableHead className="min-w-[200px] text-slate-300">Nombre del Proyecto</TableHead>
                                    <TableHead className="text-right text-slate-300">Presupuesto</TableHead>
                                    <TableHead className="text-right text-slate-300">Ejecutado</TableHead>
                                    <TableHead className="text-center text-slate-300">% Fin.</TableHead>
                                    <TableHead className="text-center text-slate-300">Estado</TableHead>
                                    <TableHead className="text-right text-slate-300">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.map((proj) => {
                                    const loading = false
                                    const percentFin = proj.presupuesto_asignado && proj.presupuesto_asignado > 0
                                        ? ((proj.presupuesto_ejecutado || 0) / proj.presupuesto_asignado) * 100
                                        : 0

                                    return (
                                        <TableRow key={proj.id} className="hover:bg-slate-800/50">
                                            <TableCell className="font-mono text-xs text-slate-400">{proj.codigo_proyecto}</TableCell>
                                            <TableCell className="text-slate-300 font-medium">{proj.nombre_proyecto}</TableCell>
                                            <TableCell className="text-right text-slate-300">
                                                ${proj.presupuesto_asignado?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right text-slate-300">
                                                ${proj.presupuesto_ejecutado?.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`text-xs ${percentFin > 80 ? 'text-green-400' : 'text-slate-400'}`}>
                                                    {percentFin.toFixed(1)}%
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <SemaforoCell estado={proj.estado} />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(proj)}>
                                                        <Edit className="w-4 h-4 text-slate-400" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(proj.id)}>
                                                        <Trash2 className="w-4 h-4 text-red-400" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {projects.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                            No hay proyectos registrados.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {userProfile?.dependencia_id && (
                <PiipDialog
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    vigenciaId={vigenciaActual.id}
                    dependenciaId={userProfile.dependencia_id}
                    projectToEdit={editingProject}
                    onSuccess={fetchProjects}
                />
            )}
        </div>
    )
}
