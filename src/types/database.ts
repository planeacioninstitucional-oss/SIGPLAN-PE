// TypeScript types for PGE-INFI database schema

export type RolUsuario = 'super_admin' | 'equipo_planeacion' | 'jefe_oficina' | 'gerente' | 'auditor_externo'
export type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo' | 'gris'
export type FrecuenciaInstrumento = 'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual'
export type EstadoVigencia = 'activa' | 'historica' | 'planificacion'

export interface Vigencia {
    id: string
    anio: number
    estado: EstadoVigencia
    descripcion: string | null
    created_at: string
    updated_at: string
}

export interface ProcesoMacro {
    id: string
    nombre: string
    orden: number
    created_at: string
}

export interface Dependencia {
    id: string
    nombre: string
    proceso_macro_id: string
    correo_responsable: string | null
    activa: boolean
    reporte_pdd: boolean
    created_at: string
    updated_at: string
    // Joined
    procesos_macro?: ProcesoMacro
}

export interface Perfil {
    id: string
    email: string
    nombre_completo: string
    rol: RolUsuario
    dependencia_id: string | null
    activo: boolean
    created_at: string
    updated_at: string
    // Joined
    dependencias?: Dependencia
}

export interface Instrumento {
    id: string
    nombre: string
    frecuencia: FrecuenciaInstrumento
    descripcion: string | null
    requiere_porcentajes: boolean
    requiere_riesgo: boolean
    es_numerico_pdd: boolean
    requiere_link: boolean
    activo: boolean
    orden: number
    created_at: string
}

export interface AsignacionEvaluador {
    instrumento_id: string
    perfil_id: string
    created_at: string
}

export interface Seguimiento {
    id: string
    vigencia_id: string
    dependencia_id: string
    instrumento_id: string
    periodo_corte: string
    estado_semaforo: EstadoSemaforo
    url_evidencia: string | null
    porcentaje_fisico: number | null
    porcentaje_financiero: number | null
    hubo_materializacion_riesgo: boolean | null
    url_saro: string | null
    meta_programada: number | null
    meta_ejecutada: number | null
    observacion_oficina: string | null
    observacion_planeacion: string | null
    subido_por: string | null
    evaluado_por: string | null
    updated_at: string
    created_at: string
    // Joined
    dependencias?: Dependencia
    instrumentos?: Instrumento
    vigencias?: Vigencia
}

export interface Piip {
    id: string
    vigencia_id: string
    dependencia_id: string
    codigo_proyecto: string | null
    nombre_proyecto: string
    objetivo: string | null
    meta_cuatrienio: number | null
    meta_anual: number | null
    ejecutado_acumulado: number
    presupuesto_asignado: number | null
    presupuesto_ejecutado: number
    estado: EstadoSemaforo
    observaciones: string | null
    url_soporte: string | null
    created_at: string
    updated_at: string
    dependencias?: Dependencia
}

export interface PlanInstitucional {
    id: string
    vigencia_id: string
    dependencia_id: string
    componente: string
    objetivo: string
    actividad: string
    indicador: string | null
    meta_anual: number | null
    logro_acumulado: number
    estado: EstadoSemaforo
    observaciones: string | null
    url_soporte: string | null
    responsable: string | null
    created_at: string
    updated_at: string
    dependencias?: Dependencia
}

export interface PlanAccionMunicipal {
    id: string
    vigencia_id: string
    dependencia_id: string
    eje_estrategico: string
    programa: string
    subprograma: string | null
    meta_pdd: string
    indicador: string | null
    linea_base: number | null
    meta_vigencia: number | null
    logro_vigencia: number
    fuente_financiacion: string | null
    presupuesto: number | null
    estado: EstadoSemaforo
    observaciones: string | null
    url_soporte: string | null
    created_at: string
    updated_at: string
    dependencias?: Dependencia
}

export interface AlistamientoAuditoria {
    id: string
    vigencia_id: string
    dependencia_id: string
    checkpoint_name: string
    cumplido: boolean
    observacion: string | null
    updated_by: string | null
    updated_at: string
    dependencias?: Dependencia
}

export interface MetasPdd {
    id: string
    vigencia_id: string
    dependencia_id: string
    codigo_meta: string
    descripcion: string
    unidad_medida: string | null
    meta_programada: number | null
    meta_ejecutada: number | null
    observaciones: string | null
    created_at: string
    updated_at: string
    dependencias?: Dependencia
}

// Audit checkpoints

export const CHECKPOINTS = [
    'Actualización Caracterización',
    'N° Indicadores',
    'Cierre de Seguimiento',
    'Actualización Matrices (IPVR)',
    'Matrices Ambientales',
    'Acciones Correctivas',
    'Producto No Conforme',
    'Publicado en Integra',
] as const

export type Checkpoint = typeof CHECKPOINTS[number]

// Dependencias con acceso a PDD (Módulo B)
export const DEPENDENCIAS_PDD = [
    'Gestion estrategica',
    'Unidad de negocio de panoptico',
    'Unidad de negocio de bicicletas rueda por ibague',
    'Transversal alumbrado publico',
    'Transversal plazas de mercado',
    'Transversal de parques y zonas verdes',
] as const
