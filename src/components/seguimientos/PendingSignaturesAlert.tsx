"use client"

import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export interface SeguimientoMensual {
    enero?: string
    febrero?: string
    marzo?: string
    abril?: string
    mayo?: string
    junio?: string
    julio?: string
    agosto?: string
    septiembre?: string
    octubre?: string
    noviembre?: string
    diciembre?: string
    [key: string]: string | undefined
}

export interface ReportProcessData {
    concepto: string
    proceso: string
    seguimiento: SeguimientoMensual
    avanceFisico: number
    avanceInversion: number
}

interface PendingSignaturesAlertProps {
    reportData: ReportProcessData[]
}

export function PendingSignaturesAlert({ reportData }: PendingSignaturesAlertProps) {
    if (!reportData || reportData.length === 0) return null

    // Contar cuántos procesos tienen al menos un mes "Pendiente Firma"
    const pendingCount = reportData.filter(proc => {
        const seg = proc.seguimiento
        return Object.values(seg).some(val => val === "Pendiente Firma")
    }).length

    if (pendingCount === 0) return null

    return (
        <Alert className="bg-amber-50 dark:bg-amber-950/40 border-amber-500/50 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in mb-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-bold text-base flex items-center">
                Atención: Legalizaciones Pendientes
            </AlertTitle>
            <AlertDescription className="text-sm font-medium mt-1">
                Hay {pendingCount} {pendingCount === 1 ? 'reporte pendiente' : 'reportes pendientes'} de legalización o firma actualmente. Por favor, regularice los estados antes del cierre.
            </AlertDescription>
        </Alert>
    )
}
