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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import type { Perfil, Dependencia, RolUsuario } from '@/types/database'
import { Checkbox } from '@/components/ui/checkbox'

interface UserDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    userToEdit: Perfil | null
    dependencias: Dependencia[]
    onSuccess: () => void
}

export function UserDialog({
    open,
    onOpenChange,
    userToEdit,
    dependencias,
    onSuccess,
}: UserDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<{
        rol: RolUsuario
        dependencia_id: string | null
        activo: boolean
    }>({
        rol: 'jefe_oficina',
        dependencia_id: null,
        activo: true,
    })

    const supabase = createClient()

    useEffect(() => {
        if (userToEdit) {
            setFormData({
                rol: userToEdit.rol,
                dependencia_id: userToEdit.dependencia_id,
                activo: userToEdit.activo,
            })
        }
    }, [userToEdit, open])

    const handleSubmit = async () => {
        if (!userToEdit) return // Only editing existing users supported for now unless we add Invite logic

        setLoading(true)
        try {
            const { error } = await supabase
                .from('perfiles')
                .update({
                    rol: formData.rol,
                    dependencia_id: formData.dependencia_id === 'none' ? null : formData.dependencia_id, // Handle clear selection
                    activo: formData.activo,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userToEdit.id)

            if (error) throw error

            toast.success('Usuario actualizado')
            onSuccess()
            onOpenChange(false)
        } catch (error: any) {
            toast.error('Error al actualizar', { description: error.message })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Usuario: {userToEdit?.email}</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label>Rol</Label>
                        <Select
                            value={formData.rol}
                            onValueChange={(val) => setFormData({ ...formData, rol: val as RolUsuario })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                                <SelectItem value="equipo_planeacion">Equipo Planeación</SelectItem>
                                <SelectItem value="jefe_oficina">Jefe de Oficina</SelectItem>
                                <SelectItem value="gerente">Gerente</SelectItem>
                                <SelectItem value="auditor_externo">Auditor Externo</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Dependencia</Label>
                        <Select
                            value={formData.dependencia_id || 'none'}
                            onValueChange={(val) => setFormData({ ...formData, dependencia_id: val === 'none' ? null : val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione dependencia..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">-- Ninguna --</SelectItem>
                                {dependencias.map(dep => (
                                    <SelectItem key={dep.id} value={dep.id}>{dep.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="activo"
                            checked={formData.activo}
                            onCheckedChange={(c) => setFormData({ ...formData, activo: c as boolean })}
                        />
                        <Label htmlFor="activo">Usuario Activo</Label>
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
