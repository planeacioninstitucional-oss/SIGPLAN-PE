'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useVigenciaStore } from '@/stores/vigenciaStore'
import * as XLSX from 'xlsx'
import { downloadTemplate } from '@/lib/excel-templates'
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'
import {
    Upload, Download, FileSpreadsheet, CheckCircle2,
    XCircle, Loader2, AlertCircle, ChevronRight, RotateCcw, Database
} from 'lucide-react'
import type { Dependencia } from '@/types/database'

type ImportType = 'piip' | 'pam' | 'metas_pdd'

interface ParsedRow {
    rowIndex: number
    data: Record<string, any>
    errors: string[]
    valid: boolean
}

const MODULES: { id: ImportType; label: string; description: string; color: string }[] = [
    {
        id: 'piip',
        label: 'PIIP',
        description: 'Plan Indicativo de Inversión por Proyecto',
        color: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
        id: 'pam',
        label: 'Plan de Acción Municipal',
        description: 'Metas y logros del Plan de Acción Municipal',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
        id: 'metas_pdd',
        label: 'Metas PDD',
        description: 'Metas del Plan de Desarrollo Distrital',
        color: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
]

const REQUIRED_PIIP = ['nombre_proyecto']
const REQUIRED_PAM = ['eje_estrategico', 'programa', 'meta_pdd']
const REQUIRED_METAS = ['codigo_meta', 'descripcion']

const PIIP_COL_MAP: Record<string, string> = {
    'dependencia (exacta)': 'dependencia',
    'código proyecto': 'codigo_proyecto',
    'nombre del proyecto *': 'nombre_proyecto',
    'objetivo': 'objetivo',
    'meta cuatrienio': 'meta_cuatrienio',
    'meta anual': 'meta_anual',
    'ejecutado acumulado': 'ejecutado_acumulado',
    'presupuesto asignado': 'presupuesto_asignado',
    'presupuesto ejecutado': 'presupuesto_ejecutado',
    'estado (verde/amarillo/rojo/gris)': 'estado',
    'observaciones': 'observaciones',
    'url soporte': 'url_soporte',
}

const PAM_COL_MAP: Record<string, string> = {
    'dependencia (exacta)': 'dependencia',
    'eje estratégico *': 'eje_estrategico',
    'programa *': 'programa',
    'subprograma': 'subprograma',
    'meta pdd *': 'meta_pdd',
    'indicador': 'indicador',
    'línea base': 'linea_base',
    'meta vigencia': 'meta_vigencia',
    'logro vigencia': 'logro_vigencia',
    'fuente de financiación': 'fuente_financiacion',
    'presupuesto': 'presupuesto',
    'estado (verde/amarillo/rojo/gris)': 'estado',
    'observaciones': 'observaciones',
    'url soporte': 'url_soporte',
}

const METAS_COL_MAP: Record<string, string> = {
    'dependencia (exacta)': 'dependencia',
    'código meta *': 'codigo_meta',
    'descripción *': 'descripcion',
    'unidad de medida': 'unidad_medida',
    'meta programada': 'meta_programada',
    'meta ejecutada': 'meta_ejecutada',
    'observaciones': 'observaciones',
}

const VALID_ESTADOS = ['verde', 'amarillo', 'rojo', 'gris']

function mapRow(
    rawRow: Record<string, any>,
    colMap: Record<string, string>
): Record<string, any> {
    const result: Record<string, any> = {}
    for (const [rawKey, rawVal] of Object.entries(rawRow)) {
        const normalKey = rawKey.trim().toLowerCase()
        const dbKey = colMap[normalKey]
        if (dbKey) result[dbKey] = rawVal
    }
    return result
}

function validateRow(
    row: Record<string, any>,
    tipo: ImportType,
    depNames: Set<string>
): string[] {
    const errors: string[] = []
    const required = tipo === 'piip' ? REQUIRED_PIIP : tipo === 'pam' ? REQUIRED_PAM : REQUIRED_METAS

    for (const field of required) {
        if (!row[field] || String(row[field]).trim() === '') {
            errors.push(`Campo obligatorio vacío: "${field}"`)
        }
    }

    if (row.dependencia && !depNames.has(String(row.dependencia).trim())) {
        errors.push(`Dependencia no encontrada: "${row.dependencia}"`)
    }

    if (row.estado && !VALID_ESTADOS.includes(String(row.estado).toLowerCase())) {
        errors.push(`Estado inválido: "${row.estado}". Debe ser: verde, amarillo, rojo o gris`)
    }

    return errors
}

export default function ImportarPage() {
    const { vigenciaActual } = useVigenciaStore()
    const [selectedModule, setSelectedModule] = useState<ImportType>('piip')
    const [dependencias, setDependencias] = useState<Dependencia[]>([])
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([])
    const [fileName, setFileName] = useState<string>('')
    const [isDragging, setIsDragging] = useState(false)
    const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'done'>('upload')
    const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
    const [showOnlyErrors, setShowOnlyErrors] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        const fetchDeps = async () => {
            const { data } = await supabase.from('dependencias').select('*').order('nombre')
            if (data) setDependencias(data)
        }
        fetchDeps()
    }, [])

    const depNames = new Set(dependencias.map(d => d.nombre.trim()))
    const depNameToId = new Map(dependencias.map(d => [d.nombre.trim(), d.id]))

    const getColMap = (tipo: ImportType) =>
        tipo === 'piip' ? PIIP_COL_MAP : tipo === 'pam' ? PAM_COL_MAP : METAS_COL_MAP

    const processFile = useCallback((file: File) => {
        if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
            toast.error('Formato inválido. Use .xlsx, .xls o .csv')
            return
        }

        setFileName(file.name)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target!.result as ArrayBuffer)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheet = workbook.Sheets[workbook.SheetNames[0]]
                const rawData: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '' })

                if (rawData.length === 0) {
                    toast.error('El archivo está vacío o no tiene datos válidos')
                    return
                }

                const colMap = getColMap(selectedModule)
                const rows: ParsedRow[] = rawData.map((raw, i) => {
                    const mapped = mapRow(raw, colMap)
                    const errors = validateRow(mapped, selectedModule, depNames)
                    return {
                        rowIndex: i + 2, // 1-indexed + header row
                        data: mapped,
                        errors,
                        valid: errors.length === 0
                    }
                })

                setParsedRows(rows)
                setStep('preview')

                const valid = rows.filter(r => r.valid).length
                const invalid = rows.filter(r => !r.valid).length
                toast.success(`${rawData.length} filas leídas: ${valid} válidas, ${invalid} con errores`)

            } catch (err) {
                toast.error('Error al procesar el archivo. Verifica el formato.')
                console.error(err)
            }
        }
        reader.readAsArrayBuffer(file)
    }, [selectedModule, depNames])

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) processFile(file)
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) processFile(file)
    }

    const handleImport = async () => {
        if (!vigenciaActual) {
            toast.error('No hay vigencia activa seleccionada')
            return
        }

        const validRows = parsedRows.filter(r => r.valid)
        if (validRows.length === 0) {
            toast.error('No hay filas válidas para importar')
            return
        }

        setStep('importing')

        let success = 0
        let failed = 0

        const tableName = selectedModule === 'piip' ? 'piip'
            : selectedModule === 'pam' ? 'plan_accion_municipal'
                : 'metas_pdd'

        // Insert in batches of 50
        const BATCH = 50
        for (let i = 0; i < validRows.length; i += BATCH) {
            const batch = validRows.slice(i, i + BATCH).map(r => {
                const { dependencia, estado, ...rest } = r.data
                const depId = depNameToId.get(String(dependencia || '').trim())

                // Build numeric fields
                const numericFields = ['meta_cuatrienio', 'meta_anual', 'ejecutado_acumulado',
                    'presupuesto_asignado', 'presupuesto_ejecutado', 'linea_base',
                    'meta_vigencia', 'logro_vigencia', 'presupuesto',
                    'meta_programada', 'meta_ejecutada']

                const processed: Record<string, any> = {
                    ...rest,
                    vigencia_id: vigenciaActual.id,
                    dependencia_id: depId || null,
                    ...(estado ? { estado: String(estado).toLowerCase() } : {}),
                }

                for (const f of numericFields) {
                    if (f in processed && processed[f] !== '') {
                        const val = parseFloat(String(processed[f]).replace(/,/g, ''))
                        processed[f] = isNaN(val) ? null : val
                    } else if (f in processed) {
                        processed[f] = null
                    }
                }

                // Asegurar que campos requeridos no queden nulos para evitar 'not-null constraint' en la BD
                const strictNumberFields = ['ejecutado_acumulado', 'presupuesto_ejecutado', 'logro_vigencia', 'logro_acumulado']
                for (const sf of strictNumberFields) {
                    if (sf in processed && processed[sf] === null) {
                        processed[sf] = 0
                    }
                }

                return processed
            })

            const { error } = await (supabase as any).from(tableName).insert(batch)
            if (error) {
                failed += batch.length
                console.error('Batch error:', error)
            } else {
                success += batch.length
            }
        }

        setImportResult({ success, failed })
        setStep('done')

        if (failed === 0) {
            toast.success(`¡Importación completa! ${success} registros importados`)
        } else {
            toast.error(`Importación parcial: ${success} exitosos, ${failed} fallidos`)
        }
    }

    const handleReset = () => {
        setParsedRows([])
        setFileName('')
        setStep('upload')
        setImportResult(null)
        setShowOnlyErrors(false)
    }

    const validCount = parsedRows.filter(r => r.valid).length
    const errorCount = parsedRows.filter(r => !r.valid).length
    const displayRows = showOnlyErrors ? parsedRows.filter(r => !r.valid) : parsedRows

    const currentModule = MODULES.find(m => m.id === selectedModule)!

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Importador Masivo</h1>
                    <p className="text-muted-foreground">Carga datos desde Excel para {vigenciaActual ? `Vigencia ${vigenciaActual.anio}` : 'la vigencia seleccionada'}</p>
                </div>
                {step !== 'upload' && (
                    <Button variant="outline" onClick={handleReset} className="border-border">
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Nueva Importación
                    </Button>
                )}
            </div>

            {/* Vigencia Warning */}
            {!vigenciaActual && (
                <Card className="border-yellow-500/30 bg-yellow-500/5">
                    <CardContent className="flex items-center gap-3 pt-4">
                        <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0" />
                        <p className="text-yellow-600 dark:text-yellow-300 text-sm">
                            Selecciona una vigencia en la barra superior antes de importar datos.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Step 1: Upload */}
            {step === 'upload' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Module Selector */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            1. Selecciona el módulo
                        </h2>
                        {MODULES.map(mod => (
                            <button
                                key={mod.id}
                                onClick={() => setSelectedModule(mod.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all ${selectedModule === mod.id
                                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/50'
                                    : 'border-border bg-card hover:border-blue-500/50 hover:bg-muted/50'
                                    }`}
                            >
                                <div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold mb-2 border ${mod.color}`}>
                                    {mod.label}
                                </div>
                                <p className="text-xs text-muted-foreground">{mod.description}</p>
                                {selectedModule === mod.id && (
                                    <ChevronRight className="w-4 h-4 text-blue-400 mt-1" />
                                )}
                            </button>
                        ))}

                        {/* Download Template */}
                        <div className="pt-2">
                            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                                2. Descarga la plantilla
                            </h2>
                            <Button
                                variant="outline"
                                className="w-full border-border hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
                                onClick={() => downloadTemplate(selectedModule, dependencias.map(d => d.nombre))}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Descargar Plantilla {currentModule.label}
                            </Button>
                            <p className="text-xs text-muted-foreground mt-2">
                                La plantilla incluye las columnas correctas y una hoja de referencia con las dependencias válidas.
                            </p>
                        </div>
                    </div>

                    {/* Drop Zone */}
                    <div className="lg:col-span-2">
                        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                            3. Sube tu archivo
                        </h2>
                        <div
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            className={`relative border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center min-h-[320px] cursor-pointer
                                ${isDragging
                                    ? 'border-blue-500 bg-blue-500/10'
                                    : 'border-border bg-muted/30 hover:border-muted-foreground/50 hover:bg-muted/50'
                                }`}
                        >
                            <label className="cursor-pointer flex flex-col items-center gap-4 p-8 w-full h-full absolute inset-0 justify-center">
                                <input
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    className="hidden"
                                    onChange={handleFileInput}
                                />

                                <div className={`h-20 w-20 rounded-full flex items-center justify-center transition-colors ${isDragging ? 'bg-blue-500/30' : 'bg-muted'}`}>
                                    <FileSpreadsheet className={`h-10 w-10 ${isDragging ? 'text-blue-500' : 'text-muted-foreground'}`} />
                                </div>

                                <div className="text-center">
                                    <p className="text-foreground font-semibold text-lg">
                                        {isDragging ? 'Suelta el archivo aquí' : 'Arrastra tu Excel aquí'}
                                    </p>
                                    <p className="text-muted-foreground text-sm mt-1">o haz clic para seleccionar</p>
                                    <p className="text-muted-foreground/60 text-xs mt-3">Soporta .xlsx, .xls y .csv</p>
                                </div>

                                <div className={`mt-2 px-2 py-1 rounded-full text-xs border ${currentModule.color}`}>
                                    Módulo: {currentModule.label}
                                </div>
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Preview */}
            {step === 'preview' && (
                <div className="space-y-4">
                    {/* Stats Bar */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="card-glass border-border">
                            <CardContent className="pt-4 flex items-center gap-3">
                                <FileSpreadsheet className="w-8 h-8 text-muted-foreground" />
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{parsedRows.length}</p>
                                    <p className="text-xs text-muted-foreground">Filas leídas</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card-glass border-border">
                            <CardContent className="pt-4 flex items-center gap-3">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{validCount}</p>
                                    <p className="text-xs text-muted-foreground">Filas válidas</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="card-glass border-border">
                            <CardContent className="pt-4 flex items-center gap-3">
                                <XCircle className="w-8 h-8 text-red-500" />
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{errorCount}</p>
                                    <p className="text-xs text-muted-foreground">Con errores</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* File Info */}
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{fileName}</span>
                            <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                {currentModule.label}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            {errorCount > 0 && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowOnlyErrors(!showOnlyErrors)}
                                    className={`border-slate-700 text-xs ${showOnlyErrors ? 'bg-red-500/10 border-red-500 text-red-400' : ''}`}
                                >
                                    {showOnlyErrors ? 'Ver todas' : `Ver solo errores (${errorCount})`}
                                </Button>
                            )}
                            <Button
                                onClick={handleImport}
                                disabled={validCount === 0 || !vigenciaActual}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                Importar {validCount} registros
                            </Button>
                        </div>
                    </div>

                    {/* Preview Table */}
                    <Card className="card-glass border-border shadow-sm">
                        <CardContent className="pt-0 overflow-x-auto max-h-[50vh] overflow-y-auto p-0">
                            <table className="w-full text-sm">
                                <thead className="bg-muted sticky top-0 z-10 border-b border-border">
                                    <tr>
                                        <th className="text-left p-3 text-muted-foreground font-semibold">Fila</th>
                                        <th className="text-left p-3 text-muted-foreground font-semibold">Estado</th>
                                        <th className="text-left p-3 text-muted-foreground font-semibold">Dependencia</th>
                                        <th className="text-left p-3 text-muted-foreground font-semibold">
                                            {selectedModule === 'piip' ? 'Nombre Proyecto'
                                                : selectedModule === 'pam' ? 'Meta PDD'
                                                    : 'Descripción'}
                                        </th>
                                        <th className="text-left p-3 text-muted-foreground font-semibold">
                                            {selectedModule === 'piip' ? 'Presupuesto Asignado'
                                                : selectedModule === 'pam' ? 'Eje Estratégico'
                                                    : 'Código Meta'}
                                        </th>
                                        <th className="text-left p-3 text-muted-foreground font-semibold">Errores</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {displayRows.map((row) => (
                                        <tr
                                            key={row.rowIndex}
                                            className={`border-t border-border ${row.valid ? 'hover:bg-muted/50' : 'bg-red-500/5 hover:bg-red-500/10'}`}
                                        >
                                            <td className="p-3 text-muted-foreground text-xs font-mono">{row.rowIndex}</td>
                                            <td className="p-3">
                                                {row.valid
                                                    ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                                                    : <XCircle className="w-4 h-4 text-red-400" />
                                                }
                                            </td>
                                            <td className="p-3 text-foreground text-xs max-w-[150px] truncate">
                                                {row.data.dependencia || <span className="text-muted-foreground italic">Sin dependencia</span>}
                                            </td>
                                            <td className="p-3 text-foreground text-xs max-w-[200px] truncate">
                                                {selectedModule === 'piip' ? row.data.nombre_proyecto
                                                    : selectedModule === 'pam' ? row.data.meta_pdd
                                                        : row.data.descripcion}
                                            </td>
                                            <td className="p-3 text-foreground text-xs max-w-[150px] truncate">
                                                {selectedModule === 'piip'
                                                    ? (row.data.presupuesto_asignado
                                                        ? `$${Number(row.data.presupuesto_asignado).toLocaleString('es-CO')}`
                                                        : '—')
                                                    : selectedModule === 'pam' ? row.data.eje_estrategico
                                                        : row.data.codigo_meta}
                                            </td>
                                            <td className="p-3 max-w-[250px]">
                                                {row.errors.length === 0
                                                    ? <span className="text-green-600 dark:text-green-500 text-xs font-medium">✓ OK</span>
                                                    : (
                                                        <ul className="space-y-0.5">
                                                            {row.errors.map((e, i) => (
                                                                <li key={i} className="text-red-600 dark:text-red-400 text-xs flex items-start gap-1">
                                                                    <span className="shrink-0 mt-0.5">•</span>
                                                                    {e}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 3: Importing */}
            {step === 'importing' && (
                <div className="flex flex-col items-center justify-center py-24 gap-6">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="text-xl font-semibold text-foreground">Importando datos...</p>
                        <p className="text-muted-foreground text-sm mt-1">Cargando {validCount} registros en la base de datos</p>
                    </div>
                </div>
            )}

            {/* Step 4: Done */}
            {step === 'done' && importResult && (
                <div className="flex flex-col items-center justify-center py-16 gap-6">
                    <div className={`h-24 w-24 rounded-full flex items-center justify-center ${importResult.failed === 0 ? 'bg-green-500/20' : 'bg-yellow-500/20'}`}>
                        {importResult.failed === 0
                            ? <CheckCircle2 className="h-12 w-12 text-green-400" />
                            : <AlertCircle className="h-12 w-12 text-yellow-400" />
                        }
                    </div>

                    <div className="text-center">
                        <p className="text-2xl font-bold text-foreground mb-2">
                            {importResult.failed === 0 ? '¡Importación Exitosa!' : 'Importación Parcial'}
                        </p>
                        <div className="flex items-center gap-6 justify-center mt-4">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{importResult.success}</p>
                                <p className="text-muted-foreground text-sm">Importados</p>
                            </div>
                            {importResult.failed > 0 && (
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">{importResult.failed}</p>
                                    <p className="text-muted-foreground text-sm">Fallidos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button onClick={handleReset} variant="outline" className="border-border">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Importar otro archivo
                        </Button>
                        <Button
                            className="bg-blue-600 hover:bg-blue-500"
                            onClick={() => window.location.assign(`/${selectedModule === 'piip' ? 'piip' : selectedModule === 'pam' ? 'plan-accion-municipal' : 'metas-pdd'}`)}
                        >
                            <Database className="w-4 h-4 mr-2" />
                            Ver datos importados
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
