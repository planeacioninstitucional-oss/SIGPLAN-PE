import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { Perfil } from '@/types/database'

interface AuthState {
    userProfile: Perfil | null
    loading: boolean
    initialized: boolean
    fetchProfile: () => Promise<void>
    logout: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
    userProfile: null,
    loading: true,
    initialized: false,
    fetchProfile: async () => {
        set({ loading: true })
        const supabase = createClient()

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                set({ userProfile: null, loading: false, initialized: true })
                return
            }

            const { data: profile } = await supabase
                .from('perfiles')
                .select('*, oficinas(*)')
                .eq('id', user.id)
                .single()

            set({ userProfile: profile as any, loading: false, initialized: true })
        } catch (error) {
            console.error('Error fetching profile:', error)
            set({ userProfile: null, loading: false, initialized: true })
        }
    },
    logout: async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        set({ userProfile: null, initialized: false })
    }
}))
