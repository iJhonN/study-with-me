'use client'

import { use } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { modulesData } from '@/lib/modulesData'
import {
    ArrowLeft,
    BookOpen,
    PlayCircle,
    CheckCircle2,
    Sparkles,
    FileText
} from 'lucide-react'

export default function TopicReadingPage({ params }) {
    const resolvedParams = use(params)
    const moduleId = resolvedParams.id
    const topicId = resolvedParams.topicId

    const moduleData = modulesData.find((m) => m.id === moduleId)
    const topicData = moduleData?.topics?.find((t) => t.id === topicId)

    if (!moduleData || !topicData) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <p className="text-sm font-semibold text-text-secondary">
                        Tópico de estudo não encontrado.
                    </p>
                    <Link href={`/modulo/${moduleId}`} className="mt-3 text-primary font-bold text-xs hover:underline">
                        Voltar para o módulo
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
                    href={`/modulo/${moduleId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar para o checklist do módulo</span>
                </Link>

                {/* Cabeçalho do Tópico */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-4">
                    <div className="flex justify-between items-center text-xs text-text-secondary">
                        <span className="font-bold text-primary uppercase tracking-wider">
                            {moduleData.title}
                        </span>
                        <span className="inline-flex items-center gap-1 font-semibold text-accent">
                            <Sparkles className="w-3.5 h-3.5" /> Teoria Essencial
                        </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-extrabold text-text leading-tight">
                        {topicData.name}
                    </h1>
                </div>

                {/* Conteúdo da Aula / Teoria */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-6">
                    <div className="flex items-center gap-2 border-b border-border/60 pb-4">
                        <FileText className="w-5 h-5 text-primary" />
                        <h2 className="text-base font-bold text-text">Resumo para Concurso</h2>
                    </div>

                    <div className="prose prose-sm max-w-none text-text leading-relaxed space-y-4">
                        {topicData.content ? (
                            topicData.content.split('\n\n').map((paragraph, idx) => (
                                <p key={idx} className="text-sm leading-relaxed text-text">
                                    {paragraph}
                                </p>
                            ))
                        ) : (
                            <p className="text-sm text-text-secondary">
                                Nenhum texto teórico cadastrado para este tópico.
                            </p>
                        )}
                    </div>
                </div>

                {/* Chamada para Ação (Iniciar Quiz) */}
                <div className="bg-gradient-to-r from-primary/10 via-primary-soft to-transparent p-6 rounded-3xl border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-center sm:text-left">
                        <h3 className="text-base font-bold text-text">Pronto para testar seu conhecimento?</h3>
                        <p className="text-xs text-text-secondary">
                            Responda a questões geradas e revisadas sobre esse assunto.
                        </p>
                    </div>

                    <Link
                        href={`/modulo/${moduleId}/quiz?topic=${topicData.id}`}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary-hover transition-all font-semibold text-sm shadow-md shrink-0"
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>Praticar Quiz Agora</span>
                    </Link>
                </div>
            </main>
        </div>
    )
}