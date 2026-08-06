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
    const isPortuguese = moduleTitle?.toLowerCase().includes('português') ||
        topicName?.toLowerCase().includes('interpretação') ||
        topicName?.toLowerCase().includes('compreensão')

    const prompt = `
Você é uma banca examinadora sênior de concursos públicos (Vunesp, FGV, IBFC, Cebraspe).

Elabore exatamente ${count} questões de múltipla escolha para:
- Módulo: ${moduleTitle}
- Tópico: ${topicName}

PROIBIÇÕES CRÍTICAS (NÃO COMETA ESTES ERROS):
❌ NUNCA faça perguntas teóricas sobre O QUE É interpretação, coesão, leitura ou pedagogia (ex: NUNCA pergunte "Analisar o texto é exercitar a... A) interpretação").
❌ NUNCA crie alternativas absurdas ou bobas como "leitura de cópia", "memorização passiva" ou "transcrição ortográfica".
❌ NUNCA faça perguntas de interpretação sem colocar o TEXTO COMPLETO no enunciado.

${isPortuguese ? `
REGRAS OBRIGATÓRIAS PARA PORTUGUÊS / INTERPRETAÇÃO DE TEXTO:
1. O enunciado DEVE OBRIGATORIAMENTE começar com um TEXTO DE APOIO REAL (mínimo de 2 a 3 parágrafos). Pode ser uma crônica, artigo de opinião, fábula ou notícia.
2. A pergunta deve EXIGIR que o candidato LEIA o texto e responda sobre a intenção do autor, inferências, substituição de palavras, coesão ou ideia central DO TEXTO FORNECIDO.
3. Todas as 4 alternativas devem ser frases elaboradas, difíceis, plausíveis e no estilo exato de concurso público.
` : `
REGRAS PARA DEMAIS MATÉRIAS:
1. Questões diretas de concurso sobre a legislação/conceito.
2. Distratores exigentes (pegadinhas de banca, trocas de termos técnicos).
`}

Sua resposta DEVE SER um objeto JSON com a chave "questions" no seguinte formato:
{
  "questions": [
    {
      "enunciado": "Leia o texto a seguir:\\n\\n\\"[Escreva aqui um texto interessante de 2 a 3 parágrafos sobre qualquer assunto de interesse geral, literatura, meio ambiente, tecnologia ou sociedade]\\"\\n\\nDe acordo com o texto lido, assinale a alternativa correta em relação à ideia principal defendida pelo autor:",
      "opcoes": [
        "Distrator difícil A (parece correto, mas altera um detalhe do texto)",
        "Alternativa Correta B (reflete com precisão a ideia do texto)",
        "Distrator difícil C (menciona algo do texto, mas extrapola a conclusão)",
        "Distrator difícil D (contradiz suavemente o segundo parágrafo)"
      ],
      "resposta_correta": 1,
      "explicacao": "Explicação detalhada de por que a B está certa e onde está o erro sutil das outras.",
      "dica": "Dica sobre o parágrafo chave para releitura."
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
            console.error('❌ Ambos os modelos falharam. Usando Mock de segurança.')

            return [
                {
                    enunciado: "Leia o texto a seguir:\n\n\"A aceleração do cotidiano contemporâneo muitas vezes nos priva da contemplação e da reflexão crítica. Vivemos em uma era em que a velocidade da informação é confundida com a profundidade do conhecimento. No entanto, a verdadeira aprendizagem exige tempo, pausa e digestão das ideias, aspectos frequentemente negligenciados na dinâmica das redes digitais.\"\n\nCom base no texto, infere-se que o autor:",
                    opcoes: [
                        "Condena o uso de tecnologia e defende o retorno aos métodos tradicionais de ensino.",
                        "Sustenta que a rapidez no acesso à informação não garante a assimilação crítica do conhecimento.",
                        "Afirma que as redes digitais eliminaram completamente a capacidade de aprendizagem humana.",
                        "Sugere que a contemplação é um obstáculo para o desenvolvimento do pensamento contemporâneo."
                    ],
                    resposta_correta: 1,
                    explicacao: "O autor contrapõe a velocidade da informação com a profundidade do conhecimento, indicando que ter acesso rápido não significa ter assimilado criticamente o conteúdo.",
                    dica: "Observe o trecho onde o autor compara 'velocidade da informação' com 'profundidade do conhecimento'."
                }
            ]
        }
    }
}