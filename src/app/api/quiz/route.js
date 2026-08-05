import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createAdminClient } from '@/lib/supabase/admin'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

function sanitizeJson(rawText) {
    let clean = rawText.trim()
    clean = clean.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/, '')
    const firstBracket = clean.indexOf('[')
    const lastBracket = clean.lastIndexOf(']')
    if (firstBracket !== -1 && lastBracket !== -1) {
        clean = clean.substring(firstBracket, lastBracket + 1)
    }
    return clean
}

// Algoritmo Fisher-Yates para embaralhar o array final de questões
function shuffleArray(array) {
    const arr = [...array]
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr
}

export async function POST(req) {
    try {
        const body = await req.json()
        const { moduleId, topicId, content, limit = 10 } = body

        if (!topicId) {
            return NextResponse.json({ error: 'ID do tópico é obrigatório' }, { status: 400 })
        }

        const supabaseAdmin = createAdminClient()
        const targetFromDb = Math.floor(limit / 2) // Ex: 5 do banco

        // 1. Busca metade das questões já salvas no banco
        const { data: existingQuestions, error: fetchError } = await supabaseAdmin
            .from('questions')
            .select('*')
            .eq('topic_id', topicId)
            .limit(targetFromDb)

        if (fetchError) {
            console.error('Erro ao consultar questões no Supabase:', fetchError)
        }

        const dbQuestions = existingQuestions || []
        const neededFromAi = limit - dbQuestions.length // Ex: 10 - 5 = 5 a gerar

        let newQuestions = []

        // 2. Se precisamos de mais questões, chamamos o Gemini para completar o saldo
        if (neededFromAi > 0) {
            console.log(`🧠 Buscadas ${dbQuestions.length} questões do banco. Gerando mais ${neededFromAi} com Gemini...`)

            const prompt = `Você é um elaborador de bancas de concursos públicos de Educação Infantil.
Gere exatamente ${neededFromAi} questões de múltipla escolha inéditas com 4 alternativas (A, B, C, D) baseadas no seguinte conteúdo:

"${content || topicId}"

Retorne APENAS um array em formato JSON puro, sem formatação markdown ou textos adicionais, com o seguinte formato:
[
  {
    "pergunta": "Texto da questão...",
    "alternativas": ["A) Opção 1", "B) Opção 2", "C) Opção 3", "D) Opção 4"],
    "resposta_correta": "A",
    "explicacao": "Explicação fundamentada da resposta correta.",
    "estilo_banca": "VUNESP/IBFC/CEBRASPE"
  }
]`

            let responseText = ''
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' })
                const result = await model.generateContent(prompt)
                responseText = result.response.text()
            } catch (apiError) {
                console.warn('Fallback para gemini-3.1-flash-lite:', apiError.message)
                const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' })
                const result = await fallbackModel.generateContent(prompt)
                responseText = result.response.text()
            }

            const cleanJson = sanitizeJson(responseText)
            const generated = JSON.parse(cleanJson)

            // Prepara para salvar no Supabase
            const questionsToInsert = generated.map((q) => ({
                topic_id: topicId,
                module_id: moduleId,
                pergunta: q.pergunta,
                alternativas: q.alternativas,
                resposta_correta: q.resposta_correta,
                explicacao: q.explicacao,
                estilo_banca: q.estilo_banca || 'Geral'
            }))

            const { data: inserted, error: insertError } = await supabaseAdmin
                .from('questions')
                .insert(questionsToInsert)
                .select('*')

            if (insertError) {
                console.error('Erro ao persistir novas questões:', insertError)
                newQuestions = questionsToInsert
            } else {
                newQuestions = inserted || []
            }
        }

        // 3. Une banco + Gemini e embaralha a ordem para o quiz ser dinâmico
        const combinedQuestions = shuffleArray([...dbQuestions, ...newQuestions])

        return NextResponse.json({
            questions: combinedQuestions,
            meta: {
                fromDb: dbQuestions.length,
                fromAi: newQuestions.length,
                total: combinedQuestions.length
            }
        })

    } catch (error) {
        console.error('Erro no quiz híbrido:', error)
        return NextResponse.json(
            { error: 'Falha ao gerar quiz misto.', details: error.message },
            { status: 500 }
        )
    }
}