'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import {
    Building2, Eye, EyeOff, Loader2, Lock, Mail,
    ShieldCheck, UserPlus, User, Briefcase, CheckCircle2, Info
} from 'lucide-react'
import type { Oficina, ProcesoInstitucional, GrupoProceso, RolUsuario } from '@/types/database'

const ROL_OPTIONS: { value: RolUsuario; label: string; desc: string }[] = [
    { value: 'jefe_oficina', label: 'Jefe de Oficina', desc: 'Gestiona y aprueba información de su dependencia' },
    { value: 'equipo_planeacion', label: 'Equipo de Planeación', desc: 'Acceso completo a módulos de seguimiento y análisis' },
    { value: 'gerente', label: 'Gerente', desc: 'Vista ejecutiva y aprobación de reportes' },
    { value: 'auditor', label: 'Auditor', desc: 'Consulta y alistamiento de auditorías' },
    { value: 'super_admin', label: 'Super Administrador', desc: 'Administración total del sistema' },
]

export default function RegisterPage() {
    const [nombreCompleto, setNombreCompleto] = useState('')
    const [oficionaId, setOficinaId] = useState('')
    const [cargo, setCargo] = useState('')
    const [rol, setRol] = useState<RolUsuario>('jefe_oficina')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)

    const [oficinas, setOficinas] = useState<Oficina[]>([])
    const [loadingOficinas, setLoadingOficinas] = useState(true)
    const [procesosPreview, setProcesosPreview] = useState<(ProcesoInstitucional & { grupos_proceso?: GrupoProceso })[]>([])
    const [loadingProcesos, setLoadingProcesos] = useState(false)

    const router = useRouter()
    const supabase = createClient()

    // Cargar oficinas al montar
    useEffect(() => {
        supabase
            .from('oficinas')
            .select('*')
            .eq('activa', true)
            .order('nombre')
            .then(({ data, error }) => {
                if (!error) setOficinas(data ?? [])
                else toast.error('No se pudieron cargar las oficinas')
                setLoadingOficinas(false)
            })
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // Cuando cambia la oficina, cargar sus procesos para preview
    useEffect(() => {
        if (!oficionaId) { setProcesosPreview([]); return }
        setLoadingProcesos(true)
        supabase
            .from('procesos_institucionales')
            .select('*, grupos_proceso(*)')
            .eq('oficina_id', oficionaId)
            .eq('activo', true)
            .order('orden')
            .then(({ data }) => {
                setProcesosPreview((data ?? []) as any)
                setLoadingProcesos(false)
            })
    }, [oficionaId]) // eslint-disable-line react-hooks/exhaustive-deps

    const password_match = password === confirmPassword
    const password_strong = password.length >= 6

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!password_match) { toast.error('Las contraseñas no coinciden'); return }
        if (!password_strong) { toast.error('La contraseña debe tener al menos 6 caracteres'); return }
        if (!oficionaId) { toast.error('Debes seleccionar tu oficina'); return }

        setLoading(true)
        try {
            const { error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                    data: {
                        full_name: nombreCompleto,
                        cargo: cargo,
                        oficina_id: oficionaId,
                        rol: rol,
                    },
                },
            })

            if (authError) throw authError

            toast.success('¡Cuenta creada exitosamente!', {
                description: 'Revisa tu correo institucional para confirmar el acceso.',
                duration: 6000,
            })
            router.push('/login')

        } catch (err: any) {
            toast.error('Error al crear la cuenta', { description: err.message })
        } finally {
            setLoading(false)
        }
    }

    // Agrupar procesos del preview por grupo
    const gruposPreview = procesosPreview.reduce<Record<string, typeof procesosPreview>>((acc, p) => {
        const key = p.grupos_proceso?.nombre ?? 'Sin grupo'
        if (!acc[key]) acc[key] = []
        acc[key].push(p)
        return acc
    }, {})

    return (
        <div className="min-h-screen flex bg-[hsl(222,47%,5%)] overflow-hidden">

            {/* Left branding panel */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-12">
                {/* Background Image */}
                <div className="absolute inset-0">
                    <Image
                        src="/mapa.jpeg"
                        alt="Fondo Ibagué"
                        fill
                        className="object-cover"
                        priority
                    />
                    {/* Dark gradient overlay to ensure text is readable */}
                    <div className="absolute inset-0 bg-blue-950/80 bg-gradient-to-br from-blue-950/85 to-slate-950/90" />
                </div>
                {/* Background glow */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl opacity-50" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/20 rounded-full blur-3xl opacity-50" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl bg-white p-2 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                            <Image src="/logo.png" alt="Logo INFIBAGUE" width={80} height={80} className="object-contain" priority />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg leading-none">INFIBAGUÉ</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight drop-shadow-2xl font-sans pb-2">
                            Registro<br />
                            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent drop-shadow-xl inline-block mt-2">
                                Plataforma
                            </span>
                        </h1>
                        <p className="mt-4 text-slate-300 text-base font-medium leading-relaxed max-w-md tracking-wide">
                            Tu cuenta queda vinculada automáticamente a los procesos
                            institucionales de tu oficina. Sin configuración manual.
                        </p>
                    </div>

                    {/* Procesos preview en el panel izquierdo */}
                    {procesosPreview.length > 0 && (
                        <div className="space-y-2 max-w-sm animate-in fade-in duration-300">
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                Procesos que se asignarán
                            </p>
                            {Object.entries(gruposPreview).map(([grupo, procs]) => (
                                <div key={grupo}>
                                    <p className="text-[10px] text-slate-500 mb-1">{grupo}</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {procs.map(p => (
                                            <span
                                                key={p.id}
                                                className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/15 border border-blue-500/30 text-blue-300"
                                            >
                                                {p.nombre}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Registro protegido con RLS — Row Level Security</span>
                </div>
            </div>

            {/* Panel derecho — Formulario */}
            <div className="flex-1 flex items-center justify-center p-6 overflow-y-auto">
                <div className="w-full max-w-md space-y-5 py-8">

                    <div className="lg:hidden flex flex-col items-center gap-4 mb-10 pb-6 border-b border-white/10">
                        <div className="w-24 h-24 rounded-2xl bg-white p-3 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-pulse">
                            <Image src="/logo.png" alt="Logo INFIBAGUE" width={80} height={80} className="object-contain" priority />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-black text-2xl tracking-wide">INFIBAGUÉ</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
                        <p className="text-slate-400 text-sm mt-1">
                            Completa todos los campos para registrarte
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">

                        {/* 1. Nombre completo */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                Nombre completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Juan Carlos Pérez Gómez"
                                    value={nombreCompleto}
                                    onChange={e => setNombreCompleto(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* 2. Oficina */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                Oficina / Dependencia
                            </label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={oficionaId}
                                    onChange={e => setOficinaId(e.target.value)}
                                    required
                                    disabled={loadingOficinas || loading}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none disabled:opacity-50"
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">
                                        {loadingOficinas ? 'Cargando oficinas...' : 'Seleccionar oficina...'}
                                    </option>
                                    {oficinas.map(o => (
                                        <option key={o.id} value={o.id} className="bg-slate-950 text-white">
                                            {o.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Preview inline de procesos (móvil) */}
                            {loadingProcesos && (
                                <p className="text-[11px] text-slate-500 flex items-center gap-1 pl-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Cargando procesos...
                                </p>
                            )}
                            {!loadingProcesos && procesosPreview.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1 lg:hidden">
                                    {procesosPreview.map(p => (
                                        <span
                                            key={p.id}
                                            className="px-1.5 py-0.5 rounded text-[10px] bg-blue-500/15 border border-blue-500/25 text-blue-400 flex items-center gap-1"
                                        >
                                            <CheckCircle2 className="w-2.5 h-2.5" />
                                            {p.nombre}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3. Cargo */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                Cargo
                            </label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Profesional Universitario"
                                    value={cargo}
                                    onChange={e => setCargo(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* 4. Rol */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                Rol en la plataforma
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {ROL_OPTIONS.map(opt => (
                                    <label
                                        key={opt.value}
                                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${rol === opt.value
                                                ? 'border-blue-500 bg-blue-500/10'
                                                : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="rol"
                                            value={opt.value}
                                            checked={rol === opt.value}
                                            onChange={() => setRol(opt.value)}
                                            disabled={loading}
                                            className="mt-0.5 accent-blue-500"
                                        />
                                        <div className="min-w-0">
                                            <p className={`text-sm font-medium ${rol === opt.value ? 'text-blue-300' : 'text-white'}`}>
                                                {opt.label}
                                            </p>
                                            <p className="text-[11px] text-slate-500 leading-tight">{opt.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* 5. Correo institucional */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                Correo institucional
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    placeholder="jperez@infibague.gov.co"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                                />
                            </div>
                        </div>

                        {/* 6 & 7. Contraseña y Confirmar */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all disabled:opacity-50"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-300 uppercase tracking-widest">
                                    Confirmar
                                </label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        disabled={loading}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white/5 border rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-all disabled:opacity-50 ${confirmPassword && !password_match
                                                ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30'
                                                : confirmPassword && password_match
                                                    ? 'border-green-500/60 focus:border-green-500 focus:ring-green-500/30'
                                                    : 'border-white/10 focus:border-blue-500 focus:ring-blue-500/50'
                                            }`}
                                    />
                                </div>
                                {confirmPassword && !password_match && (
                                    <p className="text-[10px] text-red-400">No coinciden</p>
                                )}
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading || !password_match}
                            className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                        >
                            {loading ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Creando cuenta...</>
                            ) : (
                                <><UserPlus className="w-4 h-4" /> Registrarse</>
                            )}
                        </button>
                    </form>

                    <div className="text-center text-sm pt-2">
                        <span className="text-slate-500">¿Ya tienes cuenta? </span>
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                            Iniciar sesión
                        </Link>
                    </div>

                    <p className="text-center text-xs text-slate-600">
                        ¿Problemas para registrarte? Contacta a la Oficina de Planeación
                    </p>
                </div>
            </div>
        </div>
    )
}
