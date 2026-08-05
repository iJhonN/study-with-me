'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { modulesData } from '@/lib/modulesData'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, BookOpen, CheckCircle2, HelpCircle } from 'lucide-react'

export default function TeoriaPage({ params: paramsPromise }) {
    const params = use(paramsPromise)
    const searchParams = useSearchParams()
    const activeTopicId = searchParams.get('topic')

    const supabase = createClient()
    const moduleData = modulesData.find(m => m.id === params.id)
    const [progressMap, setProgressMap] = useState({})

    useEffect(() => {
        async function fetchProgress() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('user_progress')
                .select('topic_id, completed')
                .eq('user_id', user.id)

            if (data) {
                const map = {}
                data.forEach(p => { map[p.topic_id] = p.completed })
                setProgressMap(map)
            }
        }
        fetchProgress()
    }, [supabase])

    // Efeito para rolar suavemente até o tópico passado na URL
    useEffect(() => {
        if (activeTopicId) {
            const element = document.getElementById(activeTopicId)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
        }
    }, [activeTopicId])

    if (!moduleData) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-text font-semibold">Módulo não encontrado.</p>
                    <Link href="/dashboard" className="text-primary text-sm mt-2 hover:underline">
                        Voltar ao Dashboard
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

                {/* Cabeçalho do Módulo */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4" /> Teoria do Módulo
                    </span>
                    <h1 className="text-2xl font-bold text-text">{moduleData.title}</h1>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        {moduleData.description}
                    </p>
                </div>

                {/* Tópicos em Lista */}
                <div className="space-y-6">
                    {moduleData.topics.map((topic, index) => {
                        const isCompleted = Boolean(progressMap[topic.id])
                        const isTargeted = topic.id === activeTopicId

                        return (
                            <section
                                key={topic.id}
                                id={topic.id}
                                className={`bg-bg-secondary p-6 sm:p-8 rounded-3xl border transition-all space-y-4 scroll-mt-20 ${
                                    isTargeted ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                                }`}
                            >
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                        <span className="text-primary">#{index + 1}</span>
                                        <span>{topic.name}</span>
                                    </h2>
                                    {isCompleted && (
                                        <span className="flex items-center gap-1 text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-full">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            Concluído
                                        </span>
                                    )}
                                </div>

                                <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-line">
                                    {topic.content}
                                </div>

                                <div className="pt-4 border-t border-border/50 flex justify-end">
                                    <Link
                                        href={`/modulo/${moduleData.id}/quiz?topic=${topic.id}`}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-all"
                                    >
                                        <HelpCircle className="w-4 h-4" />
                                        <span>Praticar este Tópico</span>
                                    </Link>
                                </div>
                            </section>
                        )
                    })}
                </div>
            </main>
        </div>
    )
}