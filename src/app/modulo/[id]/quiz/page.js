'use client'

import { use, useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { modulesData } from '@/lib/modulesData'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    Lightbulb,
    CheckCircle2,
    XCircle,
    RotateCcw,
    Sparkles,
    AlertTriangle
} from 'lucide-react'

export default function QuizPage({ params }) {
    const resolvedParams = use(params)
    const moduleId = resolvedParams.id
    const searchParams = useSearchParams()
    const topicId = searchParams.get('topic')
    const router = useRouter()
    const supabase = createClient()

    const moduleData = modulesData.find((m) => m.id === moduleId)

    const [questions, setQuestions] = useState([])
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState(null)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [hintsUsed, setHintsUsed] = useState({})
    const [currentHint, setCurrentHint] = useState('')
    const [loadingHint, setLoadingHint] = useState(false)
    const [loadingQuiz, setLoadingQuiz] = useState(true)
    const [errorMessage, setErrorMessage] = useState('')
    const [quizFinished, setQuizFinished] = useState(false)

    const hasFetchedRef = useRef(false)

    useEffect(() => {
        if (hasFetchedRef.current) return
        hasFetchedRef.current = true

        async function fetchQuestions() {
            setLoadingQuiz(true)
            setErrorMessage('')
            try {
                const currentTopic = moduleData?.topics?.find(
                    (t) => t.id === topicId || t.slug === topicId
                )

                const studyContent =
                    currentTopic?.content ||
                    currentTopic?.markdown ||
                    currentTopic?.name ||
                    currentTopic?.description

                const res = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        moduleId,
                        topicId,
                        content: studyContent,
                        limit: 10
                    }),
                })
                const data = await res.json()

                if (res.status === 429) {
                    setErrorMessage(data.error || 'Limite de cota temporário atingido.')
                    return
                }

                if (data.questions && data.questions.length > 0) {
                    setQuestions(data.questions)
                } else if (data.error) {
                    setErrorMessage(data.error)
                }
            } catch (err) {
                console.error('Erro ao buscar perguntas:', err)
                setErrorMessage('Erro de conexão ao carregar as questões.')
            } finally {
                setLoadingQuiz(false)
            }
        }

        if (moduleId && topicId) {
            fetchQuestions()
        }
    }, [moduleId, topicId, moduleData])

    const currentQuestion = questions[currentIndex]

    const handleGetHint = async () => {
        if (!currentQuestion || hintsUsed[currentQuestion.id]) return
        setLoadingHint(true)

        try {
            const res = await fetch('/api/dica', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pergunta: currentQuestion.pergunta,
                    alternativas: currentQuestion.alternativas,
                    explicacao: currentQuestion.explicacao,
                }),
            })
            const data = await res.json()
            if (data.dica) {
                setCurrentHint(data.dica)
                setHintsUsed((prev) => ({ ...prev, [currentQuestion.id]: true }))
            }
        } catch (err) {
            console.error('Erro ao obter dica:', err)
        } finally {
            setLoadingHint(false)
        }
    }

    const handleAnswerSubmit = async () => {
        if (!selectedOption || isSubmitted) return
        setIsSubmitted(true)

        const isCorrect =
            selectedOption.charAt(0).toLowerCase() ===
            currentQuestion.resposta_correta.toLowerCase()

        if (isCorrect) {
            setScore((prev) => prev + 1)
        }

        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            await supabase.from('question_usage').insert({
                user_id: user.id,
                question_id: currentQuestion.id,
                respondeu_certo: isCorrect,
                usou_dica: !!hintsUsed[currentQuestion.id],
            })
        }
    }

    const handleNextQuestion = async () => {
        if (currentIndex + 1 < questions.length) {
            setCurrentIndex((prev) => prev + 1)
            setSelectedOption(null)
            setIsSubmitted(false)
            setCurrentHint('')
        } else {
            setQuizFinished(true)

            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const hintCount = Object.keys(hintsUsed).length
                await supabase.from('quiz_attempts').insert({
                    user_id: user.id,
                    module_id: moduleId,
                    score,
                    total: questions.length,
                    used_hint_count: hintCount,
                })
            }
        }
    }

    if (loadingQuiz) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm font-semibold text-text-secondary">
                        Carregando questões do quiz...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
                <Link
                    href={`/modulo/${moduleId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para o checklist</span>
                </Link>

                {errorMessage ? (
                    <div className="bg-bg-secondary p-8 rounded-2xl border border-border text-center space-y-4">
                        <div className="inline-flex p-3 bg-accent/10 rounded-full text-accent">
                            <AlertTriangle className="w-8 h-8" />
                        </div>
                        <h2 className="text-lg font-bold text-text">Ocorreu um problema</h2>
                        <p className="text-sm text-text-secondary max-w-md mx-auto">
                            {errorMessage}
                        </p>
                        <button
                            onClick={() => {
                                hasFetchedRef.current = false
                                window.location.reload()
                            }}
                            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors cursor-pointer"
                        >
                            Tentar Novamente
                        </button>
                    </div>
                ) : quizFinished ? (
                    <div className="bg-bg-secondary p-8 rounded-2xl border border-border text-center space-y-6">
                        <div className="inline-flex p-4 bg-primary-soft rounded-full text-primary">
                            <Sparkles className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-text">Quiz Concluído!</h1>
                            <p className="text-sm text-text-secondary">
                                Veja seu desempenho final neste teste
                            </p>
                        </div>

                        <div className="p-6 bg-bg rounded-xl border border-border max-w-sm mx-auto space-y-2">
                            <p className="text-3xl font-bold text-primary">
                                {score} / {questions.length}
                            </p>
                            <p className="text-xs text-text-secondary font-medium">
                                {Math.round((score / questions.length) * 100)}% de aproveitamento
                            </p>
                        </div>

                        <div className="flex justify-center gap-4 pt-2">
                            <button
                                onClick={() => {
                                    hasFetchedRef.current = false
                                    window.location.reload()
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border font-semibold text-sm hover:bg-primary-soft transition-colors cursor-pointer"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Refazer Quiz</span>
                            </button>
                            <Link
                                href={`/modulo/${moduleId}`}
                                className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm hover:bg-primary-hover transition-colors"
                            >
                                Continuar Estudando
                            </Link>
                        </div>
                    </div>
                ) : currentQuestion ? (
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-accent/10 border border-accent/20 text-text text-xs">
                            <AlertTriangle className="w-4 h-4 text-accent shrink-0" />
                            <span>
                                <strong>Lembrete:</strong> Responda sem pesquisar a resposta antes. Se tiver dúvida, use o botão de dica 💡!
                            </span>
                        </div>

                        <div className="bg-bg-secondary p-6 rounded-2xl border border-border space-y-6">
                            <div className="flex justify-between items-center text-xs text-text-secondary border-b border-border/50 pb-3">
                                <span className="font-semibold uppercase tracking-wider">
                                    Questão {currentIndex + 1} de {questions.length}
                                </span>
                                {currentQuestion.estilo_banca && (
                                    <span className="px-2 py-0.5 rounded bg-primary-soft text-primary font-bold">
                                        Estilo: {currentQuestion.estilo_banca}
                                    </span>
                                )}
                            </div>

                            <h2 className="text-base font-semibold text-text leading-relaxed">
                                {currentQuestion.pergunta}
                            </h2>

                            {!isSubmitted && (
                                <div>
                                    <button
                                        onClick={handleGetHint}
                                        disabled={loadingHint || !!currentHint}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent/40 bg-accent/10 text-accent font-semibold text-xs hover:bg-accent/20 transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        <Lightbulb className="w-3.5 h-3.5" />
                                        <span>{loadingHint ? 'Gerando dica...' : currentHint ? 'Dica liberada abaixo' : 'Preciso de uma dica 💡'}</span>
                                    </button>

                                    {currentHint && (
                                        <div className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/20 text-text text-xs leading-relaxed">
                                            <strong>💡 Dica do Tutor:</strong> {currentHint}
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="space-y-2.5">
                                {Array.isArray(currentQuestion.alternativas) && currentQuestion.alternativas.map((alt, idx) => {
                                    const letter = alt.charAt(0).toLowerCase()
                                    const isSelected = selectedOption === alt

                                    let optionStyle = 'border-border bg-bg text-text hover:border-primary/50'

                                    if (isSubmitted) {
                                        if (letter === currentQuestion.resposta_correta.toLowerCase()) {
                                            optionStyle = 'border-success bg-success/10 text-success font-semibold'
                                        } else if (isSelected) {
                                            optionStyle = 'border-error bg-error/10 text-error font-semibold'
                                        }
                                    } else if (isSelected) {
                                        optionStyle = 'border-primary bg-primary-soft text-primary font-semibold'
                                    }

                                    return (
                                        <button
                                            key={idx}
                                            disabled={isSubmitted}
                                            onClick={() => setSelectedOption(alt)}
                                            className={`w-full p-4 rounded-xl border text-left text-sm transition-colors cursor-pointer flex items-start gap-3 ${optionStyle}`}
                                        >
                                            <span className="shrink-0 mt-0.5 font-bold uppercase">
                                                {alt.substring(0, 2)}
                                            </span>
                                            <span className="flex-1">{alt.substring(3)}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {isSubmitted && (
                                <div className="p-4 rounded-xl border border-border bg-bg space-y-2 text-xs">
                                    <div className="flex items-center gap-2 font-bold text-sm">
                                        {selectedOption.charAt(0).toLowerCase() === currentQuestion.resposta_correta.toLowerCase() ? (
                                            <span className="text-success flex items-center gap-1">
                                                <CheckCircle2 className="w-4 h-4" /> Correto!
                                            </span>
                                        ) : (
                                            <span className="text-error flex items-center gap-1">
                                                <XCircle className="w-4 h-4" /> Resposta Incorreta
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-text-secondary leading-relaxed">
                                        <strong>Explicação:</strong> {currentQuestion.explicacao}
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 border-t border-border flex justify-end">
                                {!isSubmitted ? (
                                    <button
                                        onClick={handleAnswerSubmit}
                                        disabled={!selectedOption}
                                        className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-colors cursor-pointer"
                                    >
                                        Responder
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleNextQuestion}
                                        className="px-5 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
                                    >
                                        {currentIndex + 1 < questions.length ? 'Próxima Questão' : 'Ver Resultado'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-12 space-y-3">
                        <p className="text-text-secondary text-sm">Nenhuma pergunta encontrada para este tópico.</p>
                        <Link href={`/modulo/${moduleId}`} className="text-primary font-bold text-sm hover:underline">
                            Voltar para o módulo
                        </Link>
                    </div>
                )}
            </main>
        </div>
    )
}