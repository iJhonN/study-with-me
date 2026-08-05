'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    BookX,
    CheckCircle2,
    XCircle,
    HelpCircle,
    RotateCcw,
    Sparkles,
    Check
} from 'lucide-react'

export default function CadernoDeErrosPage() {
    const supabase = createClient()
    const [wrongQuestions, setWrongQuestions] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedAnswers, setSelectedAnswers] = useState({})
    const [showHints, setShowHints] = useState({})
    const [showExplanations, setShowExplanations] = useState({})

    useEffect(() => {
        async function fetchWrongQuestions() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            // Busca as questões onde o usuário respondeu errado (respondeu_certo = false)
            const { data, error } = await supabase
                .from('question_usage')
                .select(`
                    id,
                    question_id,
                    created_at,
                    questions (
                        id,
                        module_id,
                        topic_id,
                        enunciado,
                        opcoes,
                        resposta_correta,
                        explicacao,
                        dica
                    )
                `)
                .eq('user_id', user.id)
                .eq('respondeu_certo', false)
                .order('created_at', { ascending: false })

            if (error) {
                console.error('Erro ao carregar caderno de erros:', error)
            } else if (data) {
                // Remove duplicatas mantendo a tentativa incorreta mais recente
                const uniqueMap = new Map()
                data.forEach(item => {
                    if (item.questions && !uniqueMap.has(item.questions.id)) {
                        uniqueMap.set(item.questions.id, item.questions)
                    }
                })
                setWrongQuestions(Array.from(uniqueMap.values()))
            }

            setLoading(false)
        }

        fetchWrongQuestions()
    }, [supabase])

    const handleSelectOption = (qId, optionIdx) => {
        setSelectedAnswers(prev => ({ ...prev, [qId]: optionIdx }))
    }

    const toggleHint = (qId) => {
        setShowHints(prev => ({ ...prev, [qId]: !prev[qId] }))
    }

    const toggleExplanation = (qId) => {
        setShowExplanations(prev => ({ ...prev, [qId]: !prev[qId] }))
    }

    const handleRetrySuccess = async (qId) => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Registra a nova tentativa bem-sucedida
        await supabase.from('question_usage').insert({
            user_id: user.id,
            question_id: qId,
            respondeu_certo: true,
            usou_dica: Boolean(showHints[qId])
        })

        // Remove a questão da lista local
        setWrongQuestions(prev => prev.filter(q => q.id !== qId))
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                    <Sparkles className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-text-secondary">
                        Carregando Caderno de Erros...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 space-y-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Dashboard</span>
                </Link>

                {/* Cabeçalho */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-3">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-wider text-error flex items-center gap-1.5">
                            <BookX className="w-4 h-4" /> Caderno de Erros
                        </span>
                        <span className="px-3 py-1 rounded-full bg-error/10 text-error font-bold text-xs">
                            {wrongQuestions.length} Pendentes
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-text">Revisão de Erros</h1>
                    <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                        Refaça as questões em que você errou nas rodadas anteriores. Ao acertá-las, elas serão removidas desta lista automaticamente.
                    </p>
                </div>

                {/* Lista de Questões Incorretas */}
                {wrongQuestions.length === 0 ? (
                    <div className="bg-bg-secondary p-8 rounded-3xl border border-border text-center space-y-4">
                        <div className="inline-flex p-4 bg-success/10 text-success rounded-full">
                            <CheckCircle2 className="w-10 h-10" />
                        </div>
                        <h2 className="text-lg font-bold text-text">Caderno de erros limpo!</h2>
                        <p className="text-sm text-text-secondary max-w-md mx-auto">
                            Você não tem questões pendentes para revisão no momento. Continue praticando pelos módulos ou simulados.
                        </p>
                        <Link
                            href="/dashboard"
                            className="inline-block mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all"
                        >
                            Ir para os Módulos
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {wrongQuestions.map((q, qIdx) => {
                            const selected = selectedAnswers[q.id]
                            const isAnswered = selected !== undefined
                            const isCorrect = selected === q.resposta_correta

                            return (
                                <div
                                    key={q.id}
                                    className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-5"
                                >
                                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                        <span className="text-xs font-bold text-primary">
                                            Questão #{qIdx + 1}
                                        </span>
                                        {isAnswered && (
                                            <span className={`text-xs font-bold flex items-center gap-1 ${isCorrect ? 'text-success' : 'text-error'}`}>
                                                {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                {isCorrect ? 'Correto!' : 'Incorreto'}
                                            </span>
                                        )}
                                    </div>

                                    <h3 className="text-base font-bold text-text leading-relaxed">
                                        {q.enunciado}
                                    </h3>

                                    {/* Opções */}
                                    <div className="space-y-3">
                                        {q.opcoes.map((opcao, idx) => {
                                            const isSelected = selected === idx

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSelectOption(q.id, idx)}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all text-sm flex items-start gap-3 ${
                                                        isSelected
                                                            ? isCorrect
                                                                ? 'border-success bg-success/10 text-success font-semibold'
                                                                : 'border-error bg-error/10 text-error font-semibold'
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

                                    {/* Ações e Suporte */}
                                    <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {q.dica && (
                                                <button
                                                    onClick={() => toggleHint(q.id)}
                                                    className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
                                                >
                                                    <HelpCircle className="w-3.5 h-3.5" />
                                                    <span>{showHints[q.id] ? 'Ocultar Dica' : 'Ver Dica'}</span>
                                                </button>
                                            )}
                                            {q.explicacao && (
                                                <button
                                                    onClick={() => toggleExplanation(q.id)}
                                                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                                                >
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                    <span>{showExplanations[q.id] ? 'Ocultar Explicação' : 'Ver Explicação'}</span>
                                                </button>
                                            )}
                                        </div>

                                        {isAnswered && isCorrect && (
                                            <button
                                                onClick={() => handleRetrySuccess(q.id)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success text-white font-semibold text-xs hover:bg-opacity-90 transition-all shadow-sm"
                                            >
                                                <Check className="w-4 h-4" />
                                                <span>Marcar como Resolvido</span>
                                            </button>
                                        )}
                                    </div>

                                    {/* Box de Dica */}
                                    {showHints[q.id] && q.dica && (
                                        <div className="p-4 bg-accent/10 border border-accent/20 rounded-xl text-xs text-text">
                                            💡 <strong>Dica:</strong> {q.dica}
                                        </div>
                                    )}

                                    {/* Box de Explicação */}
                                    {showExplanations[q.id] && q.explicacao && (
                                        <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-xs text-text space-y-1">
                                            <strong className="text-primary block">Explicação da Questão:</strong>
                                            <p className="leading-relaxed">{q.explicacao}</p>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    )
}