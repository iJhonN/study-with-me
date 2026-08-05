import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return NextResponse.json({ error: 'ID do usuário é obrigatório' }, { status: 400 })
        }

        const supabaseAdmin = createAdminClient()

        // Busca os registros de erros do usuário ordenados pelos mais recentes
        const { data: wrongUsages, error: usageError } = await supabaseAdmin
            .from('question_usage')
            .select(`
                id,
                created_at,
                question_id,
                questions (
                    id,
                    pergunta,
                    alternativas,
                    resposta_correta,
                    explicacao,
                    estilo_banca,
                    topic_id,
                    module_id
                )
            `)
            .eq('user_id', userId)
            .eq('respondeu_certo', false)
            .order('created_at', { ascending: false })

        if (usageError) {
            console.error('Erro ao buscar caderno de erros:', usageError)
            return NextResponse.json({ error: 'Erro ao consultar banco' }, { status: 500 })
        }

        // Remove duplicatas mantendo apenas o erro mais recente de cada questão
        const uniqueQuestionsMap = new Map()
        wrongUsages?.forEach((item) => {
            if (item.questions && !uniqueQuestionsMap.has(item.question_id)) {
                uniqueQuestionsMap.set(item.question_id, {
                    ...item.questions,
                    errado_em: item.created_at
                })
            }
        })

        const errorQuestions = Array.from(uniqueQuestionsMap.values())

        return NextResponse.json({ questions: errorQuestions })
    } catch (error) {
        console.error('Erro na API de Caderno de Erros:', error)
        return NextResponse.json(
            { error: 'Falha interna ao carregar erros.' },
            { status: 500 }
        )
    }
}