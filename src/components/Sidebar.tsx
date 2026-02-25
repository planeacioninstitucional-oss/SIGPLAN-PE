'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
    LayoutDashboard,
    Calendar,
    ClipboardList,
    ShieldAlert,
    UploadCloud,
    Settings,
    Users,
    X,
    ChevronRight,
    PieChart,
    Target,
    FileCheck,
    Building2,
    Briefcase,
    History,
    FileSpreadsheet
} from 'lucide-react'
import type { RolUsuario } from '@/types/database'

interface SidebarProps {
    isOpen: boolean
    toggleSidebar: () => void
    userRole: RolUsuario
}

type MenuItem = {
    name: string
    icon: React.ElementType
    href: string
    roles?: RolUsuario[]
}

type MenuSection = {
    category: string
    items: MenuItem[]
}

const MENU_ITEMS: MenuSection[] = [
    {
        category: 'General',
        items: [
            { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
            { name: 'Calendario', icon: Calendar, href: '/calendario' },
        ],
    },
    {
        category: 'Gestión',
        items: [
            {
                name: 'Mesa de Control',
                icon: History,
                href: '/seguimientos',
                roles: ['super_admin', 'equipo_planeacion']
            },
            {
                name: 'Mi Gestión',
                icon: ClipboardList,
                href: '/mi-gestion',
                roles: ['jefe_oficina']
            },
            {
                name: 'Mis Instrumentos',
                icon: FileCheck,
                href: '/mis-instrumentos',
                roles: ['jefe_oficina', 'equipo_planeacion']
            },
            {
                name: 'Metas PDD',
                icon: Target,
                href: '/metas-pdd',
                roles: ['super_admin', 'equipo_planeacion', 'jefe_oficina'] // Protected by middleware too
            },
            {
                name: 'Proyectos (PIIP)',
                icon: Briefcase,
                href: '/piip'
            },
            {
                name: 'Plan Acción Mun.',
                icon: Building2,
                href: '/plan-accion-municipal'
            },
            {
                name: 'Alistamiento',
                icon: ShieldAlert,
                href: '/alistamiento'
            },
        ],
    },
    {
        category: 'Reportes',
        items: [
            {
                name: 'Reportes Gerenciales',
                icon: PieChart,
                href: '/reportes',
                roles: ['super_admin', 'gerente', 'auditor_externo']
            },
        ],
    },
    {
        category: 'Administración',
        items: [
            {
                name: 'Usuarios',
                icon: Users,
                href: '/admin/usuarios',
                roles: ['super_admin']
            },
            {
                name: 'Vigencias',
                icon: Calendar,
                href: '/admin/vigencias',
                roles: ['super_admin']
            },
            {
                name: 'Importar Excel',
                icon: FileSpreadsheet,
                href: '/admin/importar',
                roles: ['super_admin', 'equipo_planeacion']
            },
            {
                name: 'Configuración',
                icon: Settings,
                href: '/admin/configuracion',
                roles: ['super_admin']
            },
        ],
    },
]

export function Sidebar({ isOpen, toggleSidebar, userRole }: SidebarProps) {
    const pathname = usePathname()

    const filterItems = (section: MenuSection) => {
        const filtered = section.items.filter(item =>
            !item.roles || item.roles.includes(userRole)
        )
        return filtered.length > 0 ? { ...section, items: filtered } : null
    }

    return (
        <>
            <div
                className={cn(
                    'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity md:hidden',
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                )}
                onClick={toggleSidebar}
            />

            <aside
                className={cn(
                    'fixed top-0 left-0 z-50 h-screen w-64 bg-[hsl(222,47%,4%)] border-r border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-white/5 bg-[hsl(222,47%,5%)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-blue-500/20">
                            IN
                        </div>
                        <span className="font-bold text-slate-100 text-lg tracking-tight">PGE-INFI</span>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden text-slate-400 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    {MENU_ITEMS.map((section) => {
                        const filteredSection = filterItems(section)
                        if (!filteredSection) return null

                        return (
                            <div key={section.category}>
                                <h3 className="mb-2 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                                    {section.category}
                                </h3>
                                <ul className="space-y-1">
                                    {filteredSection.items.map((item) => {
                                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                                        return (
                                            <li key={item.name}>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        'group flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                                                        isActive
                                                            ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-[0_0_15px_-3px_rgba(37,99,235,0.2)]'
                                                            : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            'w-4 h-4 transition-colors',
                                                            isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'
                                                        )}
                                                    />
                                                    {item.name}
                                                    {isActive && <ChevronRight className="ml-auto w-4 h-4 text-blue-400/50" />}
                                                </Link>
                                            </li>
                                        )
                                    })}
                                </ul>
                            </div>
                        )
                    })}
                </nav>
            </aside>
        </>
    )
}
