import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { EstadoSemaforo } from "@/types/database"

interface SemaforoCellProps {
    estado: EstadoSemaforo
    showText?: boolean
    className?: string
    onClick?: () => void
}

export function SemaforoCell({ estado, showText = false, className, onClick }: SemaforoCellProps) {
    const labels = {
        verde: "Cumplido",
        amarillo: "Parcial",
        rojo: "No cumplido",
        gris: "Sin reporte"
    }

    // Neon glow effect for green
    const glowClass = estado === 'verde' ? 'neon-glow' : ''
    const hoverClass = onClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''

    const content = (
        <Badge
            variant={estado}
            className={`h-6 ${showText ? 'w-auto px-3' : 'w-6 p-0 flex items-center justify-center rounded-full'} ${glowClass} ${hoverClass} ${className}`}
            onClick={onClick}
        >
            {showText ? labels[estado] : null}
        </Badge>
    )

    if (showText) return content

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    {content}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{labels[estado]}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
