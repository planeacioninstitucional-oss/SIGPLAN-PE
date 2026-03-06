'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Perfil, Oficina, RolUsuario, ROL_LABELS } from '@/types/database'
import { Checkbox } from '@/components/ui/checkbox'

const ROL_LIST: { value: RolUsuario; label: string }[] = [
    { value: 'super_admin', label: 'Super Administrador' },
    { value: 'jefe_oficina', label: 'Jefe de Oficina' },
    { value: 'equipo_planeacion', label: 'Equipo de Planeación' },
    { value: 'gerente', label: 'Gerente' },
    { value: 'auditor', label: 'Auditor' },
]

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userToEdit: Perfil | null
    oficinas: Oficina[]
    onSuccess: () => void
}

export function UserDialog({
    open, onOpenChange, userToEdit, oficinas, onSuccess,
}: UserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<{
        rol: RolUsuario
        oficina_id: string | null
        activo: boolean
    }>({
        rol: 'jefe_oficina',
        oficina_id: null,
        activo: true,
    })

    const supabase = createClient()

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                rol: userToEdit.rol,
                oficina_id: userToEdit.oficina_id ?? null,
                activo: userToEdit.activo,
            })
        }
    }, [userToEdit, open])

    const handleSubmit = async () => {
        if (!userToEdit) return
        setLoading(true)
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    rol: formData.rol,
                    oficina_id: formData.oficina_id === 'none' ? null : formData.oficina_id,
                    activo: formData.activo,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', userToEdit.id)

            if (error) throw error
            toast.success('Usuario actualizado correctamente')
            onSuccess()
            onOpenChange(false)
        } catch (err: any) {
            toast.error('Error al actualizar', { description: err.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Usuario</DialogTitle>
                    <p className="text-sm text-slate-400">{userToEdit?.email}</p>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Rol */}
                    <div className="grid gap-2">
                        <Label>Rol en la plataforma</Label>
                        <Select
                            value={formData.rol}
                            onValueChange={val => setFormData({ ...formData, rol: val as RolUsuario })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {ROL_LIST.map(r => (
                                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Oficina */}
                    <div className="grid gap-2">
                        <Label>Oficina / Dependencia</Label>
                        <Select
                            value={formData.oficina_id || 'none'}
                            onValueChange={val => setFormData({ ...formData, oficina_id: val === 'none' ? null : val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione oficina..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Sin oficina --</SelectItem>
                                {oficinas.map(o => (
                                    <SelectItem key={o.id} value={o.id}>{o.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Activo */}
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="activo"
                            checked={formData.activo}
                            onCheckedChange={c => setFormData({ ...formData, activo: c as boolean })}
                        />
                        <Label htmlFor="activo">Usuario activo</Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
