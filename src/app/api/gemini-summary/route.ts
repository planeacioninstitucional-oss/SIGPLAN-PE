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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

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
      Actúa como un experto consultor de planeación estratégica para una entidad pública.
      Analiza los siguientes seguimientos recientes y genera un análisis ejecutivo integral.
      
      Por favor, formatea tu respuesta en **Markdown** incluyendo:
      
      1.  **Resumen Ejecutivo (1 párrafo):** Una visión global del estado actual.
      2.  **Visualización de Datos:** Crea una tabla en markdown resumiendo el estado de los instrumentos por semáforo (Verdes, Amarillos, Rojos).
      3.  **Logros Principales:** Destaca las metas cumplidas o avances físicos/financieros más significativos. Usa listas (bullet points).
      4.  **Alertas Críticas:** Identifica claramente retrasos o bajo cumplimiento (estado rojo o amarillo).
      5.  **Recomendaciones Estratégicas:** Sugerencias accionables para la gerencia.

      Ignora seguimientos en gris si no tienen datos de avance. Sé profesional, conciso y estructurado.
      
      Datos de Seguimientos:
      ${JSON.stringify(seguimientos.map(s => ({
            dependencia: s.dependencias?.nombre,
            instrumento: s.instrumentos?.nombre,
            avance_fisico: typeof s.porcentaje_fisico === 'number' ? s.porcentaje_fisico.toFixed(1) + '%' : 'N/A',
            avance_financiero: typeof s.porcentaje_financiero === 'number' ? s.porcentaje_financiero.toFixed(1) + '%' : 'N/A',
            semaforo: s.estado_semaforo
        })))}
    `

        const result = await model.generateContent(prompt)
        const response = await result.response
        const text = response.text()

        return NextResponse.json({ summary: text })

    } catch (error: any) {
        console.error('Gemini API Error:', error)
        
        let message = 'Error al generar el resumen con IA.';
        if (error.message?.includes('429')) message = 'Se ha alcanzado el límite de peticiones. Por favor, espere 30 segundos y reintente.';
        if (error.message?.includes('API key')) message = 'La API Key no es válida o ha expirado.';
            
        return NextResponse.json({ error: message }, { status: 500 })
    }
}
