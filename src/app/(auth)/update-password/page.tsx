'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, Eye, EyeOff, Loader2, Lock, ShieldCheck } from 'lucide-react'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            toast.error('Las contraseñas no coinciden')
            return
        }

        setLoading(true)

        try {
            const { error } = await supabase.auth.updateUser({ password })

            if (error) {
                toast.error('Error al actualizar contraseña', { description: error.message })
            } else {
                toast.success('Contraseña actualizada', { description: 'Ahora puedes iniciar sesión con tu nueva contraseña.' })
                router.push('/login')
            }
        } catch (err) {
            toast.error('Ocurrió un error inesperado')
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
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                            <Image src="/logo.png" alt="Logo INFIBAGUE" width={80} height={80} className="object-contain" priority />
                        </div>
                        <div>
                            <p className="text-white font-bold text-lg leading-none">INFIBAGUÉ</p>
                            <p className="text-blue-400 text-xs mt-1">Planeación Estratégica</p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 space-y-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white leading-tight">
                            Actualización de<br />
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Credenciales
                            </span>
                        </h1>
                        <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                            Define una nueva contraseña segura para acceder a la plataforma.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Actualización segura</span>
                </div>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Mobile logo */}
                    <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
                        <div className="w-20 h-20 rounded-2xl bg-white p-2 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.6)]">
                            <Image src="/logo.png" alt="Logo INFIBAGUE" width={80} height={80} className="object-contain" priority />
                        </div>
                        <div className="text-center">
                            <p className="text-white font-black text-2xl tracking-wide">INFIBAGUÉ</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="text-2xl font-bold text-white">Nueva contraseña</h2>
                        <p className="text-slate-400 text-sm mt-1">Ingresa tu nueva contraseña para continuar.</p>
                    </div>

                    <form onSubmit={handleUpdate} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="password">
                                Nueva contraseña
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
                                    minLength={6}
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

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-300" htmlFor="confirmPassword">
                                Confirmar contraseña
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                <input
                                    id="confirmPassword"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    disabled={loading}
                                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors disabled:opacity-50"
                                />
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
                                    Actualizando...
                                </>
                            ) : (
                                'Actualizar contraseña'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
