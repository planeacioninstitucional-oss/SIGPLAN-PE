'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Edit, UserCog } from 'lucide-react'
import type { Perfil, Dependencia } from '@/types/database'
import { UserDialog } from '@/components/admin/UserDialog'

export default function AdminUsuariosPage() {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<Perfil[]>([])
    const [dependencias, setDependencias] = useState<Dependencia[]>([])

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Perfil | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [usersRes, depsRes] = await Promise.all([
                supabase.from('perfiles').select('*, dependencias(nombre)').order('created_at', { ascending: false }),
                supabase.from('dependencias').select('*').order('nombre')
            ])

            if (usersRes.error) throw usersRes.error
            if (depsRes.error) throw depsRes.error

            setUsers(usersRes.data || [])
            setDependencias(depsRes.data || [])
        } catch (error) {
            toast.error('Error cargando usuarios')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: Perfil) => {
        setEditingUser(user)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gestión de Usuarios</h1>
                    <p className="text-slate-400">Administración de perfiles y permisos</p>
                </div>
            </div>

            <Card className="card-glass border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-200">Usuarios Registrados</CardTitle>
                    <CardDescription>
                        {users.length} usuarios en el sistema
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-900/90">
                                <TableRow>
                                    <TableHead className="text-slate-300">Usuario</TableHead>
                                    <TableHead className="text-slate-300">Rol</TableHead>
                                    <TableHead className="text-slate-300">Dependencia</TableHead>
                                    <TableHead className="text-center text-slate-300">Estado</TableHead>
                                    <TableHead className="text-right text-slate-300">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-slate-800/50">
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-slate-200">{user.nombre_completo || 'Sin nombre'}</span>
                                                <span className="text-xs text-slate-500">{user.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="border-blue-500/50 text-blue-400 capitalize">
                                                {user.rol.replace('_', ' ')}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-300">
                                            {user.dependencias?.nombre || '-'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={user.activo ? 'verde' : 'rojo'}>
                                                {user.activo ? 'Activo' : 'Inactivo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(user)}>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Editar
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                userToEdit={editingUser}
                dependencias={dependencias}
                onSuccess={fetchData}
            />
        </div>
    )
}
