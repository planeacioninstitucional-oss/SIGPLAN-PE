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
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Plus, Target, CheckCircle2, Trash2, Edit } from 'lucide-react'
import type { MetasPdd, RolUsuario, Dependencia } from '@/types/database'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { useAuthStore } from '@/stores/authStore'
import { hasSidebarAccess } from '@/lib/responsabilidades'

export default function MetasPddPage() {
    const { vigenciaActual } = useVigenciaStore()
    const { userProfile, initialized } = useAuthStore()
    const [loading, setLoading] = useState(true)
    const [dependencia, setDependencia] = useState<Dependencia | null>(null)
    const [metas, setMetas] = useState<MetasPdd[]>([])
    const [todasDependencias, setTodasDependencias] = useState<Dependencia[]>([])

    // State Variables for Modal
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMeta, setEditingMeta] = useState<MetasPdd | null>(null)
    const [formData, setFormData] = useState({
        codigo_meta: '',
        descripcion: '',
        unidad_medida: '',
        meta_programada: '',
        meta_ejecutada: '',
        observaciones: '',
        dependencia_id: '',
    })

    const [hasAccess, setHasAccess] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        if (!initialized) return

        if (userProfile) {
            setDependencia((userProfile as any).oficinas as Dependencia)

            // Comprobar Acceso: Permite si es super usuario o si tiene acceso según responsabilidades
            const isSuperUser = ['super_admin', 'equipo_planeacion', 'gerente', 'auditor'].includes(userProfile.rol)
            const authorizedByName = hasSidebarAccess('Metas PDD', userProfile.nombre_completo, userProfile.rol, (userProfile as any).oficinas?.nombre)

            if (isSuperUser || authorizedByName) {
                setHasAccess(true)
            } else {
                setLoading(false)
            }
        }
    }, [initialized, userProfile])

    useEffect(() => {
        if (!hasAccess || !vigenciaActual || !dependencia) return
        fetchMetas()
    }, [hasAccess, vigenciaActual, dependencia])

    const fetchMetas = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            // Fetch all dependencias for mapping and dropdown
            const { data: depsData } = await supabase.from('dependencias').select('*').eq('activa', true).order('nombre')
            if (depsData) setTodasDependencias(depsData)

            let query = supabase.from('metas_pdd').select('*, dependencias(nombre)').eq('vigencia_id', vigenciaActual.id)

            // Si es jefe_oficina o funcionario (sin ser super_admin/equipo_planeacion), filtrar por su dependencia
            const isBroadEditor = ['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '')
            if (!isBroadEditor && dependencia) {
                // Buscamos el ID en la tabla dependencias que coincida con el nombre de nuestra oficina
                const matchingDep = depsData?.find(d => 
                    d.nombre.toUpperCase().trim() === dependencia.nombre.toUpperCase().trim()
                )
                if (matchingDep) {
                    query = query.eq('dependencia_id', matchingDep.id)
                } else {
                    query = query.eq('dependencia_id', dependencia.id)
                }
            }

            const { data, error } = await query
            if (error) throw error
            
            // Ordenamiento natural (ej: 1.2 antes que 1.10)
            const sortedData = (data || []).sort((a, b) => {
                const aParts = (a.codigo_meta || '').toString().trim().split(/[\.-]/).map((n: string) => parseInt(n) || 0)
                const bParts = (b.codigo_meta || '').toString().trim().split(/[\.-]/).map((n: string) => parseInt(n) || 0)
                const len = Math.max(aParts.length, bParts.length)
                for (let i = 0; i < len; i++) {
                    const av = aParts[i] || 0
                    const bv = bParts[i] || 0
                    if (av !== bv) return av - bv
                }
                return (a.codigo_meta || '').localeCompare(b.codigo_meta || '')
            })

            setMetas(sortedData)
        } catch (error) {
            toast.error('Error cargando metas')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar esta meta? Esta acción no se puede deshacer.')) return
        try {
            const { error } = await supabase.from('metas_pdd').delete().eq('id', id)
            if (error) throw error
            toast.success('Meta eliminada correctamente')
            fetchMetas()
        } catch (error) {
            toast.error('Error al eliminar la meta')
        }
    }

    const handleEdit = (meta: MetasPdd | null) => {
        setEditingMeta(meta)

        // Buscamos si nuestra oficina actual tiene un ID de dependencia equivalente para pre-seleccionar
        const mappedDepId = todasDependencias.find(d => 
            d.nombre.toUpperCase().trim() === dependencia?.nombre?.toUpperCase().trim()
        )?.id || dependencia?.id || ''

        if (meta) {
            setFormData({
                codigo_meta: meta.codigo_meta,
                descripcion: meta.descripcion,
                unidad_medida: meta.unidad_medida || '',
                meta_programada: meta.meta_programada?.toString() || '0',
                meta_ejecutada: meta.meta_ejecutada?.toString() || '0',
                observaciones: meta.observaciones || '',
                dependencia_id: meta.dependencia_id || mappedDepId,
            })
        } else {
            setFormData({
                codigo_meta: '',
                descripcion: '',
                unidad_medida: '',
                meta_programada: '',
                meta_ejecutada: '',
                observaciones: '',
                dependencia_id: mappedDepId,
            })
        }
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!vigenciaActual) return

        const isBroadEditor = ['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') || 
                             hasSidebarAccess('Metas PDD', userProfile?.nombre_completo, userProfile?.rol || '', dependencia?.nombre)
        
        // Si es un editor autorizado (como Paola o Admin), usamos el ID seleccionado en el formulario
        let targetDependenciaId = isBroadEditor ? formData.dependencia_id : dependencia?.id

        // Si aún no tenemos ID y tenemos una oficina, intentamos el mapeo de nombres como respaldo
        if (!targetDependenciaId && dependencia) {
            const matchingDep = todasDependencias.find(d => 
                d.nombre.toUpperCase().trim() === dependencia.nombre.toUpperCase().trim()
            )
            if (matchingDep) {
                targetDependenciaId = matchingDep.id
            }
        }

        if (!targetDependenciaId) {
            toast.error('Debe seleccionar una dependencia o pertenecer a una')
            return
        }

        setLoading(true)
        try {
            const payload: any = {
                vigencia_id: vigenciaActual.id,
                dependencia_id: targetDependenciaId,
                codigo_meta: formData.codigo_meta,
                descripcion: formData.descripcion,
                unidad_medida: formData.unidad_medida,
                meta_programada: parseFloat(formData.meta_programada) || 0,
                meta_ejecutada: parseFloat(formData.meta_ejecutada) || 0,
                observaciones: formData.observaciones,
            }

            const { error } = await supabase
                .from('metas_pdd')
                .upsert(
                    editingMeta ? { id: editingMeta.id, ...payload } : payload
                )

            if (error) throw error
            toast.success('Meta guardada')
            setDialogOpen(false)
            fetchMetas()
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        )
    }

    if (!hasAccess) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center h-[60vh] animate-in fade-in duration-500">
                <div className="p-4 rounded-full bg-slate-800/50 mb-4">
                    <Target className="w-12 h-12 text-slate-500" />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
                <p className="text-slate-400 max-w-md mx-auto">
                    Este módulo está reservado para dependencias específicas responsables de metas del Plan de Desarrollo Distrital.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Metas PDD</h1>
                    <p className="text-slate-400">Seguimiento al Plan de Desarrollo Distrital</p>
                </div>
                {/* Allow creating new metas only for authorized roles */}
                {/* Allow creating new metas for authorized roles or specific users */}
                {(['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') || 
                  hasSidebarAccess('Metas PDD', userProfile?.nombre_completo, userProfile?.rol || '', dependencia?.nombre)) && (
                    <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Meta
                    </Button>
                )}
            </div>

            <Card className="card-glass border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-200">Metas Registradas</CardTitle>
                    <CardDescription>
                        {metas.length} metas asignadas a {dependencia?.nombre || 'esta vigencia'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader className="bg-slate-900/90">
                            <TableRow>
                                <TableHead className="w-[100px] text-slate-300">Código</TableHead>
                                <TableHead className="min-w-[200px] text-slate-300">Descripción</TableHead>
                                 {(['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') || 
                                   hasSidebarAccess('Metas PDD', userProfile?.nombre_completo, userProfile?.rol || '', (userProfile as any).oficinas?.nombre)) && (
                                    <TableHead className="text-slate-300">Oficina</TableHead>
                                )}
                                <TableHead className="text-slate-300">Unidad</TableHead>
                                <TableHead className="text-right text-slate-300">Prog.</TableHead>
                                <TableHead className="text-right text-slate-300">Ejec.</TableHead>
                                <TableHead className="text-center text-slate-300">% Cumpl.</TableHead>
                                <TableHead className="text-right text-slate-300">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {metas.map((meta) => {
                                const cumplimiento = meta.meta_programada && meta.meta_programada > 0
                                    ? ((meta.meta_ejecutada || 0) / meta.meta_programada) * 100
                                    : 0

                                return (
                                    <TableRow key={meta.id} className="hover:bg-slate-800/50">
                                        <TableCell className="font-medium text-blue-400">{meta.codigo_meta}</TableCell>
                                        <TableCell className="text-slate-300">{meta.descripcion}</TableCell>
                                        {(['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') || 
                                          hasSidebarAccess('Metas PDD', userProfile?.nombre_completo, userProfile?.rol || '', (userProfile as any).oficinas?.nombre)) && (
                                            <TableCell className="text-slate-400 text-xs">{(meta as any).dependencias?.nombre || '—'}</TableCell>
                                        )}
                                        <TableCell className="text-slate-400">{meta.unidad_medida}</TableCell>
                                        <TableCell className="text-right text-slate-300">{meta.meta_programada}</TableCell>
                                        <TableCell className="text-right text-slate-300">{meta.meta_ejecutada}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={cumplimiento >= 100 ? 'verde' : cumplimiento >= 70 ? 'amarillo' : 'rojo'} className="font-mono">
                                                {cumplimiento.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {(['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') || 
                                              hasSidebarAccess('Metas PDD', userProfile?.nombre_completo, userProfile?.rol || '', (userProfile as any).oficinas?.nombre)) && (
                                                <div className="flex justify-end gap-2">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)} className="hover:bg-gray-200 dark:hover:bg-slate-700" title="Editar">
                                                        <Edit className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(meta.id)} className="hover:bg-red-50 dark:hover:bg-red-900/20" title="Eliminar">
                                                        <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
                                                    </Button>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            })}
                            {metas.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                                        No hay metas registradas.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingMeta ? 'Editar Meta' : 'Nueva Meta PDD'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Código</Label>
                            <Input value={formData.codigo_meta} onChange={e => setFormData({ ...formData, codigo_meta: e.target.value })} placeholder="Ej. 1.1.2" />
                        </div>
                        {(['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '') || 
                          hasSidebarAccess('Metas PDD', userProfile?.nombre_completo, userProfile?.rol || '', (userProfile as any).oficinas?.nombre)) && (
                            <div className="grid gap-2">
                                <Label>Dependencia Asignada</Label>
                                <select
                                    className="flex h-9 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-200"
                                    value={formData.dependencia_id}
                                    onChange={e => setFormData({ ...formData, dependencia_id: e.target.value })}
                                >
                                    <option value="" disabled>Seleccione una dependencia...</option>
                                    {todasDependencias.map(d => (
                                        <option key={d.id} value={d.id}>{d.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label>Descripción</Label>
                            <Textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} placeholder="Descripción de la meta..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Unidad Medida</Label>
                                <Input value={formData.unidad_medida} onChange={e => setFormData({ ...formData, unidad_medida: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label>Meta Programada</Label>
                                <Input type="number" value={formData.meta_programada} onChange={e => setFormData({ ...formData, meta_programada: e.target.value })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Meta Ejecutada</Label>
                                <Input type="number" value={formData.meta_ejecutada} onChange={e => setFormData({ ...formData, meta_ejecutada: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label>Observaciones</Label>
                            <Textarea value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={loading}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
