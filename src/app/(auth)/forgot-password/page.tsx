'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Building2, ChevronLeft, Loader2, Mail, Send, ShieldCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [sent, setSent] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${location.origin}/auth/callback?next=/update-password`,
            })

            if (error) {
                toast.error('Error al enviar instrucción', { description: error.message })
            } else {
                setSent(true)
                toast.success('Correo enviado', { description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.' })
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
                    <div className="absolute -top-40 -left-60 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
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
                            Recuperación de<br />
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                Cuenta
                            </span>
                        </h1>
                        <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
                            Restablece tu contraseña de forma segura para volver a acceder a la plataforma.
                        </p>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-2 text-xs text-slate-500">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Recuperación segura</span>
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

                    {!sent ? (
                        <>
                            <div>
                                <Link href="/login" className="inline-flex items-center text-sm text-slate-400 hover:text-white mb-6 transition-colors group">
                                    <ChevronLeft className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" />
                                    Volver al inicio de sesión
                                </Link>
                                <h2 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h2>
                                <p className="text-slate-400 text-sm mt-1">Ingresa tu correo institucional y te enviaremos instrucciones.</p>
                            </div>

                            <form onSubmit={handleReset} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-300" htmlFor="email">
                                        Correo electrónico
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

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{ boxShadow: '0 0 20px rgba(59,130,246,0.3)' }}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            Enviar instrucciones
                                        </>
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-16 h-16 rounded-full bg-green-500/20 mx-auto flex items-center justify-center text-green-400 mb-4">
                                <Mail className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-white">¡Correo enviado!</h2>
                            <p className="text-slate-400 text-sm max-w-sm mx-auto">
                                Hemos enviado las instrucciones de recuperación a <span className="text-white font-medium">{email}</span>.
                                Por favor revisa tu bandeja de entrada (y spam).
                            </p>
                            <Link href="/login">
                                <button className="mt-4 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium">
                                    Volver al inicio de sesión
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
