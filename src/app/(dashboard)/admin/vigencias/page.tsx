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
import { Loader2, Calendar, Plus, Edit } from 'lucide-react'
import type { Vigencia } from '@/types/database'
import { VigenciaDialog } from '@/components/admin/VigenciaDialog'

export default function AdminVigenciasPage() {
    const [loading, setLoading] = useState(true)
    const [vigencias, setVigencias] = useState<Vigencia[]>([])

    // Dialog State
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingVigencia, setEditingVigencia] = useState<Vigencia | null>(null)

    const supabase = createClient()

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase.from('vigencias').select('*').order('anio', { ascending: false })
            if (error) throw error
            setVigencias(data || [])
        } catch (error) {
            toast.error('Error cargando vigencias')
        } finally {
            setLoading(false)
        }
    }

    const handleEdit = (v: Vigencia | null) => {
        setEditingVigencia(v)
        setDialogOpen(true)
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Vigencias</h1>
                    <p className="text-muted-foreground">Gestión de periodos anuales</p>
                </div>
                <Button onClick={() => handleEdit(null)} className="bg-blue-600 hover:bg-blue-500">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Vigencia
                </Button>
            </div>

            <Card className="card-glass border-border bg-card">
                <CardHeader>
                    <CardTitle className="text-foreground">Vigencias Registradas</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-muted/80">
                                <TableRow className="border-border">
                                    <TableHead className="text-muted-foreground font-bold">Año</TableHead>
                                    <TableHead className="text-muted-foreground font-bold">Descripción</TableHead>
                                    <TableHead className="text-center text-muted-foreground font-bold">Estado</TableHead>
                                    <TableHead className="text-right text-muted-foreground font-bold">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {vigencias.map((v) => (
                                    <TableRow key={v.id} className="hover:bg-muted/50 border-border">
                                        <TableCell className="font-bold text-lg text-foreground">
                                            {v.anio}
                                        </TableCell>
                                        <TableCell className="text-foreground">
                                            {v.descripcion}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant={v.estado === 'activa' ? 'verde' : v.estado === 'planificacion' ? 'amarillo' : 'gris'} className="uppercase">
                                                {v.estado}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(v)}>
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

            <VigenciaDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                vigenciaToEdit={editingVigencia}
                onSuccess={fetchData}
            />
        </div>
    )
}
