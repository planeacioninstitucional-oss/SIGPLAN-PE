const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmklffdgsybkuxdegzak.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta2xmZmRnc3lia3V4ZGVnemFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjI5MzAsImV4cCI6MjA4NzAzODkzMH0.ZF6GnI1y2stCkivQrGOdgbYqJk2y2Zi_GL30nkrF4XI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugPAM() {
    const { data: pam, error } = await supabase.from('plan_accion_municipal').select('id, programa, estado, dependencia_id');
    console.log('PAM records:', pam || error);

    const { data: deps, error: e2 } = await supabase.from('dependencias').select('id, nombre');
    console.log('Dependencias:', deps || e2);
    
    const { data: procs, error: e3 } = await supabase.from('procesos_institucionales').select('id, nombre, oficina_id');
    console.log('Procesos:', procs || e3);
}

debugPAM()
