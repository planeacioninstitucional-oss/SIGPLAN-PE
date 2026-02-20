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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { PlanAccionMunicipal } from '@/types/database'

interface PamDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vigenciaId: string
    dependenciaId: string
    pamToEdit: PlanAccionMunicipal | null
    onSuccess: () => void
}

export function PamDialog({
    open,
    onOpenChange,
    vigenciaId,
    dependenciaId,
    pamToEdit,
    onSuccess,
}: PamDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        eje_estrategico: '',
        programa: '',
        subprograma: '',
        meta_pdd: '',
        indicador: '',
        linea_base: '',
        meta_vigencia: '',
        logro_vigencia: '',
        fuente_financiacion: '',
        presupuesto: '',
        estado: 'gris',
        observaciones: '',
        url_soporte: '',
    })
    const supabase = createClient()

    useEffect(() => {
        if (pamToEdit) {
            setFormData({
                eje_estrategico: pamToEdit.eje_estrategico,
                programa: pamToEdit.programa,
                subprograma: pamToEdit.subprograma || '',
                meta_pdd: pamToEdit.meta_pdd,
                indicador: pamToEdit.indicador || '',
                linea_base: pamToEdit.linea_base?.toString() || '',
                meta_vigencia: pamToEdit.meta_vigencia?.toString() || '',
                logro_vigencia: pamToEdit.logro_vigencia?.toString() || '',
                fuente_financiacion: pamToEdit.fuente_financiacion || '',
                presupuesto: pamToEdit.presupuesto?.toString() || '',
                estado: pamToEdit.estado || 'gris',
                observaciones: pamToEdit.observaciones || '',
                url_soporte: pamToEdit.url_soporte || '',
            })
        } else {
            setFormData({
                eje_estrategico: '',
                programa: '',
                subprograma: '',
                meta_pdd: '',
                indicador: '',
                linea_base: '',
                meta_vigencia: '',
                logro_vigencia: '',
                fuente_financiacion: '',
                presupuesto: '',
                estado: 'gris',
                observaciones: '',
                url_soporte: '',
            })
        }
    }, [pamToEdit, open])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const payload: any = {
                vigencia_id: vigenciaId,
                dependencia_id: dependenciaId,
                eje_estrategico: formData.eje_estrategico,
                programa: formData.programa,
                subprograma: formData.subprograma,
                meta_pdd: formData.meta_pdd,
                indicador: formData.indicador,
                linea_base: parseFloat(formData.linea_base) || 0,
                meta_vigencia: parseFloat(formData.meta_vigencia) || 0,
                logro_vigencia: parseFloat(formData.logro_vigencia) || 0,
                fuente_financiacion: formData.fuente_financiacion,
                presupuesto: parseFloat(formData.presupuesto) || 0,
                estado: formData.estado,
                observaciones: formData.observaciones,
                url_soporte: formData.url_soporte,
                updated_at: new Date().toISOString(),
            }

            const { error } = await supabase
                .from('plan_accion_municipal')
                .upsert(
                    pamToEdit ? { id: pamToEdit.id, ...payload } : payload
                )

            if (error) throw error

            toast.success('Registro guardado correctamente')
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
                    <DialogTitle>{pamToEdit ? 'Editar Registro PAM' : 'Nuevo Registro PAM'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Eje Estratégico</Label>
                            <Input
                                value={formData.eje_estrategico}
                                onChange={(e) => setFormData({ ...formData, eje_estrategico: e.target.value })}
                                placeholder="Eje..."
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Estado</Label>
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

                    <div className="grid gap-2">
                        <Label>Programa</Label>
                        <Input value={formData.programa} onChange={e => setFormData({ ...formData, programa: e.target.value })} placeholder="Nombre del programa" />
                    </div>

                    <div className="grid gap-2">
                        <Label>Meta PDD Asignada</Label>
                        <Textarea value={formData.meta_pdd} onChange={e => setFormData({ ...formData, meta_pdd: e.target.value })} placeholder="Descripción de la meta..." />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Indicador</Label>
                            <Input value={formData.indicador} onChange={e => setFormData({ ...formData, indicador: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Línea Base</Label>
                            <Input type="number" value={formData.linea_base} onChange={e => setFormData({ ...formData, linea_base: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Meta Vigencia</Label>
                            <Input type="number" value={formData.meta_vigencia} onChange={e => setFormData({ ...formData, meta_vigencia: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Logro Vigencia</Label>
                            <Input type="number" value={formData.logro_vigencia} onChange={e => setFormData({ ...formData, logro_vigencia: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Fuente Financiación</Label>
                            <Input value={formData.fuente_financiacion} onChange={e => setFormData({ ...formData, fuente_financiacion: e.target.value })} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Presupuesto</Label>
                            <Input type="number" value={formData.presupuesto} onChange={e => setFormData({ ...formData, presupuesto: e.target.value })} />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Observaciones</Label>
                        <Textarea value={formData.observaciones} onChange={e => setFormData({ ...formData, observaciones: e.target.value })} />
                    </div>
                    <div className="grid gap-2">
                        <Label>URL Soporte</Label>
                        <Input value={formData.url_soporte} onChange={e => setFormData({ ...formData, url_soporte: e.target.value })} placeholder="https://..." />
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
