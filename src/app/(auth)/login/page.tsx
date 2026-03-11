'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react'

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
                            Plataforma<br />
                            <span className="bg-gradient-to-r from-blue-300 via-cyan-300 to-teal-400 bg-clip-text text-transparent drop-shadow-xl inline-block mt-2">
                                Estratégica
                            </span>
                        </h1>
                        <p className="mt-4 text-slate-300 text-base font-medium leading-relaxed max-w-md tracking-wide">
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
                            <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-[0_0_20px_rgba(59,130,246,0.2)]">
                                <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{stat.value}</p>
                                <p className="text-xs font-semibold text-slate-300 mt-1 uppercase tracking-wider">{stat.label}</p>
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
                    <div className="lg:hidden flex flex-col items-center gap-4 mb-10 pb-6 border-b border-white/10">
                        <div className="w-24 h-24 rounded-2xl bg-white p-3 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)] animate-pulse">
                            <Image src="/logo.png" alt="Logo INFIBAGUE" width={80} height={80} className="object-contain" priority />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-black text-2xl tracking-wide">INFIBAGUÉ</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-4xl font-extrabold text-white mb-2">Iniciar sesión</h2>
                        <p className="text-blue-300 text-base">Accede con tus credenciales institucionales</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-base font-semibold text-slate-200" htmlFor="email">
                                Correo Institucional
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="usuario@infibague.gov.co"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-12 pr-4 py-4 bg-[#0a1226]/80 border border-blue-900/40 rounded-xl text-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/50 transition-all disabled:opacity-50 shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-base font-semibold text-slate-200" htmlFor="password">
                                Contraseña
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-cyan-400 transition-colors" />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                    className="w-full pl-12 pr-12 py-4 bg-[#0a1226]/80 border border-blue-900/40 rounded-xl text-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/50 transition-all disabled:opacity-50 shadow-inner"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-400 transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-lg rounded-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                            style={{ boxShadow: '0 0 30px rgba(6,182,212,0.4)' }}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Verificando...
                                </>
                            ) : (
                                'Iniciar sistema'
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
