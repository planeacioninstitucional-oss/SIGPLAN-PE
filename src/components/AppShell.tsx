'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/database'
import { Loader2 } from 'lucide-react'

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true)
    const [userProfile, setUserProfile] = useState<Perfil | null>(null)
    const [loading, setLoading] = useState(true)
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()

    // Public routes that don't need the shell
    const isPublicRoute = ['/login', '/auth/callback', '/register', '/forgot-password'].includes(pathname)

    useEffect(() => {
        const checkUser = async () => {
            if (isPublicRoute) {
                setLoading(false)
                return
            }

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            // Fetch profile
            const { data: profile } = await supabase
                .from('perfiles')
                .select('*, dependencias(nombre)')
                .eq('id', user.id)
                .single()

            if (profile) {
                setUserProfile(profile)
            }
            setLoading(false)
        }

        checkUser()
    }, [pathname, isPublicRoute, router, supabase])

    if (isPublicRoute) {
        return <main className="min-h-screen bg-background">{children}</main>
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex bg-background">
            <Sidebar
                isOpen={isOpen}
                toggleSidebar={() => setIsOpen(!isOpen)}
                userRole={userProfile?.rol ?? 'jefe_oficina'}
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
