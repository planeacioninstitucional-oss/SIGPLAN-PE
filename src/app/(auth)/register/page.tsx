'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck, UserPlus, User, Briefcase } from 'lucide-react'
import type { Dependencia } from '@/types/database'

export default function RegisterPage() {
    const [nombre, setNombre] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [cargo, setCargo] = useState('')
    const [rol, setRol] = useState('jefe_oficina') // Default role
    const [dependencias, setDependencias] = useState<Dependencia[]>([])
    const [selectedDependencia, setSelectedDependencia] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingDeps, setLoadingDeps] = useState(true)

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchDependencias = async () => {
            try {
                const { data, error } = await supabase
                    .from('dependencias')
                    .select('*')
                    .eq('activa', true)
                    .order('nombre')

                if (error) {
                    console.error('Error fetching dependencies:', error)
                    toast.error('No se pudieron cargar las dependencias')
                } else {
                    setDependencias(data || [])
                }
            } catch (err) {
                console.error('Error:', err)
            } finally {
                setLoadingDeps(false)
            }
        }

        fetchDependencias()
    }, [supabase])

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        if (!selectedDependencia) {
            toast.error('Debes seleccionar una oficina o dependencia')
            return
        }

        if (!rol) {
            toast.error('Debes seleccionar un rol')
            return
        }

        setLoading(true)

        try {
            // 1. Crear usuario en Auth
            // Guardamos nombre y cargo en metadata ya que 'cargo' no está en la tabla base por ahora
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${location.origin}/auth/callback`,
                    data: {
                        full_name: nombre,
                        cargo: cargo,
                        dependencia_id: selectedDependencia,
                        rol: rol
                    }
                },
            })

            if (authError) throw authError

            toast.success('Registro exitoso', {
                description: 'Revisa tu correo para confirmar la cuenta antes de ingresar.'
            })

            router.push('/login')

        } catch (err: any) {
            console.error(err)
            toast.error('Error al registrarse', { description: err.message || 'Intenta nuevamente' })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex bg-[hsl(222,47%,5%)] overflow-hidden">
            {/* Left branding panel */}
            <div className="hidden lg:flex flex-col justify-between w-[45%] relative p-12 bg-gradient-to-br from-blue-950/80 to-slate-950">
                {/* Background glow */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg leading-none">INFIBAGUÉ</p>
                            <p className="text-blue-400 text-xs">Instituto de Ibagué</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white leading-tight">
                            Únete a la<br />
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Gestión Estratégica
                            </span>
                        </h1>
                        <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                            Crea tu cuenta para acceder a los módulos de planeación, inversión y control.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Registro seguro</span>
                </div>
            </div>

            {/* Right register panel */}
            <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
                <div className="w-full max-w-md space-y-6 py-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">INFIBAGUÉ</p>
                            <p className="text-blue-400 text-xs">Plataforma PGE-INFI</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white">Crear cuenta</h2>
                        <p className="text-slate-400 text-sm mt-1">Completa el formulario para registrarte</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {/* Nombre Completo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Nombre completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Juan Pérez"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Oficina / Dependencia */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Oficina / Proceso</label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={selectedDependencia}
                                    onChange={(e) => setSelectedDependencia(e.target.value)}
                                    required
                                    disabled={loadingDeps}
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">
                                        {loadingDeps ? 'Cargando dependencias...' : 'Seleccionar dependencia...'}
                                    </option>
                                    {dependencias.map(dep => (
                                        <option key={dep.id} value={dep.id} className="bg-slate-950 text-white">
                                            {dep.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Cargo */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Cargo</label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="text"
                                    placeholder="Profesional Universitario"
                                    value={cargo}
                                    onChange={(e) => setCargo(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Rol */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Rol en la plataforma</label>
                            <div className="relative">
                                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <select
                                    value={rol}
                                    onChange={(e) => setRol(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
                                >
                                    <option value="" className="bg-slate-900 text-slate-400">Seleccionar rol...</option>
                                    <option value="jefe_oficina" className="bg-slate-950 text-white">Jefe de Oficina / Funcionario</option>
                                    <option value="equipo_planeacion" className="bg-slate-950 text-white">Equipo de Planeación</option>
                                    <option value="gerente" className="bg-slate-950 text-white">Gerente</option>
                                    <option value="auditor_externo" className="bg-slate-950 text-white">Auditor Externo</option>
                                    <option value="super_admin" className="bg-slate-950 text-white">Super Administrador</option>
                                </select>
                            </div>
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300">Correo institucional</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    type="email"
                                    placeholder="usuario@infibague.gov.co"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-10 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
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
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-300">Confirmar</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creando cuenta...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-4 h-4" />
                                        Registrarse
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    <div className="text-center text-sm">
                        <span className="text-slate-500">¿Ya tienes cuenta? </span>
                        <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                            Iniciar sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
