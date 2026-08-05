'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { modulesData } from '@/lib/modulesData'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    BookOpen,
    HelpCircle,
    CheckCircle2,
    PlayCircle,
    ChevronRight,
    FileText
} from 'lucide-react'

export default function ModuleDetailsPage({ params }) {
    const resolvedParams = use(params)
    const moduleId = resolvedParams.id
    const supabase = createClient()

    const moduleData = modulesData.find((m) => m.id === moduleId)
    const [completedTopics, setCompletedTopics] = useState({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchTopicUsage() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (user && moduleData) {
                // Busca questões respondidas deste módulo para marcar tópicos praticados
                const { data } = await supabase
                    .from('question_usage')
                    .select('question_id, questions(topic_id)')
                    .eq('user_id', user.id)

                const topicSet = {}
                data?.forEach((item) => {
                    if (item.questions?.topic_id) {
                        topicSet[item.questions.topic_id] = true
                    }
                })
                setCompletedTopics(topicSet)
            }
            setLoading(false)
        }

        fetchTopicUsage()
    }, [moduleId, moduleData, supabase])

    if (!moduleData) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-sm font-semibold text-text-secondary">
                        Módulo não encontrado.
                    </p>
                    <Link href="/dashboard" className="mt-3 text-primary font-bold text-xs hover:underline">
                        Voltar para o Dashboard
                    </Link>
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

                {/* Header do Módulo */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-3">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">
                            Módulo de Estudo
                        </span>
                        <span className="px-3 py-1 rounded-full bg-primary-soft text-primary font-bold text-xs">
                            {moduleData.topics.length} Tópicos
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-text">{moduleData.title}</h1>
                    <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                        {moduleData.description}
                    </p>
                </div>

                {/* Lista de Tópicos */}
                <div className="space-y-4">
                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-primary" />
                        <span>Tópicos de Estudo</span>
                    </h2>

                    <div className="space-y-3">
                        {moduleData.topics.map((t, idx) => {
                            const isPracticed = completedTopics[t.id]

                            return (
                                <div
                                    key={t.id}
                                    className="bg-bg-secondary p-5 rounded-2xl border border-border hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2.5 bg-bg rounded-xl border border-border text-primary font-bold text-xs mt-0.5">
                                            {idx + 1}
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-bold text-text">
                                                    {t.name}
                                                </h3>
                                                {isPracticed && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-success/10 text-success font-semibold">
                                                        <CheckCircle2 className="w-3 h-3" /> Praticado
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-text-secondary line-clamp-1">
                                                {t.content ? `${t.content.substring(0, 90)}...` : 'Conteúdo teórico disponível.'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Ações */}
                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                                        <Link
                                            href={`/modulo/${moduleId}/topico/${t.id}`}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-bg text-text hover:text-primary hover:border-primary/40 transition-all font-semibold text-xs"
                                        >
                                            <FileText className="w-3.5 h-3.5" />
                                            <span>Ler Teoria</span>
                                        </Link>

                                        <Link
                                            href={`/modulo/${moduleId}/quiz?topic=${t.id}`}
                                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all font-semibold text-xs shadow-sm"
                                        >
                                            <PlayCircle className="w-3.5 h-3.5" />
                                            <span>Praticar Quiz</span>
                                        </Link>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </main>
        </div>
    )
}