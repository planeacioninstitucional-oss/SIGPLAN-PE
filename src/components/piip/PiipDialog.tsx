'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Piip, Dependencia } from '@/types/database'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PiipDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vigenciaId: string
    dependenciaId: string
    projectToEdit: Piip | null
    onSuccess: () => void
    todasDependencias?: Dependencia[]
    userRole?: string
}

export function PiipDialog({
    open,
    onOpenChange,
    vigenciaId,
    dependenciaId,
    projectToEdit,
    onSuccess,
    todasDependencias = [],
    userRole = '',
}: PiipDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        codigo_proyecto: '',
        nombre_proyecto: '',
        objetivo: '',
        meta_cuatrienio: '',
        meta_anual: '',
        ejecutado_acumulado: '',
        presupuesto_asignado: '',
        presupuesto_ejecutado: '',
        estado: 'gris',
        observaciones: '',
        url_soporte: '',
        dependencia_id: dependenciaId,
    })
    const supabase = createClient()

    useEffect(() => {
        if (projectToEdit) {
            setFormData({
                codigo_proyecto: projectToEdit.codigo_proyecto || '',
                nombre_proyecto: projectToEdit.nombre_proyecto,
                objetivo: projectToEdit.objetivo || '',
                meta_cuatrienio: projectToEdit.meta_cuatrienio?.toString() || '',
                meta_anual: projectToEdit.meta_anual?.toString() || '',
                ejecutado_acumulado: projectToEdit.ejecutado_acumulado?.toString() || '',
                presupuesto_asignado: projectToEdit.presupuesto_asignado?.toString() || '',
                presupuesto_ejecutado: projectToEdit.presupuesto_ejecutado?.toString() || '',
                estado: projectToEdit.estado,
                observaciones: projectToEdit.observaciones || '',
                url_soporte: projectToEdit.url_soporte || '',
                dependencia_id: projectToEdit.dependencia_id || dependenciaId,
            })
        } else {
            setFormData({
                codigo_proyecto: '',
                nombre_proyecto: '',
                objetivo: '',
                meta_cuatrienio: '',
                meta_anual: '',
                ejecutado_acumulado: '',
                presupuesto_asignado: '',
                presupuesto_ejecutado: '',
                estado: 'gris',
                observaciones: '',
                url_soporte: '',
                dependencia_id: dependenciaId,
            })
        }
    }, [projectToEdit, open, dependenciaId])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const targetDependenciaId = ['super_admin', 'equipo_planeacion'].includes(userRole) ? formData.dependencia_id : dependenciaId;
            if (!targetDependenciaId) {
                toast.error('Debe seleccionar una dependencia o pertenecer a una')
                setLoading(false)
                return
            }

            const payload: any = {
                vigencia_id: vigenciaId,
                dependencia_id: targetDependenciaId,
                codigo_proyecto: formData.codigo_proyecto,
                nombre_proyecto: formData.nombre_proyecto,
                objetivo: formData.objetivo,
                meta_cuatrienio: parseFloat(formData.meta_cuatrienio) || 0,
                meta_anual: parseFloat(formData.meta_anual) || 0,
                ejecutado_acumulado: parseFloat(formData.ejecutado_acumulado) || 0,
                presupuesto_asignado: parseFloat(formData.presupuesto_asignado) || 0,
                presupuesto_ejecutado: parseFloat(formData.presupuesto_ejecutado) || 0,
                estado: formData.estado,
                observaciones: formData.observaciones,
                url_soporte: formData.url_soporte,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('piip')
                .upsert(
                    projectToEdit ? { id: projectToEdit.id, ...payload } : payload
                )

            if (error) throw error

            toast.success('Proyecto guardado correctamente')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error('Error al guardar', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{projectToEdit ? 'Editar Proyecto PIIP' : 'Nuevo Proyecto PIIP'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="codigo">Código BPIN/Interno</Label>
                            <Input
                                id="codigo"
                                value={formData.codigo_proyecto}
                                onChange={(e) => setFormData({ ...formData, codigo_proyecto: e.target.value })}
                                placeholder="Ej. 2024..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select
                                value={formData.estado}
                                onValueChange={(val) => setFormData({ ...formData, estado: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="verde">Verde (Cumplido)</SelectItem>
                                    <SelectItem value="amarillo">Amarillo (Alerta)</SelectItem>
                                    <SelectItem value="rojo">Rojo (Crítico)</SelectItem>
                                    <SelectItem value="gris">Gris (Sin info)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {['super_admin', 'equipo_planeacion'].includes(userRole) && (
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
                        <Label htmlFor="nombre">Nombre del Proyecto *</Label>
                        <Input
                            id="nombre"
                            value={formData.nombre_proyecto}
                            onChange={(e) => setFormData({ ...formData, nombre_proyecto: e.target.value })}
                            placeholder="Nombre completo del proyecto"
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="objetivo">Objetivo General</Label>
                        <Textarea
                            id="objetivo"
                            value={formData.objetivo}
                            onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                            placeholder="Objetivo principal..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                        <div className="grid gap-2">
                            <Label htmlFor="meta_cuatrienio">Meta Cuatrienio</Label>
                            <Input
                                id="meta_cuatrienio"
                                type="number"
                                value={formData.meta_cuatrienio}
                                onChange={(e) => setFormData({ ...formData, meta_cuatrienio: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="meta_anual">Meta Anual {new Date().getFullYear()}</Label>
                            <Input
                                id="meta_anual"
                                type="number"
                                value={formData.meta_anual}
                                onChange={(e) => setFormData({ ...formData, meta_anual: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="presupuesto_asignado">Presupuesto Asignado</Label>
                            <Input
                                id="presupuesto_asignado"
                                type="number"
                                value={formData.presupuesto_asignado}
                                onChange={(e) => setFormData({ ...formData, presupuesto_asignado: e.target.value })}
                                placeholder="$"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="presupuesto_ejecutado">Presupuesto Ejecutado</Label>
                            <Input
                                id="presupuesto_ejecutado"
                                type="number"
                                value={formData.presupuesto_ejecutado}
                                onChange={(e) => setFormData({ ...formData, presupuesto_ejecutado: e.target.value })}
                                placeholder="$"
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="url">URL Soporte (Drive/Secop)</Label>
                        <Input
                            id="url"
                            value={formData.url_soporte}
                            onChange={e => setFormData({ ...formData, url_soporte: e.target.value })}
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
