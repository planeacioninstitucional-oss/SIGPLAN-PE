const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmklffdgsybkuxdegzak.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta2xmZmRnc3lia3V4ZGVnemFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjI5MzAsImV4cCI6MjA4NzAzODkzMH0.ZF6GnI1y2stCkivQrGOdgbYqJk2y2Zi_GL30nkrF4XI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDependencias() {
    const { data: deps, error } = await supabase.from('dependencias').select('id, nombre').limit(5);
    console.log('Dependencias:', deps || error);

    const { data: metas, error: e2 } = await supabase.from('metas_pdd').select('*').limit(1);
    console.log('Metas PDD:', metas || e2);

    const { data: piip, error: e3 } = await supabase.from('piip').select('*').limit(1);
    console.log('PIIP:', piip || e3);

    const { data: pam, error: e4 } = await supabase.from('plan_accion_municipal').select('*').limit(1);
    console.log('PAM:', pam || e4);
}

checkDependencias()
