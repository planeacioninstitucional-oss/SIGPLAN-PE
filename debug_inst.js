const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://nmklffdgsybkuxdegzak.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ta2xmZmRnc3lia3V4ZGVnemFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjI5MzAsImV4cCI6MjA4NzAzODkzMH0.ZF6GnI1y2stCkivQrGOdgbYqJk2y2Zi_GL30nkrF4XI'

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
    const { data: inst } = await supabase.from('instrumentos').select('*');
    console.log('Instrumentos:', inst);
    
    const { data: seg } = await supabase.from('seguimientos').select('*');
    console.log('Seguimientos:', seg);
}

test()
