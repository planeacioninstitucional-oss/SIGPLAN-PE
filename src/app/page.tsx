'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Lock, LayoutGrid, BarChart3, ShieldCheck, Database } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'

export default function LandingPage() {
    const [dbStatus, setDbStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')

    useEffect(() => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )

        async function checkConnection() {
            try {
                const { error } = await supabase.from('vigencias').select('count', { count: 'exact', head: true })
                if (error) throw error
                setDbStatus('connected')
            } catch (err) {
                console.error('Supabase connection failed:', err)
                setDbStatus('error')
            }
        }

        checkConnection()
    }, [])

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear_gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
            <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>

            {/* Header */}
            <header className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <LayoutGrid className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white font-space">PGE-INFI</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10">
                        <div className={`h-2 w-2 rounded-full ${dbStatus === 'connected' ? 'bg-green-500' :
                                dbStatus === 'error' ? 'bg-red-500' : 'bg-yellow-500 animate-pulse'
                            }`} />
                        <span className="text-[10px] font-mono text-slate-400">
                            {dbStatus === 'connected' ? 'DB CONNECTED' :
                                dbStatus === 'error' ? 'DB ERROR' : 'CONNECTING...'}
                        </span>
                    </div>

                    <Link href="/login">
                        <Button variant="outline" className="border-primary/50 hover:bg-primary/10 hover:text-primary transition-all">
                            <Lock className="mr-2 h-4 w-4" />
                            Acceso Funcionario
                        </Button>
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1 relative z-10 flex flex-col items-center justify-center text-center px-4">
                <div className="space-y-4 max-w-3xl animate-in fade-in zoom-in duration-700">
                    <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-4 backdrop-blur-md">
                        <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                        Sistema de Gestión Estratégica v2.0
                    </div>
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-2">
                        Operative Grid <br />
                        <span className="text-primary drop-shadow-[0_0_20px_rgba(17,89,212,0.4)]">INFIBAGUÉ</span>
                    </h1>
                    <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                        Plataforma centralizada para la planeación, seguimiento y control de instrumentos de gestión.
                        Metas PDD, PIIP, PAM y Alistamiento de Auditoría en tiempo real.
                    </p>
                    <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transition-all px-8 h-12 text-lg">
                                Ingresar al Sistema
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                        <Button variant="ghost" className="text-slate-400 hover:text-white h-12 px-8">
                            Ver Documentación
                        </Button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-colors text-left group">
                        <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Metas PDD</h3>
                        <p className="text-slate-400 text-sm">Seguimiento detallado al cumplimiento del Plan de Desarrollo Distrital.</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-colors text-left group">
                        <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                            <LayoutGrid className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">PIIP & PAM</h3>
                        <p className="text-slate-400 text-sm">Gestión integral de proyectos de inversión y planes de acción municipal.</p>
                    </div>
                    <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-sm hover:bg-white/[0.05] transition-colors text-left group">
                        <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 text-green-400 group-hover:scale-110 transition-transform">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-lg font-semibold text-white mb-2">Auditoría</h3>
                        <p className="text-slate-400 text-sm">Matriz de alistamiento y checkpoints de control interno en tiempo real.</p>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 py-6 border-t border-white/5 mt-10">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-600 text-sm">
                    © 2026 INFIBAGUÉ - Oficina de Planeación. Todos los derechos reservados.
                </div>
            </footer>
        </div>
    )
}

