'use client'

import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Book, ChevronLeft, FileText, Layout, Shield, Target, Users } from 'lucide-react'

export default function DocsPage() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 selection:bg-blue-500/30">
            {/* Header */}
            <header className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/">
                            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                                <ChevronLeft className="w-4 h-4 mr-2" />
                                Volver al inicio
                            </Button>
                        </Link>
                        <div className="h-4 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <Book className="w-5 h-5 text-blue-500" />
                            <span className="font-bold tracking-tight">Manual de Usuario SIGPLAN</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    {/* Navigation Sidebar */}
                    <aside className="hidden lg:block space-y-8">
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Empezando</h3>
                            <ul className="space-y-2">
                                <li><a href="#introduccion" className="text-sm text-blue-400 hover:underline">Introducción</a></li>
                                <li><a href="#acceso" className="text-sm text-slate-400 hover:text-white">Acceso al Sistema</a></li>
                                <li><a href="#roles" className="text-sm text-slate-400 hover:text-white">Roles y Permisos</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Módulos</h3>
                            <ul className="space-y-2">
                                <li><a href="#metas" className="text-sm text-slate-400 hover:text-white">Metas PDD</a></li>
                                <li><a href="#piip" className="text-sm text-slate-400 hover:text-white">Proyectos PIIP</a></li>
                                <li><a href="#pam" className="text-sm text-slate-400 hover:text-white">Plan Acción Municipal</a></li>
                                <li><a href="#auditoria" className="text-sm text-slate-400 hover:text-white">Alistamiento Auditoría</a></li>
                            </ul>
                        </div>
                    </aside>

                    {/* Content */}
                    <div className="lg:col-span-3 space-y-16 max-w-3xl">
                        <section id="introduccion" className="space-y-6">
                            <h1 className="text-4xl font-bold text-white tracking-tight">Introducción</h1>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                SIGPLAN es la plataforma integral de planeación estratégica de INFIBAGUÉ, diseñada para facilitar el seguimiento, control y reporte de los diversos instrumentos de gestión institucional.
                            </p>
                            <div className="p-6 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex gap-4">
                                <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                    <Target className="w-5 h-5 text-blue-400" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-white">Objetivo Principal</h4>
                                    <p className="text-sm text-slate-400">Garantizar la trazabilidad y el cumplimiento de las metas del Plan de Desarrollo Distrital y planes de acción específicos de cada dependencia.</p>
                                </div>
                            </div>
                        </section>

                        <section id="roles" className="space-y-6">
                            <h2 className="text-2xl font-bold text-white">Roles y Permisos</h2>
                            <p className="text-slate-400">El sistema cuenta con una estructura de permisos granular basada en roles:</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-red-400">
                                        <Shield className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase">Super Admin</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Acceso total al sistema, gestión de usuarios, vigencias y configuración global.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Users className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase">Equipo Planeación</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Gestores de instrumentos, responsables de la consolidación y auditoría de datos.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-purple-400">
                                        <Layout className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase">Jefe de Oficina</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Responsable de cargar y reportar avances de su oficina específica.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                                    <div className="flex items-center gap-2 text-green-400">
                                        <FileText className="w-4 h-4" />
                                        <span className="text-sm font-bold uppercase">Auditor / Gerente</span>
                                    </div>
                                    <p className="text-xs text-slate-500">Acceso de solo lectura a todos los reportes y tableros gerenciales.</p>
                                </div>
                            </div>
                        </section>

                        <section id="soporte" className="pt-12 border-t border-white/5">
                            <h2 className="text-xl font-bold text-white mb-4">¿Necesitas ayuda adicional?</h2>
                            <p className="text-slate-400 mb-6 font-medium">Si presentas problemas técnicos o necesitas capacitación adicional, contacta a la Oficina de Planeación.</p>
                            <Button className="bg-blue-600 hover:bg-blue-500">Contactar Soporte Técnico</Button>
                        </section>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-12 mt-20">
                <div className="max-w-7xl mx-auto px-6 text-center text-slate-600 text-sm italic">
                    SIGPLAN Documentación v2.0 - Última actualización: Marzo 2026
                </div>
            </footer>
        </div>
    )
}
