'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { CHECKPOINTS, type Dependencia, type AlistamientoAuditoria, type RolUsuario } from '@/types/database'
import { Button } from '@/components/ui/button'
import { PermisoGuard } from '@/components/auth/PermisoGuard'

export default function AlistamientoPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [dependencias, setDependencias] = useState<Dependencia[]>([])
    const [alistamientos, setAlistamientos] = useState<AlistamientoAuditoria[]>([])
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, dependencia_id: string } | null>(null)

    const supabase = createClient()

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            const { data: profile } = await supabase
                .from('perfiles')
                .select('*')
                .eq('id', user.id)
                .single()
            if (profile) setUserProfile(profile as any)
        }
        init()
    }, [])

    useEffect(() => {
        if (!vigenciaActual) return
        fetchData()
    }, [vigenciaActual])

    const fetchData = async () => {
        if (!vigenciaActual) return
        setLoading(true)
        try {
            const [depsRes, aliRes] = await Promise.all([
                supabase.from('dependencias').select('*').order('nombre'),
                supabase.from('alistamiento_auditoria').select('*').eq('vigencia_id', vigenciaActual.id)
            ])
            if (depsRes.error) throw depsRes.error
            if (aliRes.error) throw aliRes.error
            setDependencias(depsRes.data)
            setAlistamientos(aliRes.data)
        } catch (error) {
            toast.error('Error cargando datos de alistamiento')
        } finally {
            setLoading(false)
        }
    }

    const handleToggle = async (dependenciaId: string, checkpoint: string, currentValue: boolean) => {
        if (!['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '')) {
            toast.error('No tienes permisos para editar, solo visualización')
            return
        }

        const newValue = !currentValue

        const existing = alistamientos.find(a =>
            a.dependencia_id === dependenciaId &&
            a.checkpoint_name === checkpoint
        )

        const newAlistamientos = [...alistamientos]
        if (existing) {
            existing.cumplido = newValue
            setAlistamientos(newAlistamientos)
        } else {
            setAlistamientos([...newAlistamientos, {
                id: 'temp-' + Date.now(),
                vigencia_id: vigenciaActual!.id,
                dependencia_id: dependenciaId,
                checkpoint_name: checkpoint,
                cumplido: newValue,
                observacion: null,
                updated_by: userProfile?.id || null,
                updated_at: new Date().toISOString()
            }])
        }

        try {
            const payload = {
                vigencia_id: vigenciaActual!.id,
                dependencia_id: dependenciaId,
                checkpoint_name: checkpoint,
                cumplido: newValue,
                updated_by: userProfile?.id,
                updated_at: new Date().toISOString()
            }

            const { data, error } = await supabase
                .from('alistamiento_auditoria')
                .select('id')
                .eq('vigencia_id', vigenciaActual!.id)
                .eq('dependencia_id', dependenciaId)
                .eq('checkpoint_name', checkpoint)
                .maybeSingle()

            if (data) {
                await supabase.from('alistamiento_auditoria').update({ cumplido: newValue, updated_at: new Date().toISOString() }).eq('id', data.id)
            } else {
                await supabase.from('alistamiento_auditoria').insert(payload)
            }
        } catch (error) {
            toast.error('Error al guardar')
            fetchData()
        }
    }

    if (!vigenciaActual) {
        return <div className="p-8 text-center text-slate-400">Seleccione una vigencia</div>
    }

    return (
        <PermisoGuard modulo="alistamiento">
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Alistamiento de Auditoría</h1>
                    <p className="text-gray-500 dark:text-slate-400">Control de requisitos para auditoría de gestión</p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading} className="border-gray-300 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800">
                    Actualizar
                </Button>
            </div>

            <Card className="card-glass border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-slate-200">Matriz de Cumplimiento</CardTitle>
                    <CardDescription className="text-gray-500 dark:text-slate-400">
                        Marque los items cumplidos por dependencia. Solo el Equipo de Planeación puede editar.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto max-h-[70vh]">
                            <Table>
                                <TableHeader className="bg-gray-50/90 dark:bg-slate-900/90 py-4 sticky top-0 z-20">
                                    <TableRow className="border-gray-200 dark:border-slate-800">
                                        <TableHead className="w-[300px] bg-gray-50/90 dark:bg-slate-900/90 text-gray-800 dark:text-slate-300 font-bold sticky left-0 z-20 border-r border-gray-200 dark:border-slate-800">
                                            Dependencia
                                        </TableHead>
                                        <TableHead className="text-center min-w-[100px] text-gray-600 dark:text-slate-300 bg-gray-50/90 dark:bg-slate-900/90 border-r border-gray-200 dark:border-slate-800">
                                            % Avance
                                        </TableHead>
                                        {CHECKPOINTS.map((cp) => (
                                            <TableHead key={cp} className="text-center min-w-[120px] text-gray-600 dark:text-slate-300 bg-gray-50/90 dark:bg-slate-900/90">
                                                <div className="text-xs">{cp}</div>
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {dependencias.map(dep => {
                                        const depAlistamientos = alistamientos.filter(a => a.dependencia_id === dep.id && a.cumplido)
                                        const progress = (depAlistamientos.length / CHECKPOINTS.length) * 100

                                        return (
                                            <TableRow key={dep.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 border-gray-200 dark:border-slate-800">
                                                <TableCell className="font-medium text-gray-900 dark:text-slate-300 sticky left-0 bg-white dark:bg-slate-950/90 z-10 border-r border-gray-200 dark:border-slate-800">
                                                    {dep.nombre}
                                                </TableCell>
                                                <TableCell className="p-4 w-[150px]">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`text-xs font-bold ${progress === 100 ? 'text-green-400' : 'text-slate-400'}`}>
                                                            {Math.round(progress)}%
                                                        </span>
                                                        <Progress value={progress} className="h-2" indicatorClassName={progress === 100 ? 'bg-green-500' : 'bg-blue-500'} />
                                                    </div>
                                                </TableCell>
                                                {CHECKPOINTS.map(cp => {
                                                    const isChecked = alistamientos.some(a =>
                                                        a.dependencia_id === dep.id &&
                                                        a.checkpoint_name === cp &&
                                                        a.cumplido
                                                    )
                                                    return (
                                                        <TableCell key={cp} className="text-center">
                                                            <div className="flex justify-center">
                                                                <Checkbox
                                                                    checked={isChecked}
                                                                    onCheckedChange={() => handleToggle(dep.id, cp, isChecked)}
                                                                    className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500 disabled:opacity-50"
                                                                    disabled={!['super_admin', 'equipo_planeacion'].includes(userProfile?.rol || '')}
                                                                />
                                                            </div>
                                                        </TableCell>
                                                    )
                                                })}
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
        </PermisoGuard>
    )
}
