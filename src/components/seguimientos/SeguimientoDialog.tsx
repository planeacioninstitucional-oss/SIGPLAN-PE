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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { Loader2, ExternalLink } from 'lucide-react'
import type { Seguimiento, Instrumento, Dependencia, RolUsuario } from '@/types/database'
import { SemaforoCell } from './SemaforoCell'
import { createNotification, notifyUsersByRole } from '@/lib/notifications'

interface SeguimientoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    vigenciaId: string
    dependencia: Dependencia
    instrumento: Instrumento
    periodo: string
    seguimientoExistente: Seguimiento | null
    userRole: RolUsuario
    userId: string
    isAssigned?: boolean // Para validar responsabilidades del equipo de planeación
    hasModuleEditPerm?: boolean // Permiso granular (por oficina o usuario)
    onSuccess: () => void
}

export function SeguimientoDialog({
    open,
    onOpenChange,
    vigenciaId,
    dependencia,
    instrumento,
    periodo,
    seguimientoExistente,
    userRole,
    userId,
    isAssigned = false,
    hasModuleEditPerm = false,
    onSuccess,
}: SeguimientoDialogProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        estado_semaforo: 'gris',
        url_evidencia: '',
        porcentaje_fisico: '',
        porcentaje_financiero: '',
        hubo_materializacion_riesgo: false,
        url_saro: '',
        observacion_oficina: '',
        observacion_planeacion: '',
    })
    const supabase = createClient()

    // ─── Control de Permisos ───────────────────────────────────────────────
    const esSuperAdmin = userRole === 'super_admin'
    const esEquipoPlaneacion = userRole === 'equipo_planeacion'
    
    const [esSandra, setEsSandra] = useState(false)

    useEffect(() => {
        const checkSandra = async () => {
            if (!userId) return
            const { data } = await supabase.from('perfiles').select('nombre_completo').eq('id', userId).single()
            if (data?.nombre_completo?.toLowerCase().includes('sandra maritza machado')) {
                setEsSandra(true)
            }
        }
        checkSandra()
    }, [userId, supabase])

    // Lógica de Permisos: 
    // 1. Super Admin puede todo.
    // 2. Equipo de Planeación puede si está asignado (o si el usuario quiere "todo el control", por ahora habilitamos todo para ellos).
    // 3. Sandra Maritza Machado puede editar específicamente "Plan de Acción Institucional" (aunque tenga rol jefe).
    // 4. Cualquier usuario con permiso granular de edición para el módulo de seguimientos.
    const tienePermisoEdicion = esSuperAdmin || 
                               esEquipoPlaneacion || // "Todo el control" para el equipo de planeación
                               hasModuleEditPerm ||  // Permiso otorgado en "Permisos por Oficina"
                               (esSandra && instrumento.nombre === 'Plan de Acción Institucional')

    const canEditOficina = tienePermisoEdicion
    const canEditEvaluador = tienePermisoEdicion
    const isReadOnly = !tienePermisoEdicion

    // Load existing data
    useEffect(() => {
        if (seguimientoExistente) {
            setFormData({
                estado_semaforo: seguimientoExistente.estado_semaforo,
                url_evidencia: seguimientoExistente.url_evidencia || '',
                porcentaje_fisico: seguimientoExistente.porcentaje_fisico?.toString() || '',
                porcentaje_financiero: seguimientoExistente.porcentaje_financiero?.toString() || '',
                hubo_materializacion_riesgo: seguimientoExistente.hubo_materializacion_riesgo || false,
                url_saro: seguimientoExistente.url_saro || '',
                observacion_oficina: seguimientoExistente.observacion_oficina || '',
                observacion_planeacion: seguimientoExistente.observacion_planeacion || '',
            })
        } else {
            // Reset defaults for new
            setFormData({
                estado_semaforo: 'gris',
                url_evidencia: '',
                porcentaje_fisico: '',
                porcentaje_financiero: '',
                hubo_materializacion_riesgo: false,
                url_saro: '',
                observacion_oficina: '',
                observacion_planeacion: '',
            })
        }
    }, [seguimientoExistente, open])

    const handleSubmit = async () => {
        setLoading(true)
        try {
            // Prepare payload
            const payload: any = {
                vigencia_id: vigenciaId,
                dependencia_id: dependencia.id,
                instrumento_id: instrumento.id,
                periodo_corte: periodo,
                url_evidencia: formData.url_evidencia || null,
                observacion_oficina: formData.observacion_oficina || null,
                updated_at: new Date().toISOString(),
            }

            // Oficina fields
            if (canEditOficina) {
                // Validación de porcentajes (0-100) para evitar error de constraint en base de datos
                const pFisico = formData.porcentaje_fisico ? parseFloat(formData.porcentaje_fisico) : null
                const pFinanciero = formData.porcentaje_financiero ? parseFloat(formData.porcentaje_financiero) : null
                
                payload.porcentaje_fisico = pFisico !== null ? Math.min(100, Math.max(0, pFisico)) : null
                payload.porcentaje_financiero = pFinanciero !== null ? Math.min(100, Math.max(0, pFinanciero)) : null
                payload.hubo_materializacion_riesgo = formData.hubo_materializacion_riesgo
                payload.url_saro = formData.url_saro || null
                payload.subido_por = userId

                // Auto-set semaforo to yellow/verde if EVIDENCE is provided (basic logic, can be overridden by evaluador)
                if (!seguimientoExistente && payload.url_evidencia) {
                    payload.estado_semaforo = 'amarillo' // Pending review
                }
            }

            // Evaluador fields
            if (canEditEvaluador) {
                payload.estado_semaforo = formData.estado_semaforo
                payload.observacion_planeacion = formData.observacion_planeacion || null
                payload.evaluado_por = userId
            }

            const { error } = await supabase
                .from('seguimientos')
                .upsert(
                    seguimientoExistente ? { id: seguimientoExistente.id, ...payload } : payload
                )

            if (error) throw error

            // --- Notification Logic ---
            if (canEditOficina) {
                // Notify Planeación admins that something was subido/updated
                await notifyUsersByRole(['super_admin', 'equipo_planeacion'], {
                    titulo: `Nuevo Seguimiento: ${instrumento.nombre}`,
                    mensaje: `La oficina ${dependencia.nombre} ha subido un reporte para ${periodo}.`,
                    tipo: 'info',
                    link: `/seguimientos`,
                    metadata: { seguimiento_id: seguimientoExistente?.id, instrumento_id: instrumento.id }
                })
            }

            if (canEditEvaluador) {
                // Find the office_id associated with this process name
                const { data: procData } = await supabase
                    .from('procesos_institucionales')
                    .select('oficina_id')
                    .ilike('nombre', `%${dependencia.nombre.replace('Gestión ', '').replace('Gestion ', '').trim()}%`)
                    .limit(1)
                    .single()

                const targetOficinaId = procData?.oficina_id || dependencia.id

                const { data: officeUsers } = await supabase
                    .from('perfiles')
                    .select('id')
                    .eq('oficina_id', targetOficinaId)
                    .eq('rol', 'jefe_oficina')

                if (officeUsers && officeUsers.length > 0) {
                    const notifs = officeUsers.map(u => ({
                        user_id: u.id,
                        titulo: `Evaluación de Seguimiento: ${instrumento.nombre}`,
                        mensaje: `Planeación ha evaluado el reporte de ${periodo}. Estado: ${formData.estado_semaforo.toUpperCase()}`,
                        tipo: formData.estado_semaforo === 'rojo' ? 'warning' : 'success',
                        link: `/mi-gestion`,
                        metadata: { seguimiento_id: seguimientoExistente?.id }
                    }))
                    await supabase.from('notificaciones').insert(notifs)
                }
            }
            // --------------------------

            toast.success('Seguimiento guardado correctamente')
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
            <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700">
                <DialogHeader>
                    <DialogTitle>Reporte de Seguimiento</DialogTitle>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground mt-2">
                        <p><span className="font-semibold text-foreground">Dependencia:</span> {dependencia.nombre}</p>
                        <p><span className="font-semibold text-foreground">Instrumento:</span> {instrumento.nombre}</p>
                        <p><span className="font-semibold text-foreground">Periodo:</span> {periodo}</p>
                    </div>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Oficina Section */}
                    <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                        <h3 className="text-sm font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                            Diligenciamiento Oficina
                        </h3>

                        {instrumento.requiere_link && (
                            <div className="grid gap-2">
                                <Label htmlFor="url_evidencia">Enlace a Evidencia (Drive) *</Label>
                                <div className="relative">
                                    <Input
                                        id="url_evidencia"
                                        value={formData.url_evidencia}
                                        onChange={(e) => setFormData({ ...formData, url_evidencia: e.target.value })}
                                        placeholder="https://drive.google.com/..."
                                        disabled={!canEditOficina}
                                    />
                                    {formData.url_evidencia && (
                                        <a
                                            href={formData.url_evidencia}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}

                        {instrumento.requiere_porcentajes && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="fisico">% Avance Físico</Label>
                                    <Input
                                        id="fisico"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.porcentaje_fisico}
                                        onChange={(e) => setFormData({ ...formData, porcentaje_fisico: e.target.value })}
                                        disabled={!canEditOficina}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="financiero">% Avance Financiero</Label>
                                    <Input
                                        id="financiero"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={formData.porcentaje_financiero}
                                        onChange={(e) => setFormData({ ...formData, porcentaje_financiero: e.target.value })}
                                        disabled={!canEditOficina}
                                    />
                                </div>
                            </div>
                        )}

                        {instrumento.requiere_riesgo && (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    {/* Reuse Checkbox or Input type checkbox */}
                                    <input
                                        type="checkbox"
                                        id="materializacion"
                                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                                        checked={formData.hubo_materializacion_riesgo}
                                        onChange={(e) => setFormData({ ...formData, hubo_materializacion_riesgo: e.target.checked })}
                                        disabled={!canEditOficina}
                                    />
                                    <Label htmlFor="materializacion">¿Hubo materialización de riesgo?</Label>
                                </div>

                                {formData.hubo_materializacion_riesgo && (
                                    <div className="grid gap-2 animate-in fade-in slide-in-from-top-2">
                                        <Label htmlFor="url_saro">Enlace Formato SARO (FOR-GR-003) *</Label>
                                        <Input
                                            id="url_saro"
                                            value={formData.url_saro}
                                            onChange={(e) => setFormData({ ...formData, url_saro: e.target.value })}
                                            placeholder="https://drive.google.com/..."
                                            disabled={!canEditOficina}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid gap-2">
                            <Label htmlFor="obs_oficina">Observaciones Oficina</Label>
                            <Textarea
                                id="obs_oficina"
                                value={formData.observacion_oficina}
                                onChange={(e) => setFormData({ ...formData, observacion_oficina: e.target.value })}
                                disabled={!canEditOficina}
                                placeholder="Comentarios adicionales..."
                            />
                        </div>
                    </div>

                    {/* Planeacion Section */}
                    {(canEditEvaluador || seguimientoExistente?.observacion_planeacion) && (
                        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border border-border">
                            <h3 className="text-sm font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                                Evaluación Planeación
                            </h3>

                            <div className="grid gap-2">
                                <Label>Semáforo de Cumplimiento</Label>
                                <div className="flex gap-4 items-center">
                                    {['verde', 'amarillo', 'rojo'].map((color) => (
                                        <div
                                            key={color}
                                            onClick={() => canEditEvaluador && setFormData({ ...formData, estado_semaforo: color as any })}
                                            className={`cursor-pointer transition-transform ${formData.estado_semaforo === color ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                                        >
                                            <SemaforoCell
                                                estado={color as any}
                                                className="w-8 h-8"
                                                onClick={() => canEditEvaluador && setFormData({ ...formData, estado_semaforo: color as any })}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="obs_planeacion">Observaciones Evaluador</Label>
                                <Textarea
                                    id="obs_planeacion"
                                    value={formData.observacion_planeacion}
                                    onChange={(e) => setFormData({ ...formData, observacion_planeacion: e.target.value })}
                                    disabled={!canEditEvaluador}
                                    placeholder="Retroalimentación..."
                                    className="border-purple-500/20"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    {!isReadOnly && (
                        <Button onClick={handleSubmit} disabled={loading} className="bg-blue-600 hover:bg-blue-500">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Cambios
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
