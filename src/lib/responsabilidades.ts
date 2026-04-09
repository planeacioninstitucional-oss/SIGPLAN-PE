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
    'SANDRA MARITZA MACHADO ROJAS': ['Plan de Acción Institucional']
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

    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const nameNormalized = normalize(nombre_completo);
    
    // Find the key in RESPONSABILIDADES_EQUIPO that matches nameNormalized
    const matchingKey = Object.keys(RESPONSABILIDADES_EQUIPO).find(key => normalize(key) === nameNormalized);
    const misResponsabilidades = matchingKey ? RESPONSABILIDADES_EQUIPO[matchingKey] : [];

    const itemsProtegidos = ['Metas PDD', 'Proyectos (PIIP)', 'Plan Acción Mun.', 'Importar Excel'];
    if (!itemsProtegidos.includes(itemName)) {
        return true;
    }

    if (itemName === 'Importar Excel') {
        const allowedNames = ['PAOLA ANDREA OYOLA ALVIS'];
        return allowedNames.some(name => nameNormalized.includes(name));
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

    const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
    const nameNormalized = normalize(nombre_completo);
    
    // Find the key in RESPONSABILIDADES_EQUIPO that matches nameNormalized
    const matchingKey = Object.keys(RESPONSABILIDADES_EQUIPO).find(key => normalize(key) === nameNormalized);
    const misResponsabilidades = matchingKey ? RESPONSABILIDADES_EQUIPO[matchingKey] : [];

    return misResponsabilidades.some(r => {
        const rClean = r.toUpperCase().trim();
        const iClean = instrumentoNombre.toUpperCase().trim();
        return iClean.includes(rClean) || rClean.includes(iClean);
    });
}

export function getDependenciasParaInstrumento(instrumentoNombre: string, todasDependencias: any[]): any[] {
    const instUpper = instrumentoNombre.toUpperCase().trim()

    // --- NEW LOGIC: 21 processes for PAI, 19 for others ---
    const isPlanAccion = instUpper.includes('PLAN DE ACCIÓN INSTITUCIONAL') || instUpper.includes('PLAN DE ACCION INSTITUCIONAL')

    const processes19 = [
        'Atención al Ciudadano', 'Comunicación y Participación Ciudadana', 'Control Disciplinario',
        'Evaluación Independiente', 'Gestión Comercial', 'Gestión Contractual',
        'Gestion de operaciones financieras', 'Gestión de recursos fisicos', 'Gestión del SIG',
        'Gestión Documental', 'Gestión Estratégica', 'Gestión Financiera', 'Gestión Humana',
        'Gestión Integral de Riesgos', 'Gestión Jurídica', 'Gestión Tecnológica',
        'Operación de esquemas empresariales', 'Gestion proyectos de promoción y desarrollo'
    ]

    const pai21 = [
        'Atención al Ciudadano', 'Comunicación y Participación Ciudadana', 'Control Disciplinario',
        'Evaluación Independiente', 'Gestión Comercial', 'Gestión Contractual',
        'Relleno Sanitario', 'Parques y Zonas Verdes', 'Plazas de Mercado', 'Alumbrado Publico',
        'Gestión de recursos fisicos', 'Gestión del SIG', 'Gestión Documental', 'Gestión Estratégica',
        'Gestión Financiera', 'Gestión Humana', 'Gestión Integral de Riesgos', 'Gestión Jurídica',
        'Gestión Tecnológica', 'Gestion de operaciones financieras', 'Gestion proyectos de promoción y desarrollo'
    ]

    if (isPlanAccion) {
        return todasDependencias.filter(dep =>
            pai21.some(p => dep.nombre.toUpperCase().trim() === p.toUpperCase().trim())
        )
    }

    // Default: for other instruments, filter by the 19 standard processes
    // (Note: some specific instruments like Programa Transparencia might still need their own filter if requested later)
    if (instUpper.includes('PROGRAMA DE TRANSPARENCIA') || instUpper.includes('ÉTICA PUBLICA') || instUpper.includes('ETICA PUBLICA')) {
        const oficinasPermitidas = [
            'COMUNICACIÓN Y PARTICIPACIÓN CIUDADANA',
            'GESTIÓN TECNOLÓGICA',
            'ATENCIÓN AL CIUDADANO',
            'GESTIÓN ESTRATÉGICA',
            'HUMANA',
            'CONTROL DISCIPLINARIO',
            'EVALUACIÓN INDEPENDIENTE'
        ]
        return todasDependencias.filter(dep =>
            oficinasPermitidas.some(o => (dep.nombre || '').toUpperCase().includes(o))
        )
    }

    return todasDependencias.filter(dep =>
        processes19.some(p => dep.nombre.toUpperCase().trim() === p.toUpperCase().trim())
    )
}

export function formatDependenciaName(name: string | null | undefined): string {
    if (!name) return '';
    const nameUpper = name.toUpperCase().trim();

    // Exact Mappings based on User's 23 dependencies
    if (nameUpper.includes('ALUMBRADO')) return 'Alumbrado Publico';
    if (nameUpper.includes('ATENCIÓN AL CIUDADANO') || nameUpper.includes('ATENCION AL CIUDADANO')) return 'Atención al Ciudadano';
    if (nameUpper.includes('COMUNICACIÓN Y PARTICIPACIÓN') || nameUpper.includes('COMUNICACION Y PARTICIPACION')) return 'Comunicación y Participación Ciudadana';
    if (nameUpper.includes('CONTROL DISCIPLINARIO')) return 'Control Disciplinario';
    if (nameUpper.includes('EVALUACIÓN INDEPENDIENTE') || nameUpper.includes('EVALUACION INDEPENDIENTE')) return 'Evaluación Independiente';
    if (nameUpper.includes('GESTIÓN COMERCIAL') || nameUpper.includes('GESTION COMERCIAL')) return 'Gestión Comercial';
    if (nameUpper.includes('GESTIÓN CONTRACTUAL') || nameUpper.includes('GESTION CONTRACTUAL')) return 'Gestión Contractual';
    
    // Specific financial checks before generic one
    if (nameUpper.includes('OPERACIONES FINANCIERAS')) return 'Gestion de operaciones financieras';
    if (nameUpper.includes('PROMOCIÓN Y DESARROLLO') || nameUpper.includes('PROMOCION Y DESARROLLO')) return 'Gestion proyectos de promoción y desarrollo';
    if (nameUpper.includes('FINANCIERA')) return 'Gestión Financiera';

    if (nameUpper.includes('GESTIÓN DEL SIG') || nameUpper.includes('GESTION DEL SIG')) return 'Gestión del SIG';
    if (nameUpper.includes('GESTIÓN DOCUMENTAL') || nameUpper.includes('GESTION DOCUMENTAL')) return 'Gestión Documental';
    if (nameUpper.includes('GESTIÓN ESTRATÉGICA') || nameUpper.includes('GESTION ESTRATEGICA')) return 'Gestión Estratégica';
    if (nameUpper.includes('GESTIÓN HUMANA') || nameUpper.includes('GESTION HUMANA')) return 'Gestión Humana';
    if (nameUpper.includes('GESTIÓN INTEGRAL DE RIESGOS') || nameUpper.includes('GESTION INTEGRAL DE RIESGOS')) return 'Gestión Integral de Riesgos';
    if (nameUpper.includes('GESTIÓN JURÍDICA') || nameUpper.includes('GESTION JURIDICA')) return 'Gestión Jurídica';
    if (nameUpper.includes('GESTIÓN TECNOLÓGICA') || nameUpper.includes('GESTION TECNOLOGICA')) return 'Gestión Tecnológica';
    if (nameUpper.includes('CONOCIMIENTO Y LA INNOVACIÓN') || nameUpper.includes('CONOCIMIENTO Y LA INNOVACION')) return 'Gestión del conocimiento y la innovación';
    if (nameUpper.includes('ESQUEMAS EMPRESARIALES')) return 'Operación de esquemas empresariales';
    if (nameUpper.includes('PARQUES Y ZONAS VERDES')) return 'Parques y Zonas Verdes';
    if (nameUpper.includes('PLAZAS DE MERCADO')) return 'Plazas de Mercado';
    if (nameUpper.includes('RECURSOS FÍSICOS') || nameUpper.includes('RECURSOS FISICOS') || nameUpper.includes('RECURSOSS')) return 'Gestión de recursos fisicos';
    if (nameUpper.includes('RELLENO SANITARIO')) return 'Relleno Sanitario';

    return name;
}

export function getMisDependencias(miOficinaId: string, todosLosProcesos: any[], todasLasOficinas: any[], todasDependencias: any[] = []): any[] {
    if (!miOficinaId || !todosLosProcesos || todosLosProcesos.length === 0) return [];

    const miOficina = todasLasOficinas.find(o => o.id === miOficinaId);
    if (!miOficina) return [];

    const ofiNombre = (miOficina.nombre || '').toUpperCase().trim();
    let subProcesosKeywords: string[] = [];

    if (ofiNombre.includes('COMUNICACIÓN Y PARTICIPACIÓN') || ofiNombre.includes('COMUNICACION Y PARTICIPACION')) {
        subProcesosKeywords = ['ATENCIÓN AL CIUDADANO', 'ATENCION AL CIUDADANO', 'COMUNICACIÓN Y PARTICIPACIÓN CIUDADANA', 'COMUNICACION Y PARTICIPACION CIUDADANA'];
    } else if (ofiNombre.includes('SECRETARÍA GENERAL') || ofiNombre.includes('SECRETARIA GENERAL')) {
        subProcesosKeywords = ['GESTIÓN CONTRACTUAL', 'GESTION CONTRACTUAL', 'GESTIÓN JURÍDICA', 'GESTION JURIDICA'];
    } else if (ofiNombre.includes('PROYECTOS Y SERVICIOS FINANCIEROS')) {
        subProcesosKeywords = ['OPERACIONES FINANCIERAS', 'PROYECTOS DE PROMOCIÓN Y DESARROLLO', 'PROYECTOS DE PROMOCION Y DESARROLLO'];
    } else if (ofiNombre.includes('OPERATIVA Y COMERCIAL')) {
        subProcesosKeywords = ['OPERACIÓN DE ESQUEMAS EMPRESARIALES', 'OPERACION DE ESQUEMAS EMPRESARIALES', 'GESTIÓN COMERCIAL', 'GESTION COMERCIAL', 'RELLENO SANITARIO', 'PARQUES Y ZONAS VERDES', 'PLAZAS DE MERCADO', 'ALUMBRADO PUBLICO'];
    } else if (ofiNombre.includes('SERVICIOS ADMINISTRATIVOS')) {
        subProcesosKeywords = ['GESTIÓN DE RECURSOS FISICOS', 'GESTION DE RECURSOS FISICOS', 'GESTIÓN DOCUMENTAL', 'GESTION DOCUMENTAL', 'GESTIÓN HUMANA', 'GESTION HUMANA'];
    } else if (ofiNombre.includes('CONTROL DISCIPLINARIO')) {
        subProcesosKeywords = ['CONTROL DISCIPLINARIO'];
    } else if (ofiNombre.includes('GERENCIA GENERAL')) {
        subProcesosKeywords = ['GESTIÓN INTEGRAL DE RIESGOS', 'GESTION INTEGRAL DE RIESGOS'];
    } else if (ofiNombre.includes('FINANCIERA')) {
        subProcesosKeywords = ['GESTIÓN FINANCIERA', 'GESTION FINANCIERA'];
    } else if (ofiNombre.includes('CONTROL INTERNO')) {
        subProcesosKeywords = ['EVALUACIÓN INDEPENDIENTE', 'EVALUACION INDEPENDIENTE'];
    } else if (ofiNombre.includes('PLANEACIÓN INSTITUCIONAL') || ofiNombre.includes('PLANEACION INSTITUCIONAL')) {
        subProcesosKeywords = ['GESTIÓN DEL SIG', 'GESTION DEL SIG', 'GESTIÓN ESTRATÉGICA', 'GESTION ESTRATEGICA', 'GESTIÓN DEL CONOCIMIENTO Y LA INNOVACIÓN', 'CONOCIMIENTO Y LA INNOVACION'];
    } else if (ofiNombre.includes('GESTIÓN TECNOLÓGICA') || ofiNombre.includes('GESTION TECNOLOGICA') || ofiNombre.includes('TRANSFORMACIÓN DIGITAL') || ofiNombre.includes('TRANSFORMACION DIGITAL')) {
        subProcesosKeywords = ['GESTIÓN TECNOLÓGICA', 'GESTION TECNOLOGICA'];
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
