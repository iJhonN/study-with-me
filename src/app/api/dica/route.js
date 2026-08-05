import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geminiModel } from '@/lib/gemini'

export async function POST(request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
        }

        const { pergunta, alternativas, explicacao } = await request.json()

        const prompt = `Você é um tutor pedagógico auxiliando uma estudante de concurso público.
O usuário está com dúvida na seguinte questão:
Enunciado: "${pergunta}"
Alternativas: ${JSON.stringify(alternativas)}

Diretriz: Forneça uma DICA curta, sutil e indireta (máximo 2 a 3 frases) que ajude a estudante a raciocinar por conta própria, SEM entregar diretamente qual é a alternativa correta (a, b, c ou d).`

        const result = await geminiModel.generateContent(prompt)
        const dica = result.response.text().trim()

        return NextResponse.json({ dica })
    } catch (error) {
        console.error('Erro na API de dica:', error)
        return NextResponse.json(
            { error: 'Não foi possível gerar a dica no momento.' },
            { status: 500 }
        )
    }
}