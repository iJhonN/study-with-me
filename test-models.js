const apiKey = process.env.GEMINI_API_KEY

if (!apiKey) {
    console.error('❌ GEMINI_API_KEY não foi encontrada no ambiente.')
    process.exit(1)
}

console.log('🔑 Usando chave que termina em:', apiKey.slice(-5))

async function listModels() {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        )
        const data = await response.json()

        if (data.error) {
            console.error('❌ Erro na API:', data.error.message)
            return
        }

        console.log('\n✅ Modelos disponíveis para a sua chave:')
        const generateModels = data.models
            ?.filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m) => m.name.replace('models/', ''))

        console.log(generateModels)
    } catch (err) {
        console.error('❌ Erro ao listar modelos:', err.message)
    }
}

listModels()