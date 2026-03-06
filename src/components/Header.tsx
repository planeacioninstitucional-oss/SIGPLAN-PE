'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import {
    Bell,
    ChevronDown,
    LogOut,
    Moon,
    Search,
    Settings,
    Sun,
    User,
    Menu,
    ChevronRight
} from 'lucide-react'
import { useTheme } from 'next-themes'
import type { Perfil } from '@/types/database'
import { toast } from 'sonner'
import Link from 'next/link'

interface HeaderProps {
    toggleSidebar: () => void
    userProfile: Perfil | null
}

export function Header({ toggleSidebar, userProfile }: HeaderProps) {
    const router = useRouter()
    const supabase = createClient()
    const { theme, setTheme } = useTheme()
    const { vigenciaActual, setVigenciaActual, setTodasLasVigencias, todasLasVigencias } = useVigenciaStore()
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [isSearchOpen, setIsSearchOpen] = useState(false)

    // Example global search results mapping
    const SEARCH_ROUTES = [
        { name: 'Mesa de Control / Seguimientos', href: '/seguimientos' },
        { name: 'Mi Gestión', href: '/mi-gestion' },
        { name: 'Mis Instrumentos', href: '/mis-instrumentos' },
        { name: 'Metas PDD', href: '/metas-pdd' },
        { name: 'Proyectos (PIIP)', href: '/piip' },
        { name: 'Plan Acción Municipal', href: '/plan-accion-municipal' },
        { name: 'Alistamiento', href: '/alistamiento' },
        { name: 'Reportes Gerenciales', href: '/reportes' },
        { name: 'Administración de Usuarios', href: '/admin/usuarios' },
        { name: 'Configuración', href: '/admin/configuracion' },
    ]

    const filteredSearchResults = SEARCH_ROUTES.filter(route =>
        route.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Fetch vigencias on mount
    useEffect(() => {
        const fetchVigencias = async () => {
            const { data } = await supabase
                .from('vigencias')
                .select('*')
                .order('anio', { ascending: false })

            if (data) {
                setTodasLasVigencias(data)
                // Set default vigencia if not set (current year or latest)
                if (!vigenciaActual) {
                    const currentYear = new Date().getFullYear()
                    const active = data.find(v => v.anio === currentYear) || data[0]
                    if (active) setVigenciaActual({ id: active.id, anio: active.anio })
                }
            }
        }
        fetchVigencias()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/5 bg-[hsl(222,47%,5%)]/80 px-6 backdrop-blur-md transition-all">
            <button onClick={toggleSidebar} className="md:hidden text-slate-400">
                <Menu className="w-5 h-5" />
            </button>

            {/* Global Search */}
            <div className="hidden md:flex items-center relative w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                    type="text"
                    placeholder="Buscar instrumento o módulo..."
                    value={searchQuery}
                    onChange={(e) => {
                        setSearchQuery(e.target.value)
                        setIsSearchOpen(true)
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)} // delay to allow click
                    className="w-full pl-9 pr-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600"
                />

                {isSearchOpen && searchQuery.length > 0 && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
                        {filteredSearchResults.length > 0 ? (
                            <div className="space-y-1">
                                {filteredSearchResults.slice(0, 5).map(route => (
                                    <Link
                                        key={route.href}
                                        href={route.href}
                                        onClick={() => {
                                            setIsSearchOpen(false)
                                            setSearchQuery('')
                                        }}
                                        className="flex items-center justify-between px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-blue-500/20 rounded-md transition-colors"
                                    >
                                        {route.name}
                                        <ChevronRight className="w-4 h-4 text-blue-400" />
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-sm text-slate-500 py-4">No se encontraron resultados.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1" />

            {/* Vigencia Selector */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/10">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Vigencia</span>
                <select
                    value={vigenciaActual?.id || ''}
                    onChange={(e) => {
                        const selected = todasLasVigencias.find(v => v.id === e.target.value)
                        if (selected) {
                            setVigenciaActual({ id: selected.id, anio: selected.anio })
                            toast.info(`Vigencia cambiada a ${selected.anio}`)
                        }
                    }}
                    className="bg-transparent text-sm font-bold text-blue-400 focus:outline-none cursor-pointer"
                >
                    {todasLasVigencias.map(v => (
                        <option key={v.id} value={v.id} className="bg-slate-900 text-slate-200">
                            {v.anio}
                        </option>
                    ))}
                </select>
            </div>

            <div className="h-6 w-px bg-white/10 mx-2" />

            {/* Notifications */}
            <button className="relative text-slate-400 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </button>

            {/* Theme Toggle */}
            <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="text-slate-400 hover:text-white transition-colors"
            >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 top-1/2 -translate-y-1/2 right-0" />
                <span className="sr-only">Toggle theme</span>
            </button>

            {/* User Menu */}
            <div className="relative">
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-white/5 transition-colors"
                >
                    <div className="hidden text-right md:block">
                        <p className="text-sm font-medium text-slate-200 leading-none">{userProfile?.nombre_completo || 'Usuario'}</p>
                        <p className="text-xs text-slate-500 mt-1">{(userProfile?.oficinas as any)?.nombre || userProfile?.cargo || 'Sin Dependencia'}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold ring-2 ring-white/10">
                        {userProfile?.nombre_completo?.charAt(0) || 'U'}
                    </div>
                </button>

                {showUserMenu && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
                        <div className="absolute right-0 top-full mt-2 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-2xl p-1 z-20 animate-in slide-in-from-top-2 duration-200">
                            <div className="p-2 border-b border-white/5 mb-1">
                                <p className="font-medium text-slate-200">{userProfile?.nombre_completo}</p>
                                <p className="text-xs text-slate-500 truncate">{userProfile?.email}</p>
                            </div>

                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left">
                                <User className="w-4 h-4" />
                                Mi Perfil
                            </button>
                            <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors text-left">
                                <Settings className="w-4 h-4" />
                                Configuración
                            </button>

                            <div className="h-px bg-white/5 my-1" />

                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left"
                            >
                                <LogOut className="w-4 h-4" />
                                Cerrar Sesión
                            </button>
                        </div>
                    </>
                )}
            </div>
        </header>
    )
}
