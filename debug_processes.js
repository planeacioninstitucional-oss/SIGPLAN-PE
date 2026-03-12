const { createClient } = require('@supabase/supabase-js');
const url = 'https://nmklffdgsybkuxdegzak.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta2xmZmRnc3lia3V4ZGVnemFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjI5MzAsImV4cCI6MjA4NzAzODkzMH0.ZF6GnI1y2stCkivQrGOdgbYqJk2y2Zi_GL30nkrF4XI';
const supabase = createClient(url, key);

const fs = require('fs');

async function run() {
    const { data: dependencias } = await supabase.from('dependencias').select('id, nombre');
    
    let output = '--- DEPENDENCIAS ---\n';
    dependencias.forEach(d => {
        output += `[${d.id}] ${d.nombre}\n`;
    });
    fs.writeFileSync('output_dependencies.txt', output);
}
run();
