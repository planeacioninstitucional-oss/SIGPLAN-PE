"use client"

import React, { useState } from 'react'
import * as ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'
import { FileSpreadsheet, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ReportProcessData } from './PendingSignaturesAlert'

interface ExcelExportButtonProps {
    reportData: ReportProcessData[]
    className?: string
    year?: string | number
}

export function ExcelExportButton({ reportData, className = "", year = new Date().getFullYear() }: ExcelExportButtonProps) {
    const [isExporting, setIsExporting] = useState(false)

    // Lista maestra de procesos en el orden fijo deseado
    const MAESTRO_PROCESOS = [
        'Gestión Estratégica',
        'Gestión Integral de Riesgos',
        'Gestión del SIG',
        'Evaluación Independiente',
        'Gestión de recursos fisicos',
        'Gestión Humana',
        'Gestión Financiera',
        'Gestión Tecnológica',
        'Gestión Documental',
        'Gestión Jurídica',
        'Control Disciplinario',
        'Atención al Ciudadano',
        'Comunicación y Participación Ciudadana',
        'Gestión Comercial',
        'Gestión Contractual',
        'Relleno Sanitario',
        'Parques y Zonas Verdes',
        'Plazas de Mercado',
        'Alumbrado Publico',
        'Gestion de operaciones financieras',
        'Gestion proyectos de promoción y desarrollo'
    ]

    const handleExport = async () => {
        setIsExporting(true)
        try {
            // 1. Crear Workbook
            const workbook = new ExcelJS.Workbook()
            workbook.creator = 'Planeación INFIBAGUÉ'
            workbook.created = new Date()

            const sheet = workbook.addWorksheet(`Reporte Procesos ${year}`, {
                pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
            })

            // 2. Encabezado e Imagen Institucional
            sheet.mergeCells('A1:P2')
            const headerCell = sheet.getCell('A1')
            headerCell.value = `INSTITUTO DE FINANCIAMIENTO, PROMOCIÓN Y DESARROLLO DE IBAGUÉ - INFIBAGUÉ\nRELACIÓN ENTREGA PLANES DE ACCIÓN ${year}`
            headerCell.font = { name: 'Arial', size: 14, bold: true }
            headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
            
            // Intento de obtener el logo base64 (fetch de public/logo.png)
            try {
                const response = await fetch('/logo.png')
                if (response.ok) {
                    const blob = await response.blob()
                    const reader = new FileReader()
                    reader.readAsDataURL(blob)
                    await new Promise(resolve => {
                        reader.onloadend = () => {
                            const base64data = reader.result as string
                            const imageId = workbook.addImage({
                                base64: base64data,
                                extension: 'png',
                            })
                            // Colocar la imagen en A1
                            sheet.addImage(imageId, {
                                tl: { col: 0.1, row: 0.1 },
                                ext: { width: 120, height: 60 }
                            })
                            resolve(null)
                        }
                    })
                }
            } catch (err) {
                console.warn('No se pudo cargar el logo institucional.', err)
            }

            // 3. Metadatos
            sheet.getCell('A3').value = 'FECHA CORTE:'
            sheet.getCell('A3').font = { bold: true }
            sheet.mergeCells('B3:E3')
            const today = new Date().toLocaleDateString('es-CO')
            sheet.getCell('B3').value = today

            sheet.getCell('O3').value = 'RESPONSABLE:'
            sheet.getCell('O3').font = { bold: true }
            sheet.getCell('P3').value = 'OFICINA DE PLANEACIÓN'

            // 4. Encabezados de Tabla (Fila 4)
            const columns = [
                'CONCEPTO', 'PROCESO', 'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE',
                'AVANCE FÍSICO', 'AVANCE INVERSIÓN'
            ]
            const tableHeaderRow = sheet.getRow(4)
            
            columns.forEach((colTitle, i) => {
                const cell = tableHeaderRow.getCell(i + 1)
                cell.value = colTitle
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF008000' } // Verde #008000
                }
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true } // Blanco
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                }
            })
            tableHeaderRow.height = 30

            // Configurar anchos
            sheet.getColumn(1).width = 20
            sheet.getColumn(2).width = 40
            for (let i = 3; i <= 14; i++) sheet.getColumn(i).width = 12
            sheet.getColumn(15).width = 16
            sheet.getColumn(16).width = 18
            sheet.getColumn(15).numFmt = '0.00%'
            sheet.getColumn(16).numFmt = '0.00%'

            // 5. Filas de Procesos
            let currentRow = 5
            const mesesMap = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
            const procesosPendientes: string[] = []

            for (const nombreProceso of MAESTRO_PROCESOS) {
                // Buscar si existe en la data
                const procData = reportData.find(d => 
                    d.proceso.trim().toUpperCase() === nombreProceso.toUpperCase()
                )
                
                // Buffer de fila con tipos específicos para evitar 'any'
                const rowBuffer: ExcelJS.CellValue[] = [procData ? procData.concepto : 'PLAN DE ACCIÓN', nombreProceso]
                
                let hasPendiente = false

                for (const m of mesesMap) {
                    const status = procData ? (procData.seguimiento[m] || '') : ''
                    rowBuffer.push(status as ExcelJS.CellValue)
                    if (status.includes('*** En revisión ***') || status.includes('revisión')) hasPendiente = true
                }
                
                if (hasPendiente) procesosPendientes.push(nombreProceso)

                // Avanzes
                rowBuffer.push(procData ? procData.avanceFisico : 0)
                rowBuffer.push(procData ? procData.avanceInversion : 0)

                const sheetRow = sheet.getRow(currentRow)
                sheetRow.values = rowBuffer

                // Estilos para la fila actual
                for (let c = 1; c <= 16; c++) {
                    const cell = sheetRow.getCell(c)
                    cell.border = { top:{style:'thin'}, left:{style:'thin'}, bottom:{style:'thin'}, right:{style:'thin'} }
                    cell.alignment = { vertical: 'middle', horizontal: 'center' }

                    // Color de estado (Colores de fondo rellenos)
                    if (c >= 3 && c <= 14) {
                        const val = cell.value?.toString() || ''
                        if (val === '√' || val.toLowerCase() === 'cumplido') {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B050' } }
                            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
                        } else if (val === 'X' || val.toLowerCase() === 'no cumplido') {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF0000' } }
                            cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
                        } else if (val.includes('revisión')) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
                            cell.font = { color: { argb: 'FF000000' }, bold: true, size: 9 } // Negro resaltado
                        }
                    }

                    // Formato de porcentaje
                    if (c === 15 || c === 16) {
                        cell.numFmt = '0.00%'
                        cell.font = { color: { argb: 'FF0000FF' }, bold: true } // Azul para que resalte
                    }
                }
                
                // Alineación izquierda para el nombre
                sheetRow.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
                currentRow++
            }

            // 6. Mini-tabla resumen (Pendientes por Firma)
            currentRow += 2 // Dejar 2 filas de espacio
            const resumenHeader = sheet.getCell(`B${currentRow}`)
            resumenHeader.value = 'CONTROL DE PROCESOS PENDIENTES POR FIRMA'
            resumenHeader.font = { bold: true, color: { argb: 'FFFF0000' } }
            resumenHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } } // Amarillo claro
            resumenHeader.border = { top:{style:'medium',color:{argb:'FFFF0000'}}, left:{style:'medium',color:{argb:'FFFF0000'}}, bottom:{style:'medium',color:{argb:'FFFF0000'}}, right:{style:'medium',color:{argb:'FFFF0000'}} }
            sheet.mergeCells(`B${currentRow}:E${currentRow}`)

            currentRow++
            if (procesosPendientes.length > 0) {
                procesosPendientes.forEach(p => {
                    sheet.mergeCells(`B${currentRow}:E${currentRow}`)
                    const c = sheet.getCell(`B${currentRow}`)
                    c.value = p
                    c.font = { bold: true }
                    c.border = { top:{style:'thin',color:{argb:'FFFF0000'}}, left:{style:'medium',color:{argb:'FFFF0000'}}, bottom:{style:'thin',color:{argb:'FFFF0000'}}, right:{style:'medium',color:{argb:'FFFF0000'}} }
                    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFE0' } }
                    currentRow++
                })
                // Fix el borde bottom de la ultima fila (hack)
                const lastCell = sheet.getCell(`B${currentRow - 1}`)
                if (lastCell && lastCell.border) {
                    lastCell.border = { ...lastCell.border, bottom: { style: 'medium', color: { argb: 'FFFF0000' } } }
                }
            } else {
                sheet.mergeCells(`B${currentRow}:E${currentRow}`)
                const c = sheet.getCell(`B${currentRow}`)
                c.value = 'Todos los procesos están al día.'
                c.font = { bold: true, color: { argb: 'FF008000' } }
                c.border = { top:{style:'thin',color:{argb:'FFFF0000'}}, left:{style:'medium',color:{argb:'FFFF0000'}}, bottom:{style:'medium',color:{argb:'FFFF0000'}}, right:{style:'medium',color:{argb:'FFFF0000'}} }
            }

            // -------------------------------------------------------------------------
            // 7. NUEVA HOJA: DETALLE DE OBSERVACIONES
            // -------------------------------------------------------------------------
            const obsSheet = workbook.addWorksheet('Observaciones', {
                pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
            })

            // Encabezado de la hoja de observaciones
            obsSheet.mergeCells('A1:D1')
            const obsTitleCell = obsSheet.getCell('A1')
            obsTitleCell.value = 'DETALLE DE OBSERVACIONES Y COMENTARIOS POR PERIODO'
            obsTitleCell.font = { name: 'Arial', size: 14, bold: true }
            obsTitleCell.alignment = { vertical: 'middle', horizontal: 'center' }

            const obsHeaderRow = obsSheet.getRow(3)
            const obsCols = ['PROCESO', 'PERIODO', 'OBSERVACIÓN OFICINA', 'OBSERVACIÓN EVALUADOR (PLANEACIÓN)']
            
            obsCols.forEach((colTitle, i) => {
                const cell = obsHeaderRow.getCell(i + 1)
                cell.value = colTitle
                cell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF4F81BD' } // Azul Institucional
                }
                cell.font = { color: { argb: 'FFFFFFFF' }, bold: true }
                cell.alignment = { horizontal: 'center', vertical: 'middle' }
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
            })

            // Anchos de columna para observaciones
            obsSheet.getColumn(1).width = 40
            obsSheet.getColumn(2).width = 15
            obsSheet.getColumn(3).width = 60
            obsSheet.getColumn(4).width = 60

            let obsCurrentRow = 4
            reportData.forEach(proc => {
                mesesMap.forEach(m => {
                    const obsOfi = proc.observacionesOficina?.[m]
                    const obsPlan = proc.observacionesPlaneacion?.[m]
                    
                    if (obsOfi || obsPlan) {
                        const row = obsSheet.getRow(obsCurrentRow)
                        row.values = [
                            proc.proceso, 
                            m.toUpperCase(), 
                            obsOfi || 'Sin observaciones', 
                            obsPlan || 'Sin observaciones'
                        ]
                        
                        // Estilos para la fila de observaciones
                        for (let i = 1; i <= 4; i++) {
                            const cell = row.getCell(i)
                            cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
                            cell.alignment = { vertical: 'top', horizontal: 'left', wrapText: true }
                            if (i === 2) cell.alignment = { horizontal: 'center', vertical: 'top' }
                        }
                        obsCurrentRow++
                    }
                })
            })

            if (obsCurrentRow === 4) {
                obsSheet.getCell('A4').value = 'No se encontraron observaciones registradas en este periodo.'
                obsSheet.mergeCells('A4:D4')
                obsSheet.getCell('A4').alignment = { horizontal: 'center' }
            }

            // Guardar archivo
            const buffer = await workbook.xlsx.writeBuffer()
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
            saveAs(blob, `Reporte_Infibague_Planes_${Date.now()}.xlsx`)

        } catch (error) {
            console.error('Error al generar Excel:', error)
            alert('Hubo un error generando el reporte.')
        } finally {
            setIsExporting(false)
        }
    }

    return (
        <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className={`gap-2 bg-green-600 hover:bg-green-700 text-white font-medium shadow-md transition-all ${className}`}
        >
            {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <FileSpreadsheet className="h-4 w-4" />
            )}
            {isExporting ? 'Generando...' : 'Generar Reporte Mensual'}
        </Button>
    )
}
