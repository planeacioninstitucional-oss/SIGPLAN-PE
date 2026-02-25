import * as XLSX from 'xlsx'

// ─── PIIP Template ───────────────────────────────────────────────────────────
export const PIIP_COLUMNS = [
    'dependencia',          // exact name in DB
    'codigo_proyecto',
    'nombre_proyecto',
    'objetivo',
    'meta_cuatrienio',
    'meta_anual',
    'ejecutado_acumulado',
    'presupuesto_asignado',
    'presupuesto_ejecutado',
    'estado',               // verde | amarillo | rojo | gris
    'observaciones',
    'url_soporte',
]

export const PIIP_HEADERS: Record<string, string> = {
    dependencia: 'Dependencia (exacta)',
    codigo_proyecto: 'Código Proyecto',
    nombre_proyecto: 'Nombre del Proyecto *',
    objetivo: 'Objetivo',
    meta_cuatrienio: 'Meta Cuatrienio',
    meta_anual: 'Meta Anual',
    ejecutado_acumulado: 'Ejecutado Acumulado',
    presupuesto_asignado: 'Presupuesto Asignado',
    presupuesto_ejecutado: 'Presupuesto Ejecutado',
    estado: 'Estado (verde/amarillo/rojo/gris)',
    observaciones: 'Observaciones',
    url_soporte: 'URL Soporte',
}

// ─── Plan Acción Municipal ────────────────────────────────────────────────────
export const PAM_COLUMNS = [
    'dependencia',
    'eje_estrategico',
    'programa',
    'subprograma',
    'meta_pdd',
    'indicador',
    'linea_base',
    'meta_vigencia',
    'logro_vigencia',
    'fuente_financiacion',
    'presupuesto',
    'estado',
    'observaciones',
    'url_soporte',
]

export const PAM_HEADERS: Record<string, string> = {
    dependencia: 'Dependencia (exacta)',
    eje_estrategico: 'Eje Estratégico *',
    programa: 'Programa *',
    subprograma: 'Subprograma',
    meta_pdd: 'Meta PDD *',
    indicador: 'Indicador',
    linea_base: 'Línea Base',
    meta_vigencia: 'Meta Vigencia',
    logro_vigencia: 'Logro Vigencia',
    fuente_financiacion: 'Fuente de Financiación',
    presupuesto: 'Presupuesto',
    estado: 'Estado (verde/amarillo/rojo/gris)',
    observaciones: 'Observaciones',
    url_soporte: 'URL Soporte',
}

// ─── Metas PDD ────────────────────────────────────────────────────────────────
export const METAS_PDD_COLUMNS = [
    'dependencia',
    'codigo_meta',
    'descripcion',
    'unidad_medida',
    'meta_programada',
    'meta_ejecutada',
    'observaciones',
]

export const METAS_PDD_HEADERS: Record<string, string> = {
    dependencia: 'Dependencia (exacta)',
    codigo_meta: 'Código Meta *',
    descripcion: 'Descripción *',
    unidad_medida: 'Unidad de Medida',
    meta_programada: 'Meta Programada',
    meta_ejecutada: 'Meta Ejecutada',
    observaciones: 'Observaciones',
}

// ─── Download function ────────────────────────────────────────────────────────
export function downloadTemplate(
    tipo: 'piip' | 'pam' | 'metas_pdd',
    dependencias: string[]
) {
    let columns: string[]
    let headers: Record<string, string>
    let filename: string
    let ejemploRow: Record<string, string | number>

    if (tipo === 'piip') {
        columns = PIIP_COLUMNS
        headers = PIIP_HEADERS
        filename = 'Plantilla_PIIP.xlsx'
        ejemploRow = {
            dependencia: dependencias[0] || 'Nombre Dependencia',
            codigo_proyecto: 'PIIP-001',
            nombre_proyecto: 'Construcción de infraestructura',
            objetivo: 'Mejorar la infraestructura de la entidad',
            meta_cuatrienio: 100,
            meta_anual: 25,
            ejecutado_acumulado: 0,
            presupuesto_asignado: 500000000,
            presupuesto_ejecutado: 0,
            estado: 'verde',
            observaciones: '',
            url_soporte: 'https://ejemplo.com/soporte',
        }
    } else if (tipo === 'pam') {
        columns = PAM_COLUMNS
        headers = PAM_HEADERS
        filename = 'Plantilla_PAM.xlsx'
        ejemploRow = {
            dependencia: dependencias[0] || 'Nombre Dependencia',
            eje_estrategico: 'Eje 1: Gobernanza',
            programa: 'Fortalecimiento institucional',
            subprograma: '',
            meta_pdd: 'Aumentar la eficiencia administrativa en un 20%',
            indicador: '% de procesos optimizados',
            linea_base: 0,
            meta_vigencia: 20,
            logro_vigencia: 0,
            fuente_financiacion: 'Recursos Propios',
            presupuesto: 100000000,
            estado: 'amarillo',
            observaciones: '',
            url_soporte: '',
        }
    } else {
        columns = METAS_PDD_COLUMNS
        headers = METAS_PDD_HEADERS
        filename = 'Plantilla_MetasPDD.xlsx'
        ejemploRow = {
            dependencia: dependencias[0] || 'Nombre Dependencia',
            codigo_meta: 'M-001',
            descripcion: 'Aumentar la cobertura del servicio',
            unidad_medida: 'Porcentaje',
            meta_programada: 100,
            meta_ejecutada: 0,
            observaciones: '',
        }
    }

    // Hoja principal de datos
    const headerRow = columns.map(c => headers[c])
    const dataRow = columns.map(c => (ejemploRow as any)[c] ?? '')

    const ws = XLSX.utils.aoa_to_sheet([headerRow, dataRow])

    // Estilo de ancho de columnas
    ws['!cols'] = columns.map(() => ({ wch: 30 }))

    // Hoja de referencia para dependencias
    const depWs = XLSX.utils.aoa_to_sheet([
        ['Lista de Dependencias Válidas'],
        ...dependencias.map(d => [d])
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Datos')
    XLSX.utils.book_append_sheet(wb, depWs, 'Dependencias')

    XLSX.writeFile(wb, filename)
}
