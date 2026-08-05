import { GoogleGenerativeAI } from '@google/generative-ai'

const apiKey = process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(apiKey)

// Modelo Principal com cota ativa
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

export async function generateContentWithFallback(prompt) {
    try {
        const result = await geminiModel.generateContent(prompt)
        return await result.response.text()
    } catch (primaryError) {
        console.warn('⚠️ Falha no modelo primário (gemini-3.6-flash). Tentando fallback...')

        try {
            const result = await geminiFallbackModel.generateContent(prompt)
            return await result.response.text()
        } catch (fallbackError) {
            console.error('❌ Ambos os modelos falharam/estouraram cota (429). Utilizando Mock de Desenvolvimento.')

            return JSON.stringify({
                questions: [
                    {
                        id: "mock-dev-1",
                        question: "[MOCK DEV] Qual das opções abaixo representa um princípio de resiliência em APIs?",
                        options: [
                            "Fallback gracioso em caso de Rate Limit",
                            "Bloquear toda a aplicação no primeiro erro",
                            "Ignorar os erros de requisição",
                            "Não tratar exceções no backend"
                        ],
                        correctAnswer: 0,
                        explanation: "Resposta mockada gerada localmente para você continuar testando a UI do Quiz e a tela de Revisão mesmo com erro 429 na cota do Gemini."
                    }
                ]
            })
        }
    }
}