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
import { Loader2, Plus, Target, CheckCircle2 } from 'lucide-react'
import type { MetasPdd, RolUsuario, Dependencia } from '@/types/database'
import { DEPENDENCIAS_PDD } from '@/types/database'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export default function MetasPddPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, dependencia_id: string } | null>(null)
    const [dependencia, setDependencia] = useState<Dependencia | null>(null)
    const [metas, setMetas] = useState<MetasPdd[]>([])

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMeta, setEditingMeta] = useState<MetasPdd | null>(null)
    const [formData, setFormData] = useState({
        codigo_meta: '',
        descripcion: '',
        unidad_medida: '',
        meta_programada: '',
        meta_ejecutada: '',
        observaciones: '',
    })

    // Access Control State
    const [hasAccess, setHasAccess] = useState(false)

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

                // Check Access
                const depName = profile.dependencias?.nombre || ''
                const isAuthorizedDep = DEPENDENCIAS_PDD.some(d => depName.toLowerCase().includes(d.toLowerCase()))
                const isSuperUser = ['super_admin', 'equipo_planeacion', 'gerente', 'auditor_externo'].includes(profile.rol)

                if (isAuthorizedDep || isSuperUser) {
                    setHasAccess(true)
                } else {
                    setLoading(false)
                }
            }
        }
        init()
    }, [])

    useEffect(() => {
        if (!hasAccess || !vigenciaActual || !dependencia) return
        fetchMetas()
    }, [hasAccess, vigenciaActual, dependencia])

    const fetchMetas = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            // If super user, fetch all? Requirement says "only visible to authorized". 
            // Maybe super users want to see all authorized dependencies.
            // For now, let's just fetch the user's dependency if they are jefe_oficina, or all if admin.

            let query = supabase.from('metas_pdd').select('*').eq('vigencia_id', vigenciaActual.id)

            if (userProfile?.rol === 'jefe_oficina' && dependencia) {
                query = query.eq('dependencia_id', dependencia.id)
            } else {
                // Maybe filter only those in DEPENDENCIAS_PDD?
                // For now show all that exists.
            }

            const { data, error } = await query.order('codigo_meta')
            if (error) throw error
            setMetas(data || [])
        } catch (error) {
            toast.error('Error cargando metas')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (meta: MetasPdd | null) => {
        setEditingMeta(meta)
        if (meta) {
            setFormData({
                codigo_meta: meta.codigo_meta,
                descripcion: meta.descripcion,
                unidad_medida: meta.unidad_medida || '',
                meta_programada: meta.meta_programada?.toString() || '0',
                meta_ejecutada: meta.meta_ejecutada?.toString() || '0',
                observaciones: meta.observaciones || '',
            })
        } else {
            setFormData({
                codigo_meta: '',
                descripcion: '',
                unidad_medida: '',
                meta_programada: '',
                meta_ejecutada: '',
                observaciones: '',
            })
        }
        setDialogOpen(true)
    }

    const handleSave = async () => {
        if (!vigenciaActual || !dependencia) return
        setLoading(true)
        try {
            const payload: any = {
                vigencia_id: vigenciaActual.id,
                dependencia_id: dependencia.id, // For creating new, assign current dependency. Admins creating for others logic needed? Assuming Jefes manage their own.
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
                {/* Allow creating new metas only for authorized dependencies owners */}
                {userProfile?.rol === 'jefe_oficina' && (
                    <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500">
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
                                <TableHead className="text-slate-300">Unidad</TableHead>
                                <TableHead className="text-right text-slate-300">Programado</TableHead>
                                <TableHead className="text-right text-slate-300">Ejecutado</TableHead>
                                <TableHead className="text-center text-slate-300">% Cumplimiento</TableHead>
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
                                        <TableCell className="text-slate-400">{meta.unidad_medida}</TableCell>
                                        <TableCell className="text-right text-slate-300">{meta.meta_programada}</TableCell>
                                        <TableCell className="text-right text-slate-300">{meta.meta_ejecutada}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={cumplimiento >= 100 ? 'verde' : cumplimiento >= 70 ? 'amarillo' : 'rojo'} className="font-mono">
                                                {cumplimiento.toFixed(1)}%
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(meta)}>
                                                Editar
                                            </Button>
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
