import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

// Modelo Principal
export const geminiModel = genAI.getGenerativeModel({
    model: 'gemini-3.6-flash',
    generationConfig: {
        responseMimeType: "application/json",
    }
})

// Modelo Fallback
export const geminiFallbackModel = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: {
        responseMimeType: "application/json",
    }
})

export async function generateContentWithFallback({ moduleTitle, topicName, topicContent, count = 5 }) {
    // Identifica se a matéria exige foco gramatical/interpretativo puro
    const isPortuguese = moduleTitle?.toLowerCase().includes('português') || topicName?.toLowerCase().includes('interpretação')

    // Prompt enriquecido com as correções de qualidade e formato exigidos
    const prompt = `
Você é um banca examinadora sênior de concursos públicos na área de Educação (estilo Vunesp, FGV, IBFC e Cebraspe).

Elabore exatamente ${count} questões de múltipla escolha para o seguinte tópico:
- Módulo: ${moduleTitle}
- Tópico: ${topicName}
- Conteúdo de Referência: ${topicContent || 'Conteúdo geral do edital'}

REGRAS OBRIGATÓRIAS DE QUALIDADE:
1. DIFICULDADE E DISTRATORES:
   - Nível real de prova de concurso público.
   - As alternativas incorretas NÃO podem ser óbvias. Crie distratores plausíveis com pegadinhas sutis de banca, ambiguidades e inversões de regras.

2. TEXTO DE APOIO (OBRIGATÓRIO PARA INTERPRETAÇÃO):
   - Se a questão for de COMPREENSÃO OU INTERPRETAÇÃO DE TEXTO, insira obrigatoriamente um texto curto (poema, crônica, notícia ou trecho literário) no início do enunciado.
   - Jamais faça perguntas do tipo "De acordo com o texto..." sem fornecer o texto completo no enunciado.

3. FOCO DA MATÉRIA:
   ${isPortuguese ? `
   - ATENÇÃO: Esta é uma questão de LÍNGUA PORTUGUESA (Gramática ou Interpretação de Texto).
   - Avalie o conhecimento linguístico e interpretativo da CANDIDATA ADULTA.
   - NÃO aborde didática, alfabetização infantil ou como as crianças aprendem a ler.
   ` : ''}

Sua resposta DEVE SER um objeto JSON estritamente com a chave "questions" contendo um array de objetos com este formato:
{
  "questions": [
    {
      "enunciado": "Texto base (se houver) + pergunta",
      "opcoes": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "resposta_correta": 0, // Índice numérico de 0 a 3 indicando a opção correta
      "explicacao": "Explicação detalhada da resposta e o motivo de as outras estarem erradas.",
      "dica": "Dica sutil sem entregar a resposta."
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
        console.warn('⚠️ Falha no modelo primário (gemini-3.6-flash). Tentando fallback...', primaryError)

        try {
            const result = await geminiFallbackModel.generateContent(prompt)
            const text = await result.response.text()
            const parsed = JSON.parse(text)
            return parsed.questions || parsed
        } catch (fallbackError) {
            console.error('❌ Ambos os modelos falharam/estouraram cota (429). Utilizando Mock de Desenvolvimento.')

            return [
                {
                    id: "mock-dev-1",
                    enunciado: "[MOCK DEV] Em relação à interpretação de textos e à coesão textual em provas de concurso, assinale a alternativa correta:",
                    opcoes: [
                        "A anáfora retoma um termo já citado anteriormente no texto.",
                        "A catáfora retoma obrigatoriamente um termo do parágrafo anterior.",
                        "Os conectivos adversativos expressam ideia de adição de argumentos.",
                        "A pontuação não interfere no sentido ou na interpretação do texto."
                    ],
                    resposta_correta: 0,
                    explicacao: "A anáfora é o mecanismo coesivo que faz referência a um termo presente anteriormente no texto. Resposta mockada local para testes durante erro de quota.",
                    dica: "Lembre-se da diferença entre referência anafórica (antes) e catafórica (depois)."
                }
            ]
        }
    }
}