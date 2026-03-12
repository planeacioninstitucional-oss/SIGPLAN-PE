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
import { Loader2, Info, Link as LinkIcon, DollarSign, Target, FileText, Layout } from 'lucide-react'
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
    isAdmin?: boolean
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
    isAdmin = false
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
            const targetDependenciaId = isAdmin ? formData.dependencia_id : dependenciaId;
            if (!targetDependenciaId) {
                toast.error('Debe seleccionar un proceso o pertenecer a uno')
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
            <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl p-0">
                <div className="bg-gradient-to-r from-blue-600/20 to-transparent p-6 pb-0">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
                            <Layout className="w-6 h-6 text-blue-400" />
                            {projectToEdit ? 'Editar Proyecto PIIP' : 'Nuevo Proyecto PIIP'}
                        </DialogTitle>
                        <p className="text-slate-400 text-sm">Ingrese los detalles del proyecto de inversión pública.</p>
                    </DialogHeader>
                </div>

                <div className="p-8 pt-2 space-y-8">
                    {/* Sección: Identificación */}
                    <div className="grid gap-6">
                        <div className="flex items-center gap-2 text-blue-400 border-b border-blue-400/20 pb-2 mb-2">
                            <Info className="w-4 h-4" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider">Identificación y Estado</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="codigo" className="text-slate-200 font-medium ml-1">Código BPIN</Label>
                                <Input
                                    id="codigo"
                                    value={formData.codigo_proyecto}
                                    onChange={(e) => setFormData({ ...formData, codigo_proyecto: e.target.value })}
                                    placeholder="Ej. 2024-XXXX"
                                    className="bg-slate-800/50 border-slate-700/50 focus:border-blue-500/50 focus:ring-blue-500/20 text-white placeholder:text-slate-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="estado" className="text-slate-200 font-medium ml-1">Estado Cumplimiento</Label>
                                <Select
                                    value={formData.estado}
                                    onValueChange={(val) => setFormData({ ...formData, estado: val })}
                                >
                                    <SelectTrigger className="bg-slate-800/50 border-slate-700/50 text-white">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                        <SelectItem value="verde" className="focus:bg-green-500/20"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500" /> Verde (Cumplido)</span></SelectItem>
                                        <SelectItem value="amarillo" className="focus:bg-yellow-500/20"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-yellow-500" /> Amarillo (Alerta)</span></SelectItem>
                                        <SelectItem value="rojo" className="focus:bg-red-500/20"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500" /> Rojo (Crítico)</span></SelectItem>
                                        <SelectItem value="gris" className="focus:bg-slate-500/20"><span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-slate-500" /> Gris (Sin info)</span></SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {isAdmin && (
                            <div className="space-y-2">
                                <Label className="text-slate-200 font-medium ml-1">Proceso Asignado</Label>
                                <select
                                    className="flex h-10 w-full rounded-md border border-slate-700/50 bg-slate-800/50 px-3 py-2 text-sm shadow-sm transition-all focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-white"
                                    value={formData.dependencia_id}
                                    onChange={e => setFormData({ ...formData, dependencia_id: e.target.value })}
                                >
                                    <option value="" disabled className="bg-slate-900">Seleccione un proceso...</option>
                                    {todasDependencias.map(d => (
                                        <option key={d.id} value={d.id} className="bg-slate-900">{d.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {/* Sección: Descripción */}
                    <div className="grid gap-6">
                        <div className="flex items-center gap-2 text-blue-400 border-b border-blue-400/20 pb-2 mb-2">
                            <FileText className="w-4 h-4" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider">Descripción del Proyecto</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="nombre" className="text-slate-200 font-medium ml-1 flex items-center gap-2">
                                    Meta Plan de Desarrollo <span className="text-red-500 text-xs">*</span>
                                </Label>
                                <Input
                                    id="nombre"
                                    value={formData.nombre_proyecto}
                                    onChange={(e) => setFormData({ ...formData, nombre_proyecto: e.target.value })}
                                    placeholder="Nombre completo basado en el PDD"
                                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-600 font-medium"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="objetivo" className="text-slate-200 font-medium ml-1">Objetivo General</Label>
                                <Textarea
                                    id="objetivo"
                                    value={formData.objetivo}
                                    onChange={(e) => setFormData({ ...formData, objetivo: e.target.value })}
                                    placeholder="Escriba el objetivo principal del proyecto..."
                                    className="bg-slate-800/50 border-slate-700/50 text-white placeholder:text-slate-600 min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sección: Metas y Presupuesto */}
                    <div className="grid gap-8">
                        <div className="grid md:grid-cols-2 gap-10">
                            {/* Metas Físicas */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-teal-400 border-b border-teal-400/20 pb-2 mb-2">
                                    <Target className="w-4 h-4" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">Metas Físicas</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="meta_cuatrienio" className="text-slate-300 text-xs">Meta Cuatrienio</Label>
                                        <Input
                                            id="meta_cuatrienio"
                                            type="number"
                                            value={formData.meta_cuatrienio}
                                            onChange={(e) => setFormData({ ...formData, meta_cuatrienio: e.target.value })}
                                            className="bg-slate-800/30 border-slate-700/50 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="meta_anual" className="text-slate-300 text-xs">Meta de Vigencia</Label>
                                        <Input
                                            id="meta_anual"
                                            type="number"
                                            value={formData.meta_anual}
                                            onChange={(e) => setFormData({ ...formData, meta_anual: e.target.value })}
                                            className="bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold focus:border-emerald-500/50 focus:ring-emerald-500/10"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Metas Financieras */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-amber-400 border-b border-amber-400/20 pb-2 mb-2">
                                    <DollarSign className="w-4 h-4" />
                                    <h3 className="text-sm font-semibold uppercase tracking-wider">Presupuesto</h3>
                                </div>
                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="presupuesto_asignado" className="text-slate-300 text-xs">Costos (Asignado)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                            <Input
                                                id="presupuesto_asignado"
                                                type="number"
                                                value={formData.presupuesto_asignado}
                                                onChange={(e) => setFormData({ ...formData, presupuesto_asignado: e.target.value })}
                                                className="bg-slate-800/30 border-slate-700/50 pl-7 text-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="presupuesto_ejecutado" className="text-slate-300 text-xs">Ejecutado (Monto)</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                            <Input
                                                id="presupuesto_ejecutado"
                                                type="number"
                                                value={formData.presupuesto_ejecutado}
                                                onChange={(e) => setFormData({ ...formData, presupuesto_ejecutado: e.target.value })}
                                                className="bg-amber-500/10 border-amber-500/20 pl-7 text-amber-400 font-bold focus:border-amber-500/50 focus:ring-amber-500/10"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección: Soportes */}
                    <div className="grid gap-6">
                        <div className="flex items-center gap-2 text-blue-400 border-b border-blue-400/20 pb-2 mb-2">
                            <LinkIcon className="w-4 h-4" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider">Evidencias y Soportes</h3>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="url" className="text-slate-200 font-medium ml-1">URL Google Drive / Secop</Label>
                            <Input
                                id="url"
                                value={formData.url_soporte}
                                onChange={e => setFormData({ ...formData, url_soporte: e.target.value })}
                                placeholder="https://drive.google.com/..."
                                className="bg-slate-800/50 border-slate-700/50 text-blue-400 underline-offset-4 focus:no-underline"
                            />
                            <p className="text-[10px] text-slate-500 ml-1">Asegúrese de que el enlace sea público para el equipo de Planeación.</p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => onOpenChange(false)} 
                        className="text-slate-400 hover:text-white hover:bg-white/10 transition-colors flex-1 md:flex-none h-11 px-8"
                    >
                        Descartar
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        disabled={loading} 
                        className="bg-blue-600 hover:bg-blue-500 text-white font-bold h-11 px-12 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-600/20 flex-1 md:flex-none"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {projectToEdit ? 'Actualizar Proyecto' : 'Registrar Proyecto'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
