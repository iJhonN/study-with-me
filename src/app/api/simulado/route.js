import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateContentWithFallback } from '@/lib/gemini'
import { modulesData } from '@/lib/modulesData'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const limit = parseInt(searchParams.get('limit') || '10', 10)

        const supabaseAdmin = createAdminClient()

        // 1. Busca questões aleatórias de qualquer módulo no banco
        const { data: dbQuestions, error } = await supabaseAdmin
            .from('questions')
            .select('*')
            .limit(limit)

        if (error) {
            console.error('Erro ao buscar questões para simulado:', error)
        }

        let questions = dbQuestions || []

        // 2. Se houver poucas questões salvas no banco, gera questões adicionais mesclando tópicos com a IA
        if (questions.length < limit) {
            const needed = limit - questions.length

            // Sorteia um módulo aleatório para pedir à IA
            const randomModule = modulesData[Math.floor(Math.random() * modulesData.length)]
            const randomTopic = randomModule.topics[Math.floor(Math.random() * randomModule.topics.length)]

            try {
                const aiQuestions = await generateContentWithFallback({
                    moduleTitle: randomModule.title,
                    topicName: randomTopic.name,
                    topicContent: randomTopic.content,
                    count: needed
                })

                // Formata e salva as novas questões geradas
                const newRecords = aiQuestions.map(q => ({
                    module_id: randomModule.id,
                    topic_id: randomTopic.id,
                    enunciado: q.enunciado,
                    opcoes: q.opcoes,
                    resposta_correta: q.resposta_correta,
                    explicacao: q.explicacao,
                    dica: q.dica
                }))

                const { data: inserted, error: insertErr } = await supabaseAdmin
                    .from('questions')
                    .insert(newRecords)
                    .select('*')

                if (!insertErr && inserted) {
                    questions = [...questions, ...inserted]
                }
            } catch (aiErr) {
                console.error('Erro ao gerar apoio com IA no simulado:', aiErr)
            }
        }

        return NextResponse.json({ questions })
    } catch (error) {
        console.error('Erro na API de Simulado:', error)
        return NextResponse.json(
            { error: 'Falha interna ao carregar simulado.' },
            { status: 500 }
        )
    }
}