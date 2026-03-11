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
            <DialogContent className="max-w-md bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 border-gray-200 dark:border-slate-700">
                <DialogHeader>
                    <DialogTitle className="text-gray-900 dark:text-white">Editar Usuario</DialogTitle>
                    <p className="text-sm text-gray-500 dark:text-slate-400">{userToEdit?.email}</p>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Rol */}
                    <div className="grid gap-2">
                        <Label className="text-gray-700 dark:text-slate-300">Rol en la plataforma</Label>
                        <Select
                            value={formData.rol}
                            onValueChange={val => setFormData({ ...formData, rol: val as RolUsuario })}
                        >
                            <SelectTrigger className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200">
                                {ROL_LIST.map(r => (
                                    <SelectItem key={r.value} value={r.value} className="focus:bg-blue-50 dark:focus:bg-slate-700 focus:text-blue-900 dark:focus:text-white cursor-pointer">{r.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Oficina */}
                    <div className="grid gap-2">
                        <Label className="text-gray-700 dark:text-slate-300">Oficina / Dependencia</Label>
                        <Select
                            value={formData.oficina_id || 'none'}
                            onValueChange={val => setFormData({ ...formData, oficina_id: val === 'none' ? null : val })}
                        >
                            <SelectTrigger className="bg-gray-50 dark:bg-slate-800 border-gray-300 dark:border-slate-700 text-gray-900 dark:text-slate-200">
                                <SelectValue placeholder="Seleccione oficina..." />
                            </SelectTrigger>
                            <SelectContent className="bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-200 max-h-60 overflow-y-auto">
                                <SelectItem value="none" className="focus:bg-blue-50 dark:focus:bg-slate-700 focus:text-blue-900 dark:focus:text-white cursor-pointer">-- Sin oficina --</SelectItem>
                                {oficinas.map(o => (
                                    <SelectItem key={o.id} value={o.id} className="focus:bg-blue-50 dark:focus:bg-slate-700 focus:text-blue-900 dark:focus:text-white cursor-pointer">{o.nombre}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Activo */}
                    <div className="flex items-center space-x-3 mt-2">
                        <Checkbox
                            id="activo"
                            checked={formData.activo}
                            onCheckedChange={c => setFormData({ ...formData, activo: c as boolean })}
                            className="border-gray-400 dark:border-slate-500 data-[state=checked]:bg-blue-600"
                        />
                        <Label htmlFor="activo" className="text-gray-700 dark:text-slate-300 font-medium cursor-pointer">Usuario activo en el sistema</Label>
                    </div>
                </div>

                <DialogFooter className="mt-6 border-t border-gray-100 dark:border-slate-800 pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} className="bg-transparent border-gray-300 dark:border-slate-600 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white">Cancelar</Button>
                    <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 text-white hover:bg-blue-500">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar cambios
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
