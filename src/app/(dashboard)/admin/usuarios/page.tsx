'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Loader2, Edit, UserCog, Users, Building2, RefreshCw } from 'lucide-react'
import type { Perfil, Oficina, ROL_LABELS } from '@/types/database'
import { UserDialog } from '@/components/admin/UserDialog'

const ROL_BADGE_COLOR: Record<string, string> = {
    super_admin: 'bg-red-500/20 text-red-300 border-red-500/30',
    equipo_planeacion: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    jefe_oficina: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    gerente: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    auditor: 'bg-green-500/20 text-green-300 border-green-500/30',
}

const ROL_LABELS_ES: Record<string, string> = {
    super_admin: 'Super Admin',
    equipo_planeacion: 'Equipo Planeación',
    jefe_oficina: 'Jefe de Oficina',
    gerente: 'Gerente',
    auditor: 'Auditor',
}

export default function AdminUsuariosPage() {
    const [loading, setLoading] = useState(true)
    const [users, setUsers] = useState<Perfil[]>([])
    const [oficinas, setOficinas] = useState<Oficina[]>([])

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<Perfil | null>(null)

    const supabase = createClient()

    useEffect(() => { fetchData() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const fetchData = async () => {
        setLoading(true)
        try {
            const [usersRes, oficinasRes] = await Promise.all([
                supabase
                    .from('perfiles')
                    .select('*, oficinas(nombre, abreviatura)')
                    .order('created_at', { ascending: false }),
                supabase
                    .from('oficinas')
                    .select('*')
                    .eq('activa', true)
                    .order('nombre'),
            ])

            if (usersRes.error) throw usersRes.error
            if (oficinasRes.error) throw oficinasRes.error

            setUsers(usersRes.data as Perfil[] || [])
            setOficinas(oficinasRes.data as Oficina[] || [])
        } catch (err: any) {
            toast.error('Error cargando datos', { description: err.message })
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (user: Perfil) => {
        setEditingUser(user)
        setDialogOpen(true)
    }

    const handleDelete = async (user: Perfil) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar a ${user.nombre_completo}?`)) return
        
        try {
            const { error } = await supabase
                .from('perfiles')
                .delete()
                .eq('id', user.id)
            
            if (error) throw error
            toast.success('Usuario eliminado correctamente')
            fetchData()
        } catch (err: any) {
            toast.error('Error al eliminar', { description: err.message })
        }
    }

    // Stats
    const activos = users.filter(u => u.activo).length
    const inactivos = users.length - activos

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <UserCog className="w-8 h-8 text-blue-500 dark:text-blue-400" />
                        Gestión de Usuarios
                    </h1>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Administra perfiles, roles y asignación de oficinas</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-500 text-white"
                        onClick={() => {
                            setEditingUser(null)
                            setDialogOpen(true)
                        }}
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Nuevo Usuario
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchData}
                        disabled={loading}
                        className="border-slate-700 hover:border-slate-600"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        <span className="ml-2 hidden sm:inline">Actualizar</span>
                    </Button>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Usuarios', value: users.length, icon: Users, color: 'text-blue-400' },
                    { label: 'Activos', value: activos, icon: Users, color: 'text-green-400' },
                    { label: 'Inactivos', value: inactivos, icon: Users, color: 'text-red-400' },
                    { label: 'Oficinas', value: oficinas.length, icon: Building2, color: 'text-purple-400' },
                ].map(stat => (
                    <div key={stat.label} className="p-4 rounded-xl border border-gray-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                        <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-500 dark:text-slate-500">{stat.label}</p>
                    </div>
                ))}
            </div>

            <Card className="card-glass border-gray-200 dark:border-slate-800">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-slate-200">Usuarios Registrados</CardTitle>
                    <CardDescription>
                        Haz clic en <strong>Editar</strong> para cambiar rol, oficina o estado de un usuario
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-slate-400">
                            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando usuarios...
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-slate-900/90">
                                    <TableRow>
                                        <TableHead className="text-gray-700 dark:text-slate-300">Usuario</TableHead>
                                        <TableHead className="text-gray-700 dark:text-slate-300">Cargo</TableHead>
                                        <TableHead className="text-gray-700 dark:text-slate-300">Rol</TableHead>
                                        <TableHead className="text-gray-700 dark:text-slate-300">Oficina</TableHead>
                                        <TableHead className="text-center text-gray-700 dark:text-slate-300">Estado</TableHead>
                                        <TableHead className="text-right text-gray-700 dark:text-slate-300">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                                                No hay usuarios registrados aún
                                            </TableCell>
                                        </TableRow>
                                    ) : users.map(user => (
                                        <TableRow key={user.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 dark:text-slate-200">
                                                        {user.nombre_completo || '—'}
                                                    </span>
                                                    <span className="text-xs text-gray-500 dark:text-slate-500">{user.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600 dark:text-slate-400 text-sm">
                                                {user.cargo || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${ROL_BADGE_COLOR[user.rol] ?? 'bg-slate-500/20 text-slate-300 border-slate-500/30'}`}>
                                                    {ROL_LABELS_ES[user.rol] ?? user.rol}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-700 dark:text-slate-300 text-sm">
                                                {user.oficinas?.nombre || '—'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={user.activo ? 'verde' : 'rojo'}>
                                                    {user.activo ? 'Activo' : 'Inactivo'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleEdit(user)}
                                                        className="hover:bg-blue-500/10 hover:text-blue-400"
                                                    >
                                                        <Edit className="w-4 h-4 mr-1.5" />
                                                        Editar
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(user)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                userToEdit={editingUser}
                oficinas={oficinas}
                onSuccess={fetchData}
            />
        </div>
    )
}
