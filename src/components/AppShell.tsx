'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/database'
import { Loader2 } from 'lucide-react'

import { useAuthStore } from '@/stores/authStore'

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true)
    const { userProfile, initialized, fetchProfile } = useAuthStore()
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // Public routes that don't need the shell
    const isPublicRoute = ['/login', '/auth/callback', '/register', '/forgot-password'].includes(pathname)

    useEffect(() => {
        if (!isPublicRoute && !initialized) {
            fetchProfile()
        } else if (!isPublicRoute && initialized && !userProfile) {
            router.push('/login')
        }
    }, [pathname, isPublicRoute, router, initialized, userProfile, fetchProfile])

    if (isPublicRoute) {
        return <main className="min-h-screen bg-background">{children}</main>
    }

    if (!isPublicRoute && (!initialized || !userProfile)) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex bg-gray-50 dark:bg-background">
            <Sidebar
                isOpen={isOpen}
                toggleSidebar={() => setIsOpen(!isOpen)}
                userProfile={userProfile as any}
            />

            <div className={`flex-1 flex flex-col transition-all duration-300 ${isOpen ? 'md:ml-64' : 'md:ml-0'}`}>
                <Header
                    toggleSidebar={() => setIsOpen(!isOpen)}
                    userProfile={userProfile}
                />
                <main className="flex-1 p-6 overflow-x-hidden">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
