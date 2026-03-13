'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Settings, Bell, Shield, Database, Globe } from 'lucide-react'

export default function ConfigPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Settings className="w-8 h-8 text-blue-500" />
                    Configuración del Sistema
                </h1>
                <p className="text-gray-500 dark:text-slate-400 mt-1">Ajustes generales, seguridad y mantenimiento de la plataforma</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="card-glass border-gray-200 dark:border-slate-800 hover:border-blue-500/30 transition-colors">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                <Globe className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">General</CardTitle>
                                <CardDescription>Configuración básica del sitio y localización</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Nombre de la Entidad</span>
                            <span className="text-sm text-slate-500">INFIBAGUÉ</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Versión del Sistema</span>
                            <span className="text-sm text-slate-500">2.0.4-stable</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-glass border-gray-200 dark:border-slate-800 hover:border-purple-500/30 transition-colors">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                                <Shield className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Seguridad</CardTitle>
                                <CardDescription>Políticas de acceso y auditoría</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Autenticación Supabase</span>
                            <span className="text-sm text-green-500 font-bold italic">ENABLED</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Logs de Auditoría</span>
                            <span className="text-sm text-green-500 font-bold italic">ACTIVE</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-glass border-gray-200 dark:border-slate-800 hover:border-green-500/30 transition-colors">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                                <Database className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Base de Datos</CardTitle>
                                <CardDescription>Estado de la conexión y esquemas</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Estado PostgreSQL</span>
                            <span className="text-sm text-green-500">En línea (AWS RDS)</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Último backup</span>
                            <span className="text-sm text-slate-500">Hoy, 04:00 AM</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="card-glass border-gray-200 dark:border-slate-800 hover:border-amber-500/30 transition-colors">
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                                <Bell className="w-5 h-5" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Notificaciones</CardTitle>
                                <CardDescription>Alertas de cumplimiento y recordatorios</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Alertas por Email</span>
                            <span className="text-sm text-amber-500 font-bold italic">PENDING SETUP</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10">
                            <span className="text-sm font-medium">Recordatorios de Metas</span>
                            <span className="text-sm text-green-500 font-bold italic">ACTIVE</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            <div className="flex justify-end pt-4">
                <p className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">SIGPLAN - Planeación Estratégica Infibagué © 2026</p>
            </div>
        </div>
    )
}
