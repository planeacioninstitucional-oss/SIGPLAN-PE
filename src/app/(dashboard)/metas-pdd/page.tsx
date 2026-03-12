'use client'

import { useState, useEffect, useMemo } from 'react'
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
import { Loader2, Plus, Target, Trash2, Edit } from 'lucide-react'
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

    // Roles and Permissions
    const isPddAdmin = useMemo(() => {
        if (!userProfile) return false;
        return ['super_admin', 'equipo_planeacion'].includes(userProfile.rol) || 
               userProfile.nombre_completo?.toUpperCase().includes('PAOLA ANDREA OYOLA ALVIS');
    }, [userProfile]);

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
            const authorizedByName = hasSidebarAccess('Metas PDD', userProfile.nombre_completo, userProfile.rol, (userProfile as any).oficinas?.nombre)

            if (isPddAdmin || authorizedByName) {
                setHasAccess(true)
            } else {
                setLoading(false)
            }
        }
    }, [initialized, userProfile, isPddAdmin])

    useEffect(() => {
        if (!hasAccess || !vigenciaActual) return
        fetchMetas()
    }, [hasAccess, vigenciaActual])

    const fetchMetas = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            // Fetch all dependencias for mapping and dropdown
            const { data: depsData } = await supabase.from('dependencias').select('*').eq('activa', true).order('nombre')
            if (depsData) setTodasDependencias(depsData)

            let query = supabase.from('metas_pdd').select('*, dependencias(nombre)').eq('vigencia_id', vigenciaActual.id)

            // Si no es admin PDD, filtrar por su dependencia
            if (!isPddAdmin && dependencia) {
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

        let targetDependenciaId = isPddAdmin ? formData.dependencia_id : dependencia?.id

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
                    <h1 className="text-3xl font-bold text-foreground dark:text-white">Metas PDD</h1>
                    <p className="text-muted-foreground">Seguimiento al Plan de Desarrollo Distrital</p>
                </div>
                {isPddAdmin && (
                    <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Meta
                    </Button>
                )}
            </div>

            <Card className="card-glass border-border">
                <CardHeader>
                    <CardTitle className="text-foreground dark:text-slate-200">Metas Registradas</CardTitle>
                    <CardDescription>
                        {metas.length} metas disponibles para esta vigencia
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[100px] text-foreground dark:text-slate-300">Código</TableHead>
                                    <TableHead className="min-w-[200px] text-foreground dark:text-slate-300">Descripción</TableHead>
                                    {isPddAdmin && (
                                        <TableHead className="text-foreground dark:text-slate-300">Oficina</TableHead>
                                    )}
                                    <TableHead className="text-foreground dark:text-slate-300">Unidad</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Prog.</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Ejec.</TableHead>
                                    <TableHead className="text-center text-foreground dark:text-slate-300">% Cumpl.</TableHead>
                                    <TableHead className="text-right text-foreground dark:text-slate-300">Acciones</TableHead>
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
                                            <TableCell className="text-foreground dark:text-slate-300">{meta.descripcion}</TableCell>
                                            {isPddAdmin && (
                                                <TableCell className="text-muted-foreground text-xs dark:text-slate-400">{(meta as any).dependencias?.nombre || '—'}</TableCell>
                                            )}
                                            <TableCell className="text-muted-foreground dark:text-slate-400">{meta.unidad_medida}</TableCell>
                                            <TableCell className="text-right text-foreground dark:text-slate-300">{meta.meta_programada}</TableCell>
                                            <TableCell className="text-right text-foreground dark:text-slate-300">{meta.meta_ejecutada}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge 
                                                    variant={cumplimiento >= 100 ? 'verde' : cumplimiento >= 70 ? 'amarillo' : 'rojo'} 
                                                    className="font-mono text-[10px]"
                                                >
                                                    {cumplimiento.toFixed(1)}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {isPddAdmin && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(meta)} className="hover:bg-slate-700" title="Editar">
                                                            <Edit className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(meta.id)} className="hover:bg-red-900/20" title="Eliminar">
                                                            <Trash2 className="w-4 h-4 text-red-400" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                                {metas.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={isPddAdmin ? 8 : 7} className="text-center py-8 text-slate-500">
                                            No hay metas registradas.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-200">
                    <DialogHeader>
                        <DialogTitle className="text-white">{editingMeta ? 'Editar Meta' : 'Nueva Meta PDD'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-slate-300">Código</Label>
                                <Input 
                                    value={formData.codigo_meta} 
                                    onChange={e => setFormData({ ...formData, codigo_meta: e.target.value })} 
                                    placeholder="Ej. 1.1.2" 
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            {isPddAdmin && (
                                <div className="grid gap-2">
                                    <Label className="text-slate-300">Dependencia Asignada</Label>
                                    <select
                                        className="flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 text-slate-200"
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
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-300">Descripción</Label>
                            <Textarea 
                                value={formData.descripcion} 
                                onChange={e => setFormData({ ...formData, descripcion: e.target.value })} 
                                placeholder="Descripción de la meta..." 
                                className="bg-slate-950 border-slate-800 min-h-[100px]"
                            />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-slate-300">Unidad Medida</Label>
                                <Input 
                                    value={formData.unidad_medida} 
                                    onChange={e => setFormData({ ...formData, unidad_medida: e.target.value })} 
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-slate-300">Meta Programada</Label>
                                <Input 
                                    type="number" 
                                    value={formData.meta_programada} 
                                    onChange={e => setFormData({ ...formData, meta_programada: e.target.value })} 
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-slate-300">Meta Ejecutada</Label>
                                <Input 
                                    type="number" 
                                    value={formData.meta_ejecutada} 
                                    onChange={e => setFormData({ ...formData, meta_ejecutada: e.target.value })} 
                                    className="bg-slate-950 border-slate-800"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-slate-300">Observaciones</Label>
                            <Textarea 
                                value={formData.observaciones} 
                                onChange={e => setFormData({ ...formData, observaciones: e.target.value })} 
                                className="bg-slate-950 border-slate-800"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
                            Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
