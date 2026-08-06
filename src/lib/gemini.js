import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: {
        responseMimeType: "application/json",
    }
})

export const geminiFallbackModel = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
        responseMimeType: "application/json",
    }
})

export async function generateContentWithFallback({ moduleTitle, topicName, topicContent, count = 5 }) {
    const isPortugueseOrReading =
        moduleTitle?.toLowerCase().includes('português') ||
        topicName?.toLowerCase().includes('interpretação') ||
        topicName?.toLowerCase().includes('compreensão') ||
        topicName?.toLowerCase().includes('leitura')

    const prompt = `
Você é uma banca examinadora de elite de concursos públicos (estilo FGV, Vunesp, Cebraspe).

Sua tarefa é criar exatamente ${count} questões para o tópico:
Módulo: ${moduleTitle}
Tópico: ${topicName}

🚨 PROIBIÇÕES ABSOLUTAS E GRAVES 🚨
1. NUNCA faça perguntas conceituais sobre "o que é ler", "o que é interpretação" ou "o que é coesão".
2. NUNCA crie opções absurdas como "Apenas memorizar palavras", "Decodificação mecânica", "Transcrição de cópia" ou "Leitura de superfície". Todas as 4 alternativas precisam parecer respostas plausíveis e inteligentes.
3. NUNCA faça perguntas sobre pedagogia da leitura quando a matéria for Português/Interpretação.

${isPortugueseOrReading ? `
🎯 MODO OBRIGATÓRIO: INTERPRETAÇÃO E GRAMÁTICA PRÁTICA
Para cada uma das ${count} questões, você DEVE obrigatoriamente:
1. Criar um TEXTO DE APOIO inédito (crônica, conto, artigo de opinião, crônica jornalística ou poema) com no mínimo 2 a 3 parágrafos complexos.
2. Fazer uma pergunta prática sobre O TEXTO (ex: inferência, intenção implícita do autor, substituição de conectivos, coesão, figura de linguagem ou sinonímia no contexto).
3. Criar distratores que pareçam corretos (ex: extrapolação sutil do texto, contradição imperceptível em uma palavra, inversão de causa e efeito).

EXEMPLO DO NÍVEL EXIGIDO:
Enunciado:
"Leia o texto a seguir:
'A aceleração da vida urbana impõe um ritmo em que a pausa é vista quase como um ato de transgressão. Não se trata apenas da busca por produtividade ininterrupta, mas de uma alteração perceptiva: o indivíduo passa a mensurar seu valor social pela quantidade de estímulos a que responde simultaneamente. O silêncio, nesse cenário, deixa de ser ausência de som para se tornar um incômodo intolerável.'

Considerando os recursos coesivos e o sentido global do texto, assinale a opção correta:"

Opções:
A) O vocábulo 'transgressão' indica que a pausa no meio urbano é legalmente punida pela sociedade contemporânea.
B) A expressão 'mensurar seu valor social' sugere que a validação do indivíduo está condicionada ao acúmulo constante de tarefas.
C) O termo 'nesse cenário' estabelece uma relação de temporalidade futura em relação aos hábitos urbanos descritos.
D) A palavra 'intolerável' introduz uma tese de que o silêncio deve ser promovido como meta de produtividade.
` : `
🎯 MODO OBRIGATÓRIO: CONHECIMENTOS ESPECÍFICOS / LEGISLAÇÃO
1. Questões de múltipla escolha focadas na letra da lei ou autores do edital.
2. Alternativas longas e elaboradas, com pegadinhas de prazos, inversões de conceitos e exceções da regra.
`}

FORMATO DE SAÍDA EXIGIDO (JSON PURE):
Sua resposta DEVE ser um objeto JSON com a chave "questions" contendo o array de objetos:
{
  "questions": [
    {
      "enunciado": "Texto base completo + pergunta",
      "opcoes": [
        "Opção A plausível e longa",
        "Opção B correta e fundamentada",
        "Opção C distrator difícil",
        "Opção D distrator com pegadinha sutil"
      ],
      "resposta_correta": 1,
      "explicacao": "Análise detalhada apontando o erro sutil das outras opções e provando a correta.",
      "dica": "Dica sutil que direcione a releitura sem dar a resposta."
    }
  ]
}
`

    try {
        const result = await geminiModel.generateContent(prompt)
        const text = await result.response.text()
        const parsed = JSON.parse(text)
        return parsed.questions || parsed
    } catch (primaryError) {
        console.warn('⚠️ Falha no modelo primário. Tentando fallback...', primaryError)

        try {
            const result = await geminiFallbackModel.generateContent(prompt)
            const text = await result.response.text()
            const parsed = JSON.parse(text)
            return parsed.questions || parsed
        } catch (fallbackError) {
            console.error('❌ Erro na geração da IA. Retornando mock de contingência.')

            return [
                {
                    enunciado: "Leia o texto a seguir:\n\n\"A aceleração da vida urbana impõe um ritmo em que a pausa é vista quase como um ato de transgressão. Não se trata apenas da busca por produtividade ininterrupta, mas de uma alteração perceptiva: o indivíduo passa a mensurar seu valor social pela quantidade de estímulos a que responde simultaneamente.\"\n\nConsiderando a estruturação das ideias no texto, infere-se que o autor:",
                    opcoes: [
                        "Equipara a pausa no cotidiano a uma conduta de valorização pessoal no meio urbano.",
                        "Sustenta que a validação do indivíduo contemporâneo está atrelada ao excesso de estímulos.",
                        "Defende que a busca por produtividade é o único fator responsável pela perda de concentração.",
                        "Argumenta que a alteração perceptiva mencionada decorre da falta de tecnologia nas cidades."
                    ],
                    resposta_correta: 1,
                    explicacao: "O texto afirma explicitamente que o indivíduo mensura seu valor pela quantidade de estímulos a que responde simultaneamente.",
                    dica: "Observe a relação de causa estabelecida logo após o trecho sobre alteração perceptiva."
                }
            ]
        }
    }
}