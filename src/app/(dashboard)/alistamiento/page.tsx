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
import { Loader2, Save } from 'lucide-react'
import { CHECKPOINTS, type Dependencia, type AlistamientoAuditoria, type RolUsuario } from '@/types/database'
import { Button } from '@/components/ui/button'

export default function AlistamientoPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [loading, setLoading] = useState(true)
    const [dependencias, setDependencias] = useState<Dependencia[]>([])
    const [alistamientos, setAlistamientos] = useState<AlistamientoAuditoria[]>([])
    const [userProfile, setUserProfile] = useState<{ id: string, rol: RolUsuario, dependencia_id: string } | null>(null)
    const [saving, setSaving] = useState(false)

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
        // Optimistic update
        const newValue = !currentValue

        // Find existing record to get ID if needed, or just upsert by keys?
        // Supabase upsert needs conflict target. `alistamiento_auditoria` likely needs unique constraint on (vigencia, dependencia, checkpoint) to work well with OnConflict.
        // I created the table but did I add unique constraint?
        // Let's assume I did or I'll handle it by finding ID.

        const existing = alistamientos.find(a =>
            a.dependencia_id === dependenciaId &&
            a.checkpoint_name === checkpoint
        )

        // Update local state immediately
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

            // If we have an ID and it's not temp, use it. Otherwise rely on composite key logic if table has it.
            // Actually, standard UPSERT in Supabase with `onConflict` requires a constraint.
            // If no constraint, I might duplicate.
            // Logic: select filtered by keys first? Or just try insert.
            // Filter:
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

            // Refetch to be sure of IDs
            // fetchData() // Maybe too aggressive?
        } catch (error) {
            toast.error('Error al guardar')
            // Revert on error?
            fetchData()
        }
    }

    if (!vigenciaActual) {
        return <div className="p-8 text-center text-slate-400">Seleccione una vigencia</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Alistamiento de Auditoría</h1>
                    <p className="text-slate-400">Control de requisitos para auditoría de gestión</p>
                </div>
                <Button variant="outline" onClick={fetchData} disabled={loading}>
                    Actualizar
                </Button>
            </div>

            <Card className="card-glass border-slate-800">
                <CardHeader>
                    <CardTitle className="text-slate-200">Matriz de Cumplimiento</CardTitle>
                    <CardDescription>
                        Marque los items cumplidos por dependencia.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative overflow-x-auto max-h-[70vh]">
                        <Table>
                            <TableHeader className="bg-slate-900/90 py-4 sticky top-0 z-20">
                                <TableRow>
                                    <TableHead className="w-[300px] bg-slate-900/90 text-slate-300 font-bold sticky left-0 z-20">
                                        Dependencia
                                    </TableHead>
                                    <TableHead className="text-center min-w-[100px] text-slate-300 bg-slate-900/90">
                                        % Avance
                                    </TableHead>
                                    {CHECKPOINTS.map((cp) => (
                                        <TableHead key={cp} className="text-center min-w-[120px] text-slate-300 bg-slate-900/90">
                                            <div className="text-xs">{cp}</div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {dependencias.map(dep => {
                                    // Calculate Progress
                                    const depAlistamientos = alistamientos.filter(a => a.dependencia_id === dep.id && a.cumplido)
                                    const progress = (depAlistamientos.length / CHECKPOINTS.length) * 100

                                    return (
                                        <TableRow key={dep.id} className="hover:bg-slate-800/50">
                                            <TableCell className="font-medium text-slate-300 sticky left-0 bg-slate-950/90 z-10 border-r border-slate-800">
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

                                                // Permission check: only admin, auditor, or the dependency owner (maybe?)
                                                // Requirement says "Audit Readiness". Usually maintained by Quality/Control?
                                                // Let's allow everyone with access to toggle for now, or restrict.
                                                // "Add bulk save logic" -> implied it's editable.

                                                return (
                                                    <TableCell key={cp} className="text-center">
                                                        <div className="flex justify-center">
                                                            <Checkbox
                                                                checked={isChecked}
                                                                onCheckedChange={() => handleToggle(dep.id, cp, isChecked)}
                                                                className="data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
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
                </CardContent>
            </Card>
        </div>
    )
}
