'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    CheckCircle2,
    XCircle,
    HelpCircle,
    Award,
    RotateCcw,
    Sparkles,
    Timer,
    Flame
} from 'lucide-react'

export default function SimuladoPage() {
    const supabase = createClient()
    const [questions, setQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedAnswers, setSelectedAnswers] = useState({})
    const [showHints, setShowHints] = useState({})
    const [finished, setFinished] = useState(false)
    const [userId, setUserId] = useState(null)

    useEffect(() => {
        async function initSimulado() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (user) setUserId(user.id)

            try {
                const res = await fetch('/api/simulado?limit=10')
                const data = await res.json()
                if (data.questions) {
                    setQuestions(data.questions)
                }
            } catch (err) {
                console.error('Erro ao iniciar simulado:', err)
            } finally {
                setLoading(false)
            }
        }

        initSimulado()
    }, [supabase])

    const handleSelectOption = (qId, optionIdx) => {
        if (finished) return
        setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }))
    }

    const toggleHint = (qId) => {
        setShowHints(prev => ({ ...prev, [qId]: !prev[qId] }))
    }

    const handleFinish = async () => {
        setFinished(true)

        if (!userId || questions.length === 0) return

        // Registra o uso das questões do simulado no banco
        const usageRecords = questions.map(q => {
            const selected = selectedAnswers[q.id]
            const isCorrect = selected === q.resposta_correta
            return {
                user_id: userId,
                question_id: q.id,
                respondeu_certo: Boolean(isCorrect),
                usou_dica: Boolean(showHints[q.id])
            }
        })

        try {
            await supabase.from('question_usage').insert(usageRecords)
        } catch (err) {
            console.error('Erro ao registrar resultados do simulado:', err)
        }
    }

    const currentQuestion = questions[currentIndex]
    const acertos = questions.filter(q => selectedAnswers[q.id] === q.resposta_correta).length

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                    <Sparkles className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-text-secondary">
                        Preparando Simulado Geral...
                    </p>
                </div>
            </div>
        )
    }

    if (!questions.length) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-sm font-semibold text-text-secondary">
                        Não foi possível carregar as questões do simulado.
                    </p>
                    <Link href="/dashboard" className="mt-3 text-primary font-bold text-xs hover:underline">
                        Voltar ao Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 space-y-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Sair do Simulado</span>
                </Link>

                {/* Status Superior */}
                <div className="bg-bg-secondary p-5 rounded-2xl border border-border flex items-center justify-between">
                    <div className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Flame className="w-5 h-5" />
                        <span>Simulado Prova Geral</span>
                    </div>
                    <div className="text-xs font-semibold text-text-secondary">
                        Questão {currentIndex + 1} de {questions.length}
                    </div>
                </div>

                {/* Resultado Final */}
                {finished ? (
                    <div className="bg-bg-secondary p-8 rounded-3xl border border-border text-center space-y-6">
                        <div className="inline-flex p-4 bg-primary/10 text-primary rounded-full">
                            <Award className="w-10 h-10" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-bold text-text">Simulado Concluído!</h2>
                            <p className="text-sm text-text-secondary">
                                Você acertou <strong className="text-primary">{acertos}</strong> de <strong>{questions.length}</strong> questões ({Math.round((acertos / questions.length) * 100)}%).
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-4">
                            <button
                                onClick={() => window.location.reload()}
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold text-xs hover:bg-primary-hover transition-all"
                            >
                                <RotateCcw className="w-4 h-4" />
                                <span>Refazer Simulado</span>
                            </button>
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-bg text-text font-semibold text-xs hover:border-primary/40 transition-all"
                            >
                                <span>Ir para o Dashboard</span>
                            </Link>
                        </div>
                    </div>
                ) : (
                    /* Renderização da Questão Atual */
                    <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-6">
                        <h3 className="text-base font-bold text-text leading-relaxed">
                            {currentQuestion.enunciado}
                        </h3>

                        {/* Opções */}
                        <div className="space-y-3">
                            {currentQuestion.opcoes.map((opcao, idx) => {
                                const isSelected = selectedAnswers[currentQuestion.id] === idx

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectOption(currentQuestion.id, idx)}
                                        className={`w-full text-left p-4 rounded-xl border transition-all text-sm flex items-start gap-3 ${
                                            isSelected
                                                ? 'border-primary bg-primary/10 text-primary font-semibold'
                                                : 'border-border bg-bg hover:border-primary/40 text-text'
                                        }`}
                                    >
                                        <span className="shrink-0 w-6 h-6 rounded-full border border-current flex items-center justify-center text-xs">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                        <span className="leading-relaxed">{opcao}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* Botão de Dica */}
                        {currentQuestion.dica && (
                            <div className="space-y-2">
                                <button
                                    onClick={() => toggleHint(currentQuestion.id)}
                                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span>{showHints[currentQuestion.id] ? 'Ocultar dica' : 'Ver dica'}</span>
                                </button>
                                {showHints[currentQuestion.id] && (
                                    <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-text">
                                        💡 {currentQuestion.dica}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navegação entre Questões */}
                        <div className="flex items-center justify-between pt-4 border-t border-border/50">
                            <button
                                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                                disabled={currentIndex === 0}
                                className="px-4 py-2 rounded-xl border border-border text-xs font-semibold text-text disabled:opacity-50"
                            >
                                Anterior
                            </button>

                            {currentIndex < questions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIndex(prev => prev + 1)}
                                    className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all"
                                >
                                    Próxima
                                </button>
                            ) : (
                                <button
                                    onClick={handleFinish}
                                    className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-opacity-90 transition-all"
                                >
                                    Finalizar Simulado
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}