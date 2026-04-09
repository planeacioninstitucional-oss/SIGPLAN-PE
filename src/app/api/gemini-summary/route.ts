import { createClient } from '@/lib/supabase/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { vigenciaId } = await req.json()

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({
                summary: "La API Key de Gemini no está configurada. Por favor configure GEMINI_API_KEY en las variables de entorno para generar resúmenes con IA."
            })
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        // Fetch data for context
        const { data: seguimientos } = await supabase
            .from('seguimientos')
            .select(`
            *,
            dependencias(nombre),
            instrumentos(nombre)
        `)
            .eq('vigencia_id', vigenciaId)
            .order('created_at', { ascending: false })
            .limit(50) // Limit context size

        if (!seguimientos || seguimientos.length === 0) {
            return NextResponse.json({ summary: "No hay suficientes datos registrados para generar un análisis estadístico en este momento." })
        }

        // Construct prompt
        const prompt = `
      Actúa como un experto consultor de planeación estratégica para una entidad pública (INFIBAGUÉ).
      Analiza los siguientes seguimientos recientes y genera un resumen ejecutivo corto (máximo 3 párrafos).
      
      Destaca:
      1. Logros principales (metas cumplidas o avances significativos).
      2. Alertas críticas (retrasos, bajo cumplimiento financiero/físico).
      3. Recomendaciones estratégicas para la gerencia.

      Ignora seguimientos en gris si no tienen datos de avance.
      
      Datos:
      ${JSON.stringify(seguimientos.map(s => ({
            dep: s.dependencias?.nombre,
            instr: s.instrumentos?.nombre,
            avance_fisico: s.porcentaje_fisico,
            avance_financiero: s.porcentaje_financiero,
            semaforo: s.estado_semaforo
        })))}
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({ summary: text })

    } catch (error: any) {
        console.error('Gemini API Error:', error)
        const errorMessage = error.message?.includes('API key') 
            ? 'La API Key de Google no es válida o ha expirado.' 
            : 'Error al generar el resumen con IA. Por favor, reintente en unos momentos.';
            
        return NextResponse.json({ error: errorMessage }, { status: 500 })
    }
}
