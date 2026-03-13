'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2, Shield, RefreshCw, Building2, Users, ListChecks, CheckCircle2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'

const MODULOS = [
    { key: 'seguimientos', label: 'Mesa de Control', fixed: true },
    { key: 'mis_instrumentos', label: 'Mis Instrumentos', editFixed: true },
    { key: 'metas_pdd', label: 'Metas PDD', fixed: false },
    { key: 'piip', label: 'Proyectos PIIP', fixed: false },
    { key: 'pam', label: 'Plan Acción Mun.', fixed: false },
    { key: 'alistamiento', label: 'Alistamiento', fixed: false },
    { key: 'importar', label: 'Importar Excel', fixed: false },
] as const

type ModuloKey = typeof MODULOS[number]['key']

interface PermisoRow {
    id?: string
    modulo: string
    puede_ver: boolean
    puede_editar: boolean
}

// --------------------------------------------------------------------------
// --- SUB-COMPONENT: Permisos por Oficina
// --------------------------------------------------------------------------
function PermisosOficinaTab({ oficinas, perms, onToggle, loading }: any) {
    return (
        <div className="space-y-4">
            {oficinas.map((oficina: any, oIdx: number) => {
                const oficinaPerms = perms.filter((p: any) => p.oficina_id === oficina.id)
                const getPerm = (mKey: string) => oficinaPerms.find((p: any) => p.modulo === mKey)

                return (
                    <Card key={oficina.id} className="card-glass border-border">
                        <CardHeader className="py-3 px-5 border-b border-border bg-muted/30">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <Building2 className="w-4 h-4 text-blue-500" />
                                {oficina.nombre}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto text-foreground">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/10">
                                        <th className="text-left px-4 py-2 font-semibold w-48">Módulo</th>
                                        {MODULOS.map(m => (
                                            <th key={m.key} className="text-center px-3 py-2 font-semibold min-w-[120px]">
                                                {m.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">
                                            👁 Ver
                                        </td>
                                        {MODULOS.map(m => {
                                            const perm = getPerm(m.key)
                                            const isFixed = m.key === 'seguimientos'
                                            const checked = isFixed ? true : (perm?.puede_ver ?? false)
                                            return (
                                                <td key={m.key} className="text-center px-3 py-3">
                                                    <Checkbox
                                                        checked={checked}
                                                        disabled={isFixed}
                                                        onCheckedChange={(val) => onToggle('oficina', oficina.id, m.key, 'puede_ver', val)}
                                                    />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                    <tr className="hover:bg-muted/20">
                                        <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">
                                            ✏️ Editar
                                        </td>
                                        {MODULOS.map(m => {
                                            const perm = getPerm(m.key)
                                            const isEditFixed = m.key === 'mis_instrumentos'
                                            const checked = isEditFixed ? false : (perm?.puede_editar ?? false)
                                            const disabled = isEditFixed || !(perm?.puede_ver ?? m.key === 'seguimientos')
                                            return (
                                                <td key={m.key} className="text-center px-3 py-3">
                                                    <Checkbox
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onCheckedChange={(val) => onToggle('oficina', oficina.id, m.key, 'puede_editar', val)}
                                                    />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// --------------------------------------------------------------------------
// --- SUB-COMPONENT: Permisos por Usuario (Planeación)
// --------------------------------------------------------------------------
function PermisosUsuarioTab({ usuarios, perms, onToggle, loading }: any) {
    return (
        <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl mb-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Configuración de Equipo:</strong> Estos permisos son exclusivos para el personal de Planeación. 
                    Permiten restringir o ampliar el acceso a módulos específicos independientemente de su oficina.
                </p>
            </div>
            {usuarios.map((user: any) => {
                const userPerms = perms.filter((p: any) => p.usuario_id === user.id)
                const getPerm = (mKey: string) => userPerms.find((p: any) => p.modulo === mKey)

                return (
                    <Card key={user.id} className="card-glass border-border">
                        <CardHeader className="py-3 px-5 border-b border-border bg-muted/30">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                                <Users className="w-4 h-4 text-violet-500" />
                                {user.nombre_completo} 
                                <span className="text-xs font-normal text-muted-foreground">({user.email})</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-x-auto font-medium text-foreground">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/10">
                                        <th className="text-left px-4 py-2 font-semibold w-48">Módulo</th>
                                        {MODULOS.map(m => (
                                            <th key={m.key} className="text-center px-3 py-2 font-semibold min-w-[120px]">
                                                {m.label}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="border-b border-border/50 hover:bg-muted/20">
                                        <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">
                                            👁 Ver
                                        </td>
                                        {MODULOS.map(m => {
                                            const perm = getPerm(m.key)
                                            const checked = perm?.puede_ver ?? false
                                            return (
                                                <td key={m.key} className="text-center px-3 py-3">
                                                    <Checkbox
                                                        checked={checked}
                                                        onCheckedChange={(val) => onToggle('usuario', user.id, m.key, 'puede_ver', val)}
                                                    />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                    <tr className="hover:bg-muted/20">
                                        <td className="px-4 py-3 font-medium text-muted-foreground uppercase text-[11px] tracking-wider">
                                            ✏️ Editar
                                        </td>
                                        {MODULOS.map(m => {
                                            const perm = getPerm(m.key)
                                            const checked = perm?.puede_editar ?? false
                                            const disabled = !checked && !perm?.puede_ver
                                            return (
                                                <td key={m.key} className="text-center px-3 py-3">
                                                    <Checkbox
                                                        checked={checked}
                                                        disabled={disabled}
                                                        onCheckedChange={(val) => onToggle('usuario', user.id, m.key, 'puede_editar', val)}
                                                    />
                                                </td>
                                            )
                                        })}
                                    </tr>
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                )
            })}
        </div>
    )
}

// --------------------------------------------------------------------------
// --- SUB-COMPONENT: Responsabilidades (Instrumentos)
// --------------------------------------------------------------------------
function ResponsabilidadesTab({ usuarios, instrumentos, asignaciones, onToggle, loading }: any) {
    return (
        <div className="space-y-6">
            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                    <strong>Asignación de Instrumentos:</strong> Configure qué instrumentos de la Mesa de Control debe evaluar cada miembro del equipo. 
                    Si un usuario NO tiene asignaciones, podrá ver todos los instrumentos (comportamiento por defecto).
                </p>
            </div>

            <div className="grid gap-6">
                {usuarios.map((user: any) => {
                    const userAsig = asignaciones.filter((a: any) => a.perfil_id === user.id)
                    const isAsignado = (instId: string) => userAsig.some((a: any) => a.instrumento_id === instId)

                    return (
                        <Card key={user.id} className="card-glass border-border">
                            <CardHeader className="py-4 px-6 border-b border-border bg-muted/20">
                                <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
                                    <Shield className="w-5 h-5 text-amber-500" />
                                    {user.nombre_completo}
                                </CardTitle>
                                <CardDescription>
                                    Asigne los instrumentos bajo su responsabilidad
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {instrumentos.map((inst: any) => (
                                        <div 
                                            key={inst.id} 
                                            className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                                                isAsignado(inst.id) 
                                                    ? 'bg-blue-500/10 border-blue-500/40 text-blue-700 dark:text-blue-300' 
                                                    : 'bg-muted/30 border-border text-foreground hover:bg-muted/50'
                                            }`}
                                            onClick={() => onToggle('asignacion', user.id, inst.id, '', !isAsignado(inst.id))}
                                        >
                                            <Checkbox 
                                                id={`inst-${user.id}-${inst.id}`}
                                                checked={isAsignado(inst.id)}
                                                onCheckedChange={(val) => onToggle('asignacion', user.id, inst.id, '', val)}
                                            />
                                            <span className="text-sm font-medium">{inst.nombre}</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}

// --------------------------------------------------------------------------
// --- MAIN PAGE COMPONENT
// --------------------------------------------------------------------------
export default function AdminPermisosPage() {
    const [loading, setLoading] = useState(true)
    const [oficinas, setOficinas] = useState([])
    const [planeacionUsers, setPlaneacionUsers] = useState([])
    const [instrumentos, setInstrumentos] = useState([])
    
    const [permsOficina, setPermsOficina] = useState<any[]>([])
    const [permsUsuario, setPermsUsuario] = useState<any[]>([])
    const [asignaciones, setAsignaciones] = useState<any[]>([])

    const supabase = createClient()

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [
                ofisRes, permsOfiRes, 
                usersRes, permsUserRes, 
                instsRes, asigRes
            ] = await Promise.all([
                supabase.from('oficinas').select('id, nombre').eq('activa', true).order('nombre'),
                supabase.from('permisos_modulo_oficina').select('*'),
                supabase.from('perfiles').select('id, nombre_completo, email').eq('rol', 'equipo_planeacion').eq('activo', true).order('nombre_completo'),
                supabase.from('permisos_usuario').select('*'),
                supabase.from('instrumentos').select('id, nombre').eq('activo', true).order('nombre'),
                supabase.from('asignaciones_evaluador').select('*')
            ])

            if (ofisRes.error) throw ofisRes.error
            if (usersRes.error) throw usersRes.error
            if (instsRes.error) throw instsRes.error

            setOficinas(ofisRes.data as any)
            setPermsOficina(permsOfiRes.data as any)
            setPlaneacionUsers(usersRes.data as any)
            setPermsUsuario(permsUserRes.data as any)
            setInstrumentos(instsRes.data as any)
            setAsignaciones(asigRes.data as any)

        } catch (err: any) {
            toast.error('Error cargando datos', { description: err.message })
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleToggle = async (
        type: 'oficina' | 'usuario' | 'asignacion',
        targetId: string,
        moduloOrInst: string,
        field: string,
        value: boolean
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (type === 'oficina') {
                const existing = permsOficina.find(p => p.oficina_id === targetId && p.modulo === moduloOrInst)
                const payload = {
                    oficina_id: targetId,
                    modulo: moduloOrInst,
                    [field]: value,
                    configurado_por: user?.id,
                    updated_at: new Date().toISOString()
                }

                // Logic: if ver=false, set edit=false. If edit=true, set ver=true.
                if (field === 'puede_ver' && !value) (payload as any).puede_editar = false
                if (field === 'puede_editar' && value) (payload as any).puede_ver = true

                if (existing) {
                    await supabase.from('permisos_modulo_oficina').update(payload).eq('id', existing.id)
                } else {
                    await supabase.from('permisos_modulo_oficina').insert(payload)
                }
            } else if (type === 'usuario') {
                const existing = permsUsuario.find(p => p.usuario_id === targetId && p.modulo === moduloOrInst)
                const payload = {
                    usuario_id: targetId,
                    modulo: moduloOrInst,
                    [field]: value,
                    asignado_por: user?.id,
                    updated_at: new Date().toISOString()
                }

                if (field === 'puede_ver' && !value) (payload as any).puede_editar = false
                if (field === 'puede_editar' && value) (payload as any).puede_ver = true

                if (existing) {
                    await supabase.from('permisos_usuario').update(payload).eq('id', existing.id)
                } else {
                    await supabase.from('permisos_usuario').insert(payload)
                }
            } else if (type === 'asignacion') {
                if (value) {
                    await supabase.from('asignaciones_evaluador').insert({
                        perfil_id: targetId,
                        instrumento_id: moduloOrInst
                    })
                } else {
                    await supabase.from('asignaciones_evaluador')
                        .delete()
                        .eq('perfil_id', targetId)
                        .eq('instrumento_id', moduloOrInst)
                }
            }

            toast.success('Cambio guardado')
            fetchData() // Simple way to sync UI
        } catch (err: any) {
            toast.error('Error al guardar', { description: err.message })
        }
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        Gestión de Permisos y Responsabilidades
                    </h1>
                    <p className="text-muted-foreground mt-1 text-foreground">
                        Configure accesos por dependencia, perfiles individuales de planeación y carga de instrumentos.
                    </p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-border text-foreground">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span className="ml-2">Actualizar</span>
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            ) : (
                <Tabs defaultValue="oficinas" className="w-full">
                    <TabsList className="bg-muted/50 p-1 rounded-xl mb-6">
                        <TabsTrigger value="oficinas" className="rounded-lg px-6 gap-2">
                            <Building2 className="w-4 h-4" />
                            Por Oficina
                        </TabsTrigger>
                        <TabsTrigger value="equipo" className="rounded-lg px-6 gap-2">
                            <Users className="w-4 h-4" />
                            Equipo Planeación
                        </TabsTrigger>
                        <TabsTrigger value="responsabilidades" className="rounded-lg px-6 gap-2">
                            <ListChecks className="w-4 h-4" />
                            Responsabilidades
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="oficinas">
                        <PermisosOficinaTab 
                            oficinas={oficinas} 
                            perms={permsOficina} 
                            onToggle={handleToggle}
                            loading={loading}
                        />
                    </TabsContent>

                    <TabsContent value="equipo">
                        <PermisosUsuarioTab 
                            usuarios={planeacionUsers} 
                            perms={permsUsuario} 
                            onToggle={handleToggle}
                        />
                    </TabsContent>

                    <TabsContent value="responsabilidades">
                        <ResponsabilidadesTab 
                            usuarios={planeacionUsers}
                            instrumentos={instrumentos}
                            asignaciones={asignaciones}
                            onToggle={handleToggle}
                        />
                    </TabsContent>
                </Tabs>
            )}

            <p className="text-xs text-muted-foreground">
                * Los cambios aplican de inmediato. Los permisos de usuario (Equipo Planeación) tienen prioridad sobre los de la oficina. 
                Si un evaluador tiene instrumentos asignados, solo verá esos en la Mesa de Control.
            </p>
        </div>
    )
}
