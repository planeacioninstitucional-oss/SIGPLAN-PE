const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmklffdgsybkuxdegzak.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta2xmZmRnc3lia3V4ZGVnemFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjI5MzAsImV4cCI6MjA4NzAzODkzMH0.ZF6GnI1y2stCkivQrGOdgbYqJk2y2Zi_GL30nkrF4XI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCompare() {
    console.log('=== BUSCANDO VIGENCIAS ===\n')
    
    const { data: vigencias } = await supabase.from('vigencias').select('*').order('anio', { ascending: false })
    console.log('Vigencias:', vigencias)
    
    if (!vigencias || vigencias.length === 0) {
        console.log('No hay vigencias!')
        return
    }
    
    const vigenciaActiva = vigencias.find(v => v.estado === 'activa')
    console.log('\nVigencia activa:', vigenciaActiva)
    
    if (!vigenciaActiva) {
        console.log('No hay vigencia activa!')
        return
    }
    
    console.log('\n=== PAM PARA VIGENCIA', vigenciaActiva.anio, '===\n')
    
    const { data: pam } = await supabase
        .from('plan_accion_municipal')
        .select('id, programa, dependencia_id, vigencia_id')
        .eq('vigencia_id', vigenciaActiva.id)
    
    console.log('Registros PAM:', pam?.length || 0)
    
    const { data: alistamiento } = await supabase
        .from('alistamiento_auditoria')
        .select('id, dependencia_id, checkpoint_name, vigencia_id')
        .eq('vigencia_id', vigenciaActiva.id)
    
    console.log('Registros Alistamiento:', alistamiento?.length || 0)
    
    // Dependencias con datos
    const pamDeps = [...new Set(pam?.map(r => r.dependencia_id) || [])]
    const aliDeps = [...new Set(alistamiento?.map(r => r.dependencia_id) || [])]
    
    console.log('\nDependencias con PAM:', pamDeps.length)
    console.log('Dependencias con Alistamiento:', aliDeps.length)
    
    const { data: todasDeps } = await supabase
        .from('dependencias')
        .select('id, nombre')
        .eq('activa', true)
    
    console.log('\nTotal dependencias activas:', todasDeps?.length || 0)
    
    // Detalle
    console.log('\n=== DETALLE POR DEPENDENCIA ===')
    for (const dep of todasDeps || []) {
        const tienePAM = pamDeps.includes(dep.id)
        const tieneAli = aliDeps.includes(dep.id)
        console.log(`${dep.nombre}: PAM=${tienePAM ? '✓' : '✗'}, Alistamiento=${tieneAli ? '✓' : '✗'}`)
    }
}

debugCompare().catch(console.error)
