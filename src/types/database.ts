// TypeScript types for PGE-INFI database schema — SIGPLAN-PE
// Reestructurado: Oficinas → Procesos Institucionales

// ─── Enums / Unions ─────────────────────────────────────────────────────────
export type RolUsuario =
    | 'super_admin'
    | 'jefe_oficina'
    | 'equipo_planeacion'
    | 'gerente'
    | 'auditor'

export type EstadoSemaforo = 'verde' | 'amarillo' | 'rojo' | 'gris'
export type FrecuenciaInstrumento = 'mensual' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual'
export type EstadoVigencia = 'activa' | 'historica' | 'planificacion'

export const ROL_LABELS: Record<RolUsuario, string> = {
    super_admin: 'Super Administrador',
    jefe_oficina: 'Jefe de Oficina/Funcionario',
    equipo_planeacion: 'Equipo de Planeación',
    gerente: 'Gerente',
    auditor: 'Auditor',
}

// ─── Estructura Institucional ───────────────────────────────────────────────

export interface GrupoProceso {
    id: string
    nombre: string
    orden: number
    color: string
    created_at: string
}

export interface Oficina {
    id: string
    nombre: string
    abreviatura: string | null
    activa: boolean
    created_at: string
}

export interface ProcesoInstitucional {
    id: string
    nombre: string
    grupo_id: string
    oficina_id: string
    activo: boolean
    orden: number
    created_at: string
    // Joined
    grupos_proceso?: GrupoProceso
    oficinas?: Oficina
}

// ─── Usuarios ────────────────────────────────────────────────────────────────

export interface Perfil {
    id: string
    email: string
    nombre_completo: string | null
    cargo: string | null
    rol: RolUsuario
    oficina_id: string | null
    activo: boolean
    created_at: string
    updated_at: string
    // Joined (new schema)
    oficinas?: Oficina
    // Legacy join shim — backward compatibility with older pages
    dependencias?: { nombre: string;[key: string]: any }
}

// ─── Vigencia ────────────────────────────────────────────────────────────────

export interface Vigencia {
    id: string
    anio: number
    estado: EstadoVigencia
    descripcion: string | null
    created_at: string
    updated_at: string
}

// ─── Instrumentos / Seguimiento ─────────────────────────────────────────────

/** @deprecated Usar Oficina en lugar de Dependencia */
export interface Dependencia {
    id: string
    nombre: string
    proceso_macro_id: string
    correo_responsable: string | null
    activa: boolean
    reporte_pdd: boolean
    created_at: string
    updated_at: string
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
    historial_ediciones: any[] | null
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

export interface Notificacion {
    id: string
    user_id: string
    titulo: string
    mensaje: string
    tipo: 'info' | 'success' | 'warning' | 'error' | 'meta_update' | 'observacion'
    leida: boolean
    link: string | null
    metadata: any
    created_at: string
}

// ─── Constantes ──────────────────────────────────────────────────────────────

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
