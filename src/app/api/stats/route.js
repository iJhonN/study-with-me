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

        // 1. Busca todos os registros de uso de questões do usuário
        const { data: usageData, error: usageError } = await supabaseAdmin
            .from('question_usage')
            .select(`
                respondeu_certo,
                usou_dica,
                questions (
                    module_id
                )
            `)
            .eq('user_id', userId)

        if (usageError) {
            console.error('Erro ao buscar estatísticas de questões:', usageError)
            return NextResponse.json({ error: 'Erro ao consultar banco' }, { status: 500 })
        }

        const totalRespondidas = usageData?.length || 0
        const acertos = usageData?.filter((u) => u.respondeu_certo).length || 0
        const erros = totalRespondidas - acertos
        const taxaAcerto = totalRespondidas > 0 ? Math.round((acertos / totalRespondidas) * 100) : 0
        const dicasUsadas = usageData?.filter((u) => u.usou_dica).length || 0

        // 2. Calcula desempenho detalhado agrupado por módulo
        const moduleStats = {}
        usageData?.forEach((u) => {
            const modId = u.questions?.module_id || 'geral'
            if (!moduleStats[modId]) {
                moduleStats[modId] = { total: 0, acertos: 0 }
            }
            moduleStats[modId].total += 1
            if (u.respondeu_certo) {
                moduleStats[modId].acertos += 1
            }
        })

        // 3. Busca total de tentativas de quizzes concluídos
        const { data: attempts } = await supabaseAdmin
            .from('quiz_attempts')
            .select('id')
            .eq('user_id', userId)

        return NextResponse.json({
            stats: {
                totalRespondidas,
                acertos,
                erros,
                taxaAcerto,
                dicasUsadas,
                quizzesConcluidos: attempts?.length || 0,
                moduleStats
            }
        })
    } catch (error) {
        console.error('Erro na API de Estatísticas:', error)
        return NextResponse.json(
            { error: 'Falha interna ao carregar estatísticas.' },
            { status: 500 }
        )
    }
}