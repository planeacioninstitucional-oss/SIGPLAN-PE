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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Vigencia, EstadoVigencia } from '@/types/database'

interface VigenciaDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vigenciaToEdit: Vigencia | null
    onSuccess: () => void
}

export function VigenciaDialog({
    open,
    onOpenChange,
    vigenciaToEdit,
    onSuccess,
}: VigenciaDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<{
        anio: string
        estado: EstadoVigencia
        descripcion: string
    }>({
        anio: new Date().getFullYear().toString(),
        estado: 'planificacion',
        descripcion: '',
    })

    const supabase = createClient()

    useEffect(() => {
        if (vigenciaToEdit) {
            setFormData({
                anio: vigenciaToEdit.anio.toString(),
                estado: vigenciaToEdit.estado,
                descripcion: vigenciaToEdit.descripcion || '',
            })
        } else {
            setFormData({
                anio: (new Date().getFullYear() + 1).toString(),
                estado: 'planificacion',
                descripcion: '',
            })
        }
    }, [vigenciaToEdit, open])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            const payload: any = {
                anio: parseInt(formData.anio),
                estado: formData.estado,
                descripcion: formData.descripcion,
                updated_at: new Date().toISOString()
            }

            const { error } = await supabase
                .from('vigencias')
                .upsert(
                    vigenciaToEdit ? { id: vigenciaToEdit.id, ...payload } : payload
                )

            if (error) throw error

            toast.success('Vigencia guardada')
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{vigenciaToEdit ? 'Editar Vigencia' : 'Nueva Vigencia'}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Año</Label>
                        <Input
                            type="number"
                            value={formData.anio}
                            onChange={e => setFormData({ ...formData, anio: e.target.value })}
                            disabled={!!vigenciaToEdit} // Prevent changing year once created to avoid confusion? Or allow. Better allow but warn.
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>Estado</Label>
                        <Select
                            value={formData.estado}
                            onValueChange={(val) => setFormData({ ...formData, estado: val as EstadoVigencia })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="planificacion">Planificación</SelectItem>
                                <SelectItem value="activa">Activa</SelectItem>
                                <SelectItem value="historica">Histórica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Descripción</Label>
                        <Input
                            value={formData.descripcion}
                            onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
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
