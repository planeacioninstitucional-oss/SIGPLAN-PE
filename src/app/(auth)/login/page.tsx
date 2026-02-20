'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const { error } = await supabase.auth.signInWithPassword({ email, password })
            if (error) {
                toast.error('Credenciales incorrectas', { description: error.message })
            } else {
                toast.success('Bienvenido al sistema')
                router.push('/dashboard')
                router.refresh()
            }
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
                            Plataforma de<br />
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Gestión Estratégica
                            </span>
                        </h1>
                        <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                            Centraliza planeación institucional, seguimiento de riesgos, proyectos de inversión y alistamiento de auditorías en un solo lugar.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                        {[
                            { label: 'Módulos activos', value: '5' },
                            { label: 'Dependencias', value: '22' },
                            { label: 'Instrumentos', value: '11' },
                            { label: 'Vigencia', value: '2026' },
                        ].map((stat) => (
                            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-lg p-3">
                                <p className="text-2xl font-bold text-blue-400">{stat.value}</p>
                                <p className="text-xs text-slate-400">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Sistema protegido con Row Level Security</span>
                </div>
            </div>

            {/* Right login panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                            <Building2 className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg">INFIBAGUÉ</p>
                            <p className="text-blue-400 text-xs">Plataforma PGE-INFI</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white">Iniciar sesión</h2>
                        <p className="text-slate-400 text-sm mt-1">Accede con tus credenciales institucionales</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="email">
                                Correo institucional
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@infibague.gov.co"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-10 pr-12 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                'Ingresar al sistema'
                            )}
                        </button>

                        <div className="flex items-center justify-between text-sm">
                            <Link href="/forgot-password" className="text-slate-400 hover:text-blue-400 transition-colors">
                                ¿Olvidaste tu contraseña?
                            </Link>
                            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                                Crear una cuenta
                            </Link>
                        </div>
                    </form>

                    <p className="text-center text-xs text-slate-600">
                        ¿Problemas para ingresar? Contacta a la Oficina de Planeación
                    </p>
                </div>
            </div>
        </div>
    )
}
