'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
import type { RolUsuario, Perfil } from '@/types/database'
import { hasSidebarAccess } from '@/lib/responsabilidades'

interface SidebarProps {
    isOpen: boolean
    toggleSidebar: () => void
    userProfile: Perfil & { oficinas?: { nombre: string, abreviatura?: string } }
}

type MenuItem = {
    name: string
    icon: React.ElementType
    href: string
    roles?: RolUsuario[]
    oficinasHabilitadas?: string[]
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
                roles: ['super_admin', 'equipo_planeacion', 'jefe_oficina']
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
                href: '/alistamiento',
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
                roles: ['super_admin', 'gerente', 'auditor']
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
                roles: ['super_admin', 'equipo_planeacion', 'jefe_oficina']
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

export function Sidebar({ isOpen, toggleSidebar, userProfile }: SidebarProps) {
    const pathname = usePathname()

    const userRole = userProfile?.rol ?? 'funcionario'
    const oficinaUsuario = userProfile?.oficinas?.nombre || ''

    const filterItems = (section: MenuSection) => {
        const filtered = section.items.filter(item => {
            if (item.roles && !item.roles.includes(userRole as RolUsuario)) return false

            if (item.oficinasHabilitadas && userRole !== 'super_admin') {
                if (!item.oficinasHabilitadas.includes(oficinaUsuario)) {
                    return false
                }
            }

            if (!hasSidebarAccess(item.name, userProfile?.nombre_completo, userRole, oficinaUsuario)) {
                return false
            }

            // Hide Mi Gestión if they don't have an assigned office
            if (item.name === 'Mi Gestión' && !oficinaUsuario) {
                return false
            }

            return true
        })

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
                    'fixed top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-[hsl(222,47%,4%)] border-r border-gray-200 dark:border-white/5 transition-transform duration-300 ease-in-out md:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full'
                )}
            >
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-[hsl(222,47%,5%)]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-lg shadow-blue-500/20 p-1">
                            <Image src="/logo.png" alt="Logo" width={24} height={24} className="object-contain" />
                        </div>
                        <span className="font-bold text-gray-900 dark:text-slate-100 text-[15px] tracking-tight whitespace-nowrap">INFIBAGUÉ - Planeación</span>
                    </div>
                    <button onClick={toggleSidebar} className="md:hidden text-gray-400 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-4rem)]">
                    {MENU_ITEMS.map((section) => {
                        const filteredSection = filterItems(section)
                        if (!filteredSection) return null

                        return (
                            <div key={section.category}>
                                <h3 className="mb-2 px-3 text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-wider">
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
                                                            ? 'bg-blue-50 dark:bg-blue-600/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-600/20 shadow-sm dark:shadow-[0_0_15px_-3px_rgba(37,99,235,0.2)]'
                                                            : 'text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-slate-100'
                                                    )}
                                                >
                                                    <item.icon
                                                        className={cn(
                                                            'w-4 h-4 transition-colors',
                                                            isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-slate-500 group-hover:text-gray-600 dark:group-hover:text-slate-300'
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
