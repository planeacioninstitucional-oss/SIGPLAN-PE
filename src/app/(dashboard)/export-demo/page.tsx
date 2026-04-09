"use client"

import React, { useState } from 'react'
import { PendingSignaturesAlert } from '@/components/seguimientos/PendingSignaturesAlert'
import type { ReportProcessData } from '@/components/seguimientos/PendingSignaturesAlert'
import { ExcelExportButton } from '@/components/seguimientos/ExcelExportButton'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

export default function ExcelDemoPage() {
    // Datos de ejemplo para demostrar que la UI y el Excel están sincronizados
    const [mockData, setMockData] = useState<ReportProcessData[]>([
        {
            concepto: "PLAN DE ACCIÓN",
            proceso: "Gestión Estratégica",
            seguimiento: { enero: "√", febrero: "√", marzo: "Pendiente Firma", abril: "X" },
            avanceFisico: 0.85,
            avanceInversion: 0.60
        },
        {
            concepto: "PLAN DE ACCIÓN",
            proceso: "Gestión del SIG",
            seguimiento: { enero: "√", febrero: "√", marzo: "√" },
            avanceFisico: 1.0,
            avanceInversion: 0.90
        },
        {
            concepto: "PLAN DE ACCIÓN",
            proceso: "Atención al Ciudadano",
            seguimiento: { enero: "X", febrero: "Pendiente Firma", marzo: "Pendiente Firma" },
            avanceFisico: 0.25,
            avanceInversion: 0.10
        }
    ])

    return (
        <div className="p-8 space-y-6 max-w-6xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Demostración: Control y Exportación de Firmas</h1>
                <p className="text-slate-500 mt-2">
                    Esta vista es un entorno de prueba para validar que el comportamiento web se descargue exactamente igual al archivo de Excel parametrizado.
                </p>
            </div>

            {/* Componente que cuenta cuántos "Pendiente Firma" existen y muestra la tarjeta. */}
            <PendingSignaturesAlert reportData={mockData} />

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl">Tabla de Procesos Activos</CardTitle>
                        <CardDescription>
                            Lo que edites o se muestre aquí en la plataforma, será heredado por el Excel mensual.
                        </CardDescription>
                    </div>
                    {/* Botón de exportar, pasándole como prop los mismos datos que vemos en React */}
                    <ExcelExportButton reportData={mockData} />
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <TableRow>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-200">Concepto</TableHead>
                                    <TableHead className="font-bold text-slate-700 dark:text-slate-200">Proceso</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">Ene</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">Feb</TableHead>
                                    <TableHead className="text-center font-bold text-slate-700 dark:text-slate-200">Mar</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-200">Avance Físico</TableHead>
                                    <TableHead className="text-right font-bold text-slate-700 dark:text-slate-200">Avance Inv.</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mockData.map((d, i) => (
                                    <TableRow key={i}>
                                        <TableCell className="font-medium">{d.concepto}</TableCell>
                                        <TableCell>{d.proceso}</TableCell>
                                        <TableCell className={`text-center font-bold ${
                                            d.seguimiento.enero === '√' ? 'text-green-600' :
                                            d.seguimiento.enero === 'X' ? 'text-red-500' : 'text-amber-500'
                                        }`}>{d.seguimiento.enero}</TableCell>
                                        <TableCell className={`text-center font-bold ${
                                            d.seguimiento.febrero === '√' ? 'text-green-600' :
                                            d.seguimiento.febrero === 'X' ? 'text-red-500' : 'text-amber-500'
                                        }`}>{d.seguimiento.febrero}</TableCell>
                                        <TableCell className={`text-center font-bold ${
                                            d.seguimiento.marzo === '√' ? 'text-green-600' :
                                            d.seguimiento.marzo === 'X' ? 'text-red-500' : 'text-amber-500'
                                        }`}>{d.seguimiento.marzo}</TableCell>
                                        <TableCell className="text-right text-blue-600 font-bold">{(d.avanceFisico * 100).toFixed(0)}%</TableCell>
                                        <TableCell className="text-right text-blue-600 font-bold">{(d.avanceInversion * 100).toFixed(0)}%</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
