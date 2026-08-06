import { GoogleGenerativeAI } from '@google/generative-ai'

// ⚠️ Nota: @google/generative-ai é o SDK antigo (a própria Google recomenda
// migrar para @google/genai). Ele ainda funciona com os modelos 3.x, mas não dá
// pra configurar `thinking_level` (o substituto de `temperature` nesses modelos)
// nem os recursos novos da Interactions API. Não é o motivo das perguntas fáceis,
// mas vale migrar quando der — ver comentário no fim do arquivo.

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

// Técnicas de distrator por área — usadas para dar exemplos concretos ao modelo
// em vez da instrução genérica "pegadinhas de prazos e exceções".
const TECNICAS_DISTRATOR = {
    legislacao: [
        'trocar o número do artigo por um artigo vizinho que trata de assunto parecido',
        'inverter a regra e a exceção (transformar "em regra" em "sempre", ou vice-versa)',
        'trocar a esfera de competência (federal por municipal, ou vice-versa)',
        'alterar sutilmente um prazo, idade ou percentual mencionado na norma',
        'misturar corretamente o texto de duas leis parecidas (ex: BNCC com DCNEI)',
    ],
    autores: [
        'atribuir o conceito certo ao autor errado (ex: dar a ZDP de Vygotsky como se fosse de Piaget)',
        'misturar dois conceitos verdadeiros do mesmo autor, mas fora da relação real entre eles',
        'trocar o estágio/fase certo por um estágio adjacente do mesmo autor',
        'inverter causa e efeito na explicação do conceito',
        'usar um termo do senso comum que parece a teoria, mas contraria o autor',
    ],
    padrao: [
        'apresentar uma afirmação parcialmente correta, mas com um detalhe final que a invalida',
        'inverter causa e efeito',
        'generalizar demais uma regra que na verdade tem exceção',
        'trocar um termo técnico por um sinônimo impreciso que muda o sentido',
    ],
}

function detectarArea(moduleTitle = '') {
    const t = moduleTitle.toLowerCase()
    if (t.includes('legisla') || t.includes('bncc') || t.includes('dcnei') || t.includes('rcnei') || t.includes('ldb') || t.includes('eca') || t.includes('constitui') || t.includes('pne')) {
        return 'legislacao'
    }
    if (t.includes('autor')) return 'autores'
    return 'padrao'
}

// Embaralha as alternativas no CÓDIGO (não depende do modelo "lembrar" de variar
// a posição da resposta certa) e corrige o índice correspondente.
function embaralharAlternativas(questao) {
    const indices = questao.opcoes.map((_, i) => i)
    for (let i = indices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [indices[i], indices[j]] = [indices[j], indices[i]]
    }
    const novasOpcoes = indices.map(i => questao.opcoes[i])
    const novoIndiceCorreto = indices.indexOf(questao.resposta_correta)
    return { ...questao, opcoes: novasOpcoes, resposta_correta: novoIndiceCorreto }
}

export async function generateContentWithFallback({
                                                      moduleTitle,
                                                      topicName,
                                                      topicContent,       // ✅ agora é usado no prompt
                                                      count = 5,
                                                      perguntasExistentes = [], // opcional: enunciados já salvos no banco para esse tópico (evita repetição de padrão)
                                                  }) {
    const isPortugueseOrReading =
        moduleTitle?.toLowerCase().includes('português') ||
        topicName?.toLowerCase().includes('interpretação') ||
        topicName?.toLowerCase().includes('compreensão') ||
        topicName?.toLowerCase().includes('leitura')

    const area = detectarArea(moduleTitle)
    const tecnicas = TECNICAS_DISTRATOR[area] || TECNICAS_DISTRATOR.padrao

    const blocoConteudo = topicContent
        ? `\n📚 MATERIAL DE REFERÊNCIA DO TÓPICO (use isso como base factual — não invente fora daqui):\n"""\n${topicContent}\n"""\n`
        : ''

    const blocoEvitarRepeticao = perguntasExistentes.length > 0
        ? `\n🔁 Já existem estas perguntas para este tópico no banco — NÃO repita o mesmo enunciado nem a mesma pegadinha:\n${perguntasExistentes.slice(0, 10).map(p => `- ${p}`).join('\n')}\n`
        : ''

    const prompt = `
Você é uma banca examinadora de elite de concursos públicos (estilo FGV, Vunesp, Cebraspe).

Sua tarefa é criar exatamente ${count} questões de nível DIFÍCIL para o tópico:
Módulo: ${moduleTitle}
Tópico: ${topicName}
${blocoConteudo}${blocoEvitarRepeticao}

🚨 REGRAS OBRIGATÓRIAS PARA TODAS AS QUESTÕES (qualquer matéria) 🚨
1. As 4 alternativas devem ter comprimento e nível de detalhe SEMELHANTES entre si. Nunca deixe a alternativa correta visivelmente mais longa, mais detalhada ou mais "bem escrita" que as erradas — isso entrega a resposta.
2. Todas as alternativas erradas (distratores) precisam ser PLAUSÍVEIS — a pessoa só deve conseguir eliminá-las se realmente souber o conteúdo, nunca por eliminação óbvia de bom senso.
3. PROIBIDO usar distratores absurdos, caricatos ou claramente fora do assunto (ex: opções genéricas tipo "Nenhuma das anteriores está correta" ou frases vagas demais).
4. Varie a posição da resposta correta entre as questões (não deixe sempre na mesma letra).
5. Use estas técnicas para construir os distratores desta área (escolha e combine, não repita a mesma técnica em todas as questões):
${tecnicas.map(t => `   - ${t}`).join('\n')}

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
🎯 MODO OBRIGATÓRIO: CONHECIMENTOS ESPECÍFICOS (${area === 'legislacao' ? 'Legislação' : area === 'autores' ? 'Autores' : moduleTitle})
1. Baseie cada questão diretamente no material de referência fornecido acima — não generalize com conhecimento externo.
2. As 4 alternativas devem ser todas plausíveis, redigidas no mesmo estilo técnico da legislação/teoria, sem nenhuma "bandeira vermelha" óbvia.
3. Aplique pelo menos uma das técnicas de distrator listadas acima em cada questão, variando entre elas ao longo das ${count} questões.

EXEMPLO DO NÍVEL EXIGIDO (Legislação):
Enunciado:
"De acordo com a Base Nacional Comum Curricular, no que se refere à organização curricular da Educação Infantil, os direitos de aprendizagem e desenvolvimento devem ser assegurados através de:"

Opções:
A) Campos de experiência, que se organizam a partir de eixos estruturantes distintos das interações e brincadeiras.
B) Campos de experiência, nos quais as crianças podem construir significados sobre si, os outros e o mundo social e natural.
C) Áreas de conhecimento, organizadas de forma disciplinar desde o início da Educação Infantil.
D) Componentes curriculares, definidos exclusivamente pela rede municipal de ensino.

(Repare: as opções A, C e D usam termos reais da educação — "eixos estruturantes", "áreas de conhecimento", "componentes curriculares" — só que aplicados de forma sutilmente errada ao contexto da BNCC. Nenhuma parece absurda à primeira vista.)
`}

FORMATO DE SAÍDA EXIGIDO (JSON PURE):
Sua resposta DEVE ser um objeto JSON com a chave "questions" contendo o array de objetos:
{
  "questions": [
    {
      "enunciado": "Texto base completo + pergunta",
      "opcoes": [
        "Opção A plausível",
        "Opção B plausível",
        "Opção C plausível",
        "Opção D plausível"
      ],
      "resposta_correta": 1,
      "explicacao": "Análise detalhada apontando o erro sutil das outras opções e provando a correta.",
      "dica": "Dica sutil que direcione a releitura sem dar a resposta."
    }
  ]
}
`

    async function tentarModelo(modelo) {
        const result = await modelo.generateContent(prompt)
        const text = await result.response.text()
        const parsed = JSON.parse(text)
        const questoes = parsed.questions || parsed
        // Embaralha a posição da resposta certa no código — não depende do modelo obedecer a regra 4
        return questoes.map(embaralharAlternativas)
    }

    try {
        return await tentarModelo(geminiModel)
    } catch (primaryError) {
        console.warn('⚠️ Falha no modelo primário. Tentando fallback...', primaryError)

        try {
            return await tentarModelo(geminiFallbackModel)
        } catch (fallbackError) {
            // 🔴 Importante: registre isso de verdade (ex: em uma tabela de logs ou serviço
            // de monitoramento). Se as duas chamadas estiverem falhando com frequência,
            // as usuárias sempre caem nesta pergunta fixa abaixo — o que bate exatamente
            // com a reclamação de "pergunta sempre fácil e óbvia". Vale checar os logs
            // do servidor antes de mexer só no prompt.
            console.error('❌ Erro na geração da IA. Retornando mock de contingência.', fallbackError)

            return [
                embaralharAlternativas({
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
                })
            ]
        }
    }
}

/*
  MIGRAÇÃO OPCIONAL (recomendada, sem pressa):
  O SDK @google/generative-ai está descontinuado. O substituto é @google/genai:

    npm install @google/genai

    import { GoogleGenAI } from "@google/genai";
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "high" }, // mais raciocínio = distratores melhores
      },
    });

  Note que "temperature", "top_p" e "top_k" foram descontinuados pelos modelos
  3.x — a Google recomenda controlar o comportamento por instrução explícita no
  prompt (é exatamente o que as regras acima fazem) em vez de por parâmetro de
  aleatoriedade. `thinkingLevel: "high"` custa mais tokens/latência, mas tende a
  produzir distratores mais bem pensados — vale testar em algumas questões antes
  de aplicar em todo o banco.
*/