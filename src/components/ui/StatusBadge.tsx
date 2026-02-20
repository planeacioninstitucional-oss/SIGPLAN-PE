import { cn } from "@/lib/utils";
import React from "react";

export type StatusType = "cumplido" | "alerta" | "peligro" | "inactivo";

interface StatusBadgeProps {
    status: StatusType;
    label?: string;
    className?: string;
}

const statusStyles = {
    cumplido: "bg-emerald-100 text-emerald-700 border-emerald-200",
    alerta: "bg-amber-100 text-amber-700 border-amber-200",
    peligro: "bg-rose-100 text-rose-700 border-rose-200",
    inactivo: "bg-slate-100 text-slate-700 border-slate-200",
};

const statusDotColors = {
    cumplido: "bg-emerald-500",
    alerta: "bg-amber-500",
    peligro: "bg-rose-500",
    inactivo: "bg-slate-500",
};

const statusDefaultLabels = {
    cumplido: "Cumplido",
    alerta: "Alerta",
    peligro: "Vencido",
    inactivo: "Inactivo",
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
                statusStyles[status],
                className
            )}
        >
            <span
                className={cn("mr-1.5 h-2 w-2 rounded-full", statusDotColors[status])}
                aria-hidden="true"
            />
            {label || statusDefaultLabels[status]}
        </span>
    );
}
