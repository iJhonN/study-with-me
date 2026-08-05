'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import { modulesData } from '@/lib/modulesData'
import {
    ArrowLeft,
    BookmarkCheck,
    BookOpen,
    Sparkles,
    CheckCircle2,
    ChevronRight,
    Search
} from 'lucide-react'

export default function RevisaoPage() {
    const supabase = createClient()
    const [progressMap, setProgressMap] = useState({})
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedModule, setSelectedModule] = useState('all')

    useEffect(() => {
        async function loadProgress() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            const { data: progress } = await supabase
                .from('user_progress')
                .select('*')
                .eq('user_id', user.id)

            if (progress) {
                const map = {}
                progress.forEach(p => {
                    map[p.topic_id] = p.completed
                })
                setProgressMap(map)
            }

            setLoading(false)
        }

        loadProgress()
    }, [supabase])

    // Filtra tópicos com base no módulo selecionado e no termo de busca
    const filteredModules = modulesData
        .filter(m => selectedModule === 'all' || m.id === selectedModule)
        .map(m => {
            const filteredTopics = m.topics.filter(t =>
                t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.content.toLowerCase().includes(searchTerm.toLowerCase())
            )
            return { ...m, topics: filteredTopics }
        })
        .filter(m => m.topics.length > 0)

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                    <Sparkles className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-text-secondary">
                        Carregando Central de Revisão...
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-text-secondary hover:text-primary transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Voltar ao Dashboard</span>
                </Link>

                {/* Cabeçalho */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-4">
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                            <BookmarkCheck className="w-4 h-4" /> Central de Revisão
                        </span>
                    </div>
                    <h1 className="text-2xl font-bold text-text">Resumo Express & Revisão</h1>
                    <p className="text-sm text-text-secondary leading-relaxed max-w-2xl">
                        Consulte os conteúdos teóricos essenciais de cada módulo, busque por termos-chave e revise os conceitos antes do dia da prova.
                    </p>

                    {/* Filtros e Busca */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <div className="relative flex-1">
                            <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Buscar por assunto, lei ou conceito..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-bg border border-border text-sm text-text placeholder:text-text-secondary focus:outline-none focus:border-primary transition-all"
                            />
                        </div>

                        <select
                            value={selectedModule}
                            onChange={e => setSelectedModule(e.target.value)}
                            className="px-4 py-2.5 rounded-xl bg-bg border border-border text-sm text-text focus:outline-none focus:border-primary transition-all cursor-pointer"
                        >
                            <option value="all">Todos os Módulos</option>
                            {modulesData.map(m => (
                                <option key={m.id} value={m.id}>
                                    {m.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Lista de Módulos e Tópicos */}
                <div className="space-y-6">
                    {filteredModules.length === 0 ? (
                        <div className="bg-bg-secondary p-8 rounded-3xl border border-border text-center space-y-2">
                            <p className="text-sm font-semibold text-text-secondary">
                                Nenhum conteúdo encontrado para a sua busca.
                            </p>
                        </div>
                    ) : (
                        filteredModules.map(module => (
                            <div key={module.id} className="bg-bg-secondary rounded-3xl border border-border p-6 sm:p-8 space-y-4">
                                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                                    <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                        <BookOpen className="w-5 h-5 text-primary" />
                                        <span>{module.title}</span>
                                    </h2>
                                    <span className="text-xs font-semibold text-text-secondary">
                                        {module.topics.length} tópicos
                                    </span>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    {module.topics.map(topic => {
                                        const isCompleted = Boolean(progressMap[topic.id])

                                        return (
                                            <div
                                                key={topic.id}
                                                className="bg-bg p-5 rounded-2xl border border-border flex flex-col justify-between gap-4 hover:border-primary/40 transition-all"
                                            >
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-primary">
                                                            {topic.name}
                                                        </span>
                                                        {isCompleted && (
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-success bg-success/10 px-2 py-0.5 rounded-full">
                                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                                Concluído
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                                                        {topic.content}
                                                    </p>
                                                </div>

                                                <Link
                                                    href={`/modulo/${module.id}/teoria?topic=${topic.id}`}
                                                    className="inline-flex items-center justify-between pt-2 border-t border-border/50 text-xs font-semibold text-primary hover:underline"
                                                >
                                                    <span>Ler Teoria Completa</span>
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    )
}