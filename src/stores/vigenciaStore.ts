'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Vigencia } from '@/types/database'

interface VigenciaStore {
    vigenciaActual: { id: string; anio: number } | null
    todasLasVigencias: Vigencia[]
    setVigenciaActual: (v: { id: string; anio: number }) => void
    setTodasLasVigencias: (vigencias: Vigencia[]) => void
}

export const useVigenciaStore = create<VigenciaStore>()(
    persist(
        (set) => ({
            vigenciaActual: null,
            todasLasVigencias: [],
            setVigenciaActual: (v) => set({ vigenciaActual: v }),
            setTodasLasVigencias: (vigencias) => set({ todasLasVigencias: vigencias }),
        }),
        {
            name: 'pge-infi-vigencia',
            partialize: (state) => ({ vigenciaActual: state.vigenciaActual }),
        }
    )
)
