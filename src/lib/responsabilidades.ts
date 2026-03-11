export const RESPONSABILIDADES_EQUIPO: Record<string, string[]> = {
    'PAOLA ANDREA OYOLA ALVIS': ['Plan de Acción municipal', 'METAS DE PLAN DE DESARROLLO', 'POAI - PLAN OPERATIVO ANUAL DE INVERSIONES'],
    'LUIS ALEJANDRO GIRALDO MONTOYA': ['Matriz de requisitos legales', 'Matriz Requisitos Legales'],
    'LINDA KATHERIN GARCIA JIMENEZ': ['FURAG Y ITA', 'MIPG', 'FURAG', 'ITA'],
    'ADRIANA ROCIO GUERRA TRONCOSO': ['Matriz de requisitos legales', 'Matriz de gestión del cambio', 'Matriz Requisitos Legales', 'Gestión del Cambio'],
    'MYRIAM LUCIA GARCIA ALVAREZ': ['caracterización del proceso', 'FODA O DOFA', 'ALSITAMIENTO DE AUDITORIA', 'ALISTAMIENTO DE AUDITORIA', 'FODA', 'DOFA'],
    'ANGY KATHERINE CRUZ AGUJA': ['Matriz de riesgos y oportunidades', 'Matriz IPVER', 'Programa de Transparencia, Ética Publica', 'Riesgos', 'Oportunidades'],
    'JORGE LUIS ROJAS BETANCOURTH': ['Matriz de aspectos e impactos ambientales', 'Impactos Ambientales'],
    'ANA MARIA MORALES AGUILAR': ['RUTA GENERADORA DE VALOR CON PLAN DE ACCION', 'RUTA GENERADORA DE VALOR'],
    'ANDRES LAMPREA ARROYO': [
        'INDICADORES DE GESTION',
        'Matriz de riesgos y oportunidades',
        'matriz de materialización de riesgos operativos',
        'POAI - Plan Operativo Anual de Inversiones',
        'FURAG, ITA',
        'Listado de maestros',
        'Proyecto piip',
        'Riesgos'
    ],
    'SANDRA MARITZA MACHADO ROJAS': ['Plan de accion institucional']
};

export function hasSidebarAccess(itemName: string, nombre_completo: string | null | undefined, rol: string, oficinaNombre?: string | null): boolean {
    if (rol === 'super_admin') return true;

    if (rol === 'jefe_oficina') {
        const oficinaUpper = (oficinaNombre || '').toUpperCase().trim();

        if (itemName === 'Metas PDD') {
            const ofisPDD = [
                'GESTIÓN ESTRATÉGICA', 'GESTION ESTRATEGICA',
                'GESTIÓN INTEGRAL DE RIESGOS', 'GESTION INTEGRAL DE RIESGOS',
                'ALUMBRADO PÚBLICO', 'ALUMBRADO PUBLICO',
                'PLAZAS DE MERCADO',
                'PARQUES Y ZONAS VERDES',
                'COMPLEJO CULTURAL PANÓPTICO', 'CULTURAL PANOPTICO',
                'BICICLETAS RUEDA POR IBAGUÉ', 'RUEDA POR IBAGUE',
                'GERENCIA GENERAL',
                'DIRECCIÓN OPERATIVA Y COMERCIAL',
                'DIRECCION OPERATIVA Y COMERCIAL',
                'DIRECCIÓN DE PROYECTOS Y SERVICIOS FINANCIEROS',
                'DIRECCION DE PROYECTOS Y SERVICIOS FINANCIEROS'
            ];
            // Permitimos si la oficina del jefe coincide con alguna de la lista
            return ofisPDD.some(o => oficinaUpper.includes(o) || o.includes(oficinaUpper));
        }

        if (itemName === 'Plan Acción Mun.') {
            const ofisPAM = [
                'PARQUES Y ZONAS VERDES',
                'COMPLEJO CULTURAL PANÓPTICO', 'CULTURAL PANOPTICO',
                'BICICLETAS RUEDA POR IBAGUÉ', 'RUEDA POR IBAGUE',
                'DIRECCIÓN OPERATIVA Y COMERCIAL',
                'DIRECCION OPERATIVA Y COMERCIAL',
                'DIRECCIÓN DE PROYECTOS Y SERVICIOS FINANCIEROS',
                'DIRECCION DE PROYECTOS Y SERVICIOS FINANCIEROS',
                'DIRECCIÓN FINANCIERA', 'DIRECCION FINANCIERA'
            ];
            // Permitimos si la oficina del jefe coincide con alguna de la lista
            return ofisPAM.some(o => oficinaUpper.includes(o) || o.includes(oficinaUpper));
        }

        return true;
    }

    if (rol !== 'equipo_planeacion' || !nombre_completo) return true;

    const nameUpper = nombre_completo.toUpperCase().trim();
    const misResponsabilidades = RESPONSABILIDADES_EQUIPO[nameUpper] || [];

    const itemsProtegidos = ['Metas PDD', 'Proyectos (PIIP)', 'Plan Acción Mun.'];
    if (!itemsProtegidos.includes(itemName)) {
        return true;
    }

    if (itemName === 'Plan Acción Mun.') {
        return misResponsabilidades.some(r => r.toUpperCase().includes('PLAN DE ACCIÓN MUNICIPAL') || r.toUpperCase().includes('PLAN DE ACCION MUNICIPAL'));
    }
    if (itemName === 'Metas PDD') {
        return misResponsabilidades.some(r => r.toUpperCase().includes('METAS DE PLAN DE DESARROLLO'));
    }
    if (itemName === 'Proyectos (PIIP)') {
        return misResponsabilidades.some(r => r.toUpperCase().includes('PROYECTO PIIP'));
    }

    return false;
}

export function canViewInstrumento(instrumentoNombre: string, nombre_completo: string | null | undefined, rol: string): boolean {
    if (rol === 'super_admin') return true;
    if (rol !== 'equipo_planeacion' || !nombre_completo) return false;

    const nameUpper = nombre_completo.toUpperCase().trim();
    const misResponsabilidades = RESPONSABILIDADES_EQUIPO[nameUpper] || [];

    return misResponsabilidades.some(r => {
        const rClean = r.toUpperCase().trim();
        const iClean = instrumentoNombre.toUpperCase().trim();
        return iClean.includes(rClean) || rClean.includes(iClean);
    });
}

// Filtra dependencias según el instrumento
export function getDependenciasParaInstrumento(instrumentoNombre: string, todasDependencias: any[]): any[] {
    const instUpper = instrumentoNombre.toUpperCase().trim();

    if (instUpper.includes('PROGRAMA DE TRANSPARENCIA') || instUpper.includes('ÉTICA PUBLICA') || instUpper.includes('ETICA PUBLICA')) {
        const oficinasPermitidas = [
            'COMUNICACIÓN Y PARTICIPACIÓN CIUDADANA',
            'COMUNICACION Y PARTICIPACION CIUDADANA',
            'GESTIÓN TECNOLÓGICA', 'GESTION TECNOLOGICA',
            'ATENCIÓN AL CIUDADANO', 'ATENCION AL CIUDADANO',
            'GESTIÓN ESTRATÉGICA', 'GESTION ESTRATEGICA',
            'HUMANA',
            'CONTROL DISCIPLINARIO',
            'EVALUACIÓN INDEPENDIENTE', 'EVALUACION INDEPENDIENTE' // Control Interno
        ];

        return todasDependencias.filter(dep =>
            oficinasPermitidas.some(o => (dep.nombre || '').toUpperCase().includes(o))
        );
    }

    // Si no es un instrumento especial, retorna todas
    return todasDependencias;
}

export function formatDependenciaName(name: string | null | undefined): string {
    if (!name) return '';
    const nameUpper = name.toUpperCase().trim();
    if (nameUpper.includes('FINANCIERA')) return 'Dirección Financiera';
    if (nameUpper.includes('HUMANA') || nameUpper.includes('SERVICIOS ADMINISTRATIVOS')) return 'Gestión Humana / Serv. Admin.';
    if (nameUpper.includes('JURIDICA') || nameUpper.includes('JURÍDICA')) return 'Gestión Jurídica';
    if (nameUpper.includes('PROYECTOS Y SERVICIOS FINANCIEROS')) return 'Dirección de Proyectos y Servicios Financieros';
    if (nameUpper.includes('OPERATIVA Y COMERCIAL')) return 'Dirección Operativa y Comercial';
    if (nameUpper.includes('PLANEACIÓN') || nameUpper.includes('PLANEACION')) return 'Planeación Institucional';
    if (nameUpper.includes('TECNOLÓGICA') || nameUpper.includes('TECNOLOGICA')) return 'Gestión Tecnológica';
    return name;
}

/**
 * Retorna los procesos que una oficina debe gestionar.
 * @param miOficinaId ID de la oficina del usuario (desde el perfil)
 * @param todosLosProcesos Lista completa de procesos_institucionales (con oficina_id)
 * @param todasLasOficinas Lista completa de oficinas (para buscar por nombre)
 */
export function getMisDependencias(miOficinaId: string, todosLosProcesos: any[], todasLasOficinas: any[]): any[] {
    if (!miOficinaId || !todosLosProcesos || todosLosProcesos.length === 0) return [];

    const miOficina = todasLasOficinas.find(o => o.id === miOficinaId);
    if (!miOficina) return [];

    const ofiNombre = (miOficina.nombre || '').toUpperCase().trim();
    let subProcesosKeywords: string[] = [];

    // LÓGICA DE CRUCES: Direcciones que ven procesos de otras oficinas
    if (ofiNombre.includes('FINANCIERA') || ofiNombre.includes('PROYECTOS Y SERVICIOS FINANCIEROS')) {
        subProcesosKeywords = [
            'GESTIÓN FINANCIERA', 'GESTION FINANCIERA'
        ];
    } else if (ofiNombre.includes('OPERATIVA Y COMERCIAL')) {
        subProcesosKeywords = [
            'ALUMBRADO PÚBLICO', 'ALUMBRADO PUBLICO',
            'PARQUES Y ZONAS VERDES',
            'PLAZAS DE MERCADO',
            'RELLENO SANITARIO',
            'COMERCIAL',
            'EMPRESARIALES'
        ];
    }

    // El usuario siempre ve los procesos de su propia oficina
    const resultsMap = new Map<string, any>();
    
    // 1. Agregar procesos propios
    todosLosProcesos
        .filter(p => p.oficina_id === miOficinaId)
        .forEach(p => resultsMap.set(p.id, p));

    // 2. Agregar procesos por keywords (la "lógica" de cruces)
    if (subProcesosKeywords.length > 0) {
        todosLosProcesos.forEach(p => {
            const procNombre = (p.nombre || '').toUpperCase().trim();
            if (subProcesosKeywords.some(kw => procNombre.includes(kw))) {
                resultsMap.set(p.id, p);
            }
        });
    }

    return Array.from(resultsMap.values());
}
