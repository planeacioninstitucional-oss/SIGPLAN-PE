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
        'Riesgos',
        'Gestion proyectos de promoción y desarrollo',
        'Gestion de operaciones financieras'
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
                'GERENCIA GENERAL',
                'DIRECCIÓN OPERATIVA Y COMERCIAL',
                'DIRECCION OPERATIVA Y COMERCIAL',
                'DIRECCIÓN DE PROYECTOS Y SERVICIOS FINANCIEROS',
                'DIRECCION DE PROYECTOS Y SERVICIOS FINANCIEROS'
            ];
            return ofisPDD.some(o => oficinaUpper.includes(o) || o.includes(oficinaUpper));
        }

        if (itemName === 'Plan Acción Mun.') {
            const ofisPAM = [
                'PARQUES Y ZONAS VERDES',
                'DIRECCIÓN OPERATIVA Y COMERCIAL',
                'DIRECCION OPERATIVA Y COMERCIAL',
                'DIRECCIÓN DE PROYECTOS Y SERVICIOS FINANCIEROS',
                'DIRECCION DE PROYECTOS Y SERVICIOS FINANCIEROS'
            ];
            return ofisPAM.some(o => oficinaUpper.includes(o) || o.includes(oficinaUpper));
        }

        if (itemName === 'Importar Excel') {
            const allowedNames = ['PAOLA ANDREA OYOLA ALVIS'];
            const nameUpper = (nombre_completo || '').toUpperCase().trim();
            return allowedNames.some(name => nameUpper.includes(name));
        }

        return true;
    }

    if (rol !== 'equipo_planeacion' || !nombre_completo) return true;

    const nameUpper = nombre_completo.toUpperCase().trim();
    const misResponsabilidades = RESPONSABILIDADES_EQUIPO[nameUpper] || [];

    const itemsProtegidos = ['Metas PDD', 'Proyectos (PIIP)', 'Plan Acción Mun.', 'Importar Excel'];
    if (!itemsProtegidos.includes(itemName)) {
        return true;
    }

    if (itemName === 'Importar Excel') {
        const allowedNames = ['PAOLA ANDREA OYOLA ALVIS'];
        return allowedNames.some(name => nameUpper.includes(name));
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
            'EVALUACIÓN INDEPENDIENTE', 'EVALUACION INDEPENDIENTE'
        ];

        return todasDependencias.filter(dep =>
            oficinasPermitidas.some(o => (dep.nombre || '').toUpperCase().includes(o))
        );
    }

    return todasDependencias;
}

export function formatDependenciaName(name: string | null | undefined): string {
    if (!name) return '';
    const nameUpper = name.toUpperCase().trim();
    
    // Exact Mappings based on User's 21 dependencies
    if (nameUpper.includes('ALUMBRADO PÚBLICO')) return 'Alumbrado Público';
    if (nameUpper.includes('ATENCIÓN AL CIUDADANO')) return 'Atención al Ciudadano';
    if (nameUpper.includes('COMUNICACIÓN Y PARTICIPACIÓN')) return 'Comunicación y Participación Ciudadana';
    if (nameUpper.includes('CONTROL DISCIPLINARIO')) return 'Control Disciplinario';
    if (nameUpper.includes('EVALUACIÓN INDEPENDIENTE')) return 'Evaluación Independiente';
    if (nameUpper.includes('GESTIÓN COMERCIAL')) return 'Gestión Comercial';
    if (nameUpper.includes('GESTIÓN CONTRACTUAL')) return 'Gestión Contractual';
    if (nameUpper.includes('GESTION FINANCIERA')) return 'Gestion Financiera';
    if (nameUpper.includes('GESTIÓN DEL SIG')) return 'Gestión del SIG';
    if (nameUpper.includes('GESTIÓN DOCUMENTAL')) return 'Gestión Documental';
    if (nameUpper.includes('GESTIÓN ESTRATÉGICA')) return 'Gestión Estratégica';
    if (nameUpper.includes('GESTIÓN HUMANA')) return 'Gestión Humana';
    if (nameUpper.includes('GESTIÓN INTEGRAL DE RIESGOS')) return 'Gestión Integral de Riesgos';
    if (nameUpper.includes('GESTIÓN JURÍDICA')) return 'Gestión Jurídica';
    if (nameUpper.includes('GESTIÓN TECNOLÓGICA') || nameUpper.includes('TRANSFORMACIÓN DIGITAL')) return 'Gestión Tecnológica y transformación digital';
    if (nameUpper.includes('PARQUES Y ZONAS VERDES')) return 'Parques y Zonas Verdes';
    if (nameUpper.includes('PLAZAS DE MERCADO')) return 'Plazas de Mercado';
    if (nameUpper.includes('RECURSOS FÍSICOS') || nameUpper.includes('RECURSOS FISICOS')) return 'Gestion de recursos fisicos';
    if (nameUpper.includes('RELLENO SANITARIO')) return 'Relleno Sanitario';
    if (nameUpper.includes('PROMOCIÓN Y DESARROLLO')) return 'Gestion proyectos de promoción y desarrollo';
    if (nameUpper.includes('OPERACIONES FINANCIERAS')) return 'Gestion de operaciones financieras';

    return name;
}

export function getMisDependencias(miOficinaId: string, todosLosProcesos: any[], todasLasOficinas: any[], todasDependencias: any[] = []): any[] {
    if (!miOficinaId || !todosLosProcesos || todosLosProcesos.length === 0) return [];

    const miOficina = todasLasOficinas.find(o => o.id === miOficinaId);
    if (!miOficina) return [];

    const ofiNombre = (miOficina.nombre || '').toUpperCase().trim();
    let subProcesosKeywords: string[] = [];

    if (ofiNombre.includes('PROYECTOS Y SERVICIOS FINANCIEROS')) {
        subProcesosKeywords = [
            'PROMOCIÓN Y DESARROLLO', 'PROMOCION Y DESARROLLO',
            'OPERACIONES FINANCIERAS'
        ];
    } else if (ofiNombre.includes('FINANCIERA')) {
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
    } else if (ofiNombre.includes('ADMINISTRATIVA')) {
        subProcesosKeywords = [
            'GESTIÓN HUMANA', 'GESTION HUMANA',
            'GESTIÓN DOCUMENTAL', 'GESTION DOCUMENTAL',
            'RECURSOS FÍSICOS', 'RECURSOS FISICOS',
            'GESTIÓN CONTRACTUAL', 'GESTION CONTRACTUAL'
        ];
    } else if (ofiNombre.includes('JURÍDICA') || ofiNombre.includes('JURIDICA')) {
        subProcesosKeywords = [
            'GESTIÓN JURÍDICA', 'GESTION JURIDICA'
        ];
    }

    const resultsMap = new Map<string, any>();
    
    todosLosProcesos
        .filter(p => p.oficina_id === miOficinaId)
        .forEach(p => resultsMap.set(p.id, p));

    if (subProcesosKeywords.length > 0) {
        todosLosProcesos.forEach(p => {
            const procNombre = (p.nombre || '').toUpperCase().trim();
            if (subProcesosKeywords.some(kw => procNombre.includes(kw))) {
                resultsMap.set(p.id, p);
            }
        });
    }

    if (todasDependencias.length > 0) {
        todasDependencias.forEach(dep => {
            const depNombre = (dep.nombre || '').toUpperCase().trim();
            if (depNombre.includes(ofiNombre) || ofiNombre.includes(depNombre)) {
                 resultsMap.set(dep.id, { ...dep, is_legacy_dep: true });
            }
            if (subProcesosKeywords.some(kw => depNombre.includes(kw))) {
                resultsMap.set(dep.id, { ...dep, is_legacy_dep: true });
            }
        });
    }

    return Array.from(resultsMap.values());
}
