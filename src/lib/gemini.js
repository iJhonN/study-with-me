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

    // Prompt enriquecido com maior variedade e obrigatoriedade de textos de apoio
    const prompt = `
Você é uma banca examinadora sênior de concursos públicos na área de Educação (estilo Vunesp, FGV, IBFC e Cebraspe).

Elabore exatamente ${count} questões de múltipla escolha para o seguinte tópico:
- Módulo: ${moduleTitle}
- Tópico: ${topicName}
- Conteúdo de Referência: ${topicContent || 'Conteúdo geral do edital'}

REGRAS OBRIGATÓRIAS DE QUALIDADE E DIVERSIFICAÇÃO DE TEXTOS:

1. REQUISITO DE TEXTOS BASE (MUITO IMPORTANTE):
   - Se o tópico for de COMPREENSÃO, INTERPRETAÇÃO DE TEXTO ou SINTAXE/TEXTUAL, TODAS as questões ou grupos de questões DEVEM conter um texto de apoio completo no início do enunciado.
   - Varie a tipologia dos textos gerados. Alterne entre:
     * Crônicas ou microcontos literários;
     * Poemas ou trechos de obras clássicas/contemporâneas;
     * Artigos de opinião, notícias ou fragmentos de ensaios;
     * Fábulas, tirinhas descritas ou textos argumentativos sobre temas atuais.
   - O texto base deve ter extensão adequada (entre 1 e 3 parágrafos bem estruturados) para permitir perguntas reais de inferência, coesão, figura de linguagem ou intenção do autor.
   - Formate o enunciado deixando o texto base bem destacado no início entre aspas ou com a indicação "Leia o texto a seguir para responder à questão:".

2. DIFICULDADE E DISTRATORES:
   - Nível real de prova de concurso público.
   - As alternativas incorretas NÃO podem ser óbvias. Crie distratores plausíveis com pegadinhas sutis de banca, ambiguidades e inversões de regras.

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
      "enunciado": "Leia o texto abaixo:\\n\\n\\"[Texto completo de 1 a 3 parágrafos aqui...]\\"\\n\\nCom base no texto lido, assinale a alternativa correta...",
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
                    enunciado: "Leia o texto a seguir para responder à questão:\n\n\"O tempo é um tecido sutil tecido pelas nossas próprias escolhas. Ao caminhar pelas ruas da cidade antiga, percebe-se que as pedras do calçamento guardam os passos daqueles que vieram antes, mas não determinam o rumo daqueles que virão depois.\"\n\nCom base no texto, infere-se que o autor defende que:",
                    opcoes: [
                        "O passado estabelece os limites inegociáveis para o futuro.",
                        "As escolhas individuais moldam o tempo, mantendo a autonomia sobre o futuro.",
                        "A arquitetura urbana é o principal fator determinante da história.",
                        "As escolhas humanas são irrelevantes diante da passagem dos anos."
                    ],
                    resposta_correta: 1,
                    explicacao: "O texto afirma que as pedras 'guardam os passos', mas 'não determinam o rumo', indicando que o indivíduo mantém sua autonomia sobre as escolhas do futuro.",
                    dica: "Preste atenção ao contraste estabelecido entre guardar os passos e não determinar o rumo."
                }
            ]
        }
    }
}