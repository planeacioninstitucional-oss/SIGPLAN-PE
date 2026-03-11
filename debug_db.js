
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmklffdgsybkuxdegzak.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta2xmZmRnc3lia3V4ZGVnemFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjI5MzAsImV4cCI6MjA4NzAzODkzMH0.ZF6GnI1y2stCkivQrGOdgbYqJk2y2Zi_GL30nkrF4XI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProcesos() {
    const { data: ofis } = await supabase.from('oficinas').select('id, nombre');
    const finOfi = ofis?.find(o => o.nombre.toUpperCase().includes('FINANCIERA'));
    
    if (finOfi) {
        console.log(`Oficina: ${finOfi.nombre} (ID: ${finOfi.id})`);
        const { data: procs } = await supabase.from('procesos_institucionales').select('nombre').eq('oficina_id', finOfi.id);
        console.log('Procesos asociados directamente:', procs?.map(p => p.nombre));
    } else {
        console.log('No se encontró la oficina Financiera');
    }
}

checkProcesos()
