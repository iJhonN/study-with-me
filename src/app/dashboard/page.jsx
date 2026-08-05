'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { modulesData } from '@/lib/modulesData'
import { createClient } from '@/lib/supabase/client'
import {
    Target,
    CheckCircle2,
    XCircle,
    BookOpen,
    TrendingUp,
    ArrowRight,
    BookX,
    Sparkles,
    Flame,
    ChevronRight
} from 'lucide-react'

export default function DashboardPage() {
    const supabase = createClient()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalRespondidas: 0,
        acertos: 0,
        erros: 0,
        taxaAcerto: 0,
        dicasUsadas: 0,
        quizzesConcluidos: 0,
        moduleStats: {}
    })

    useEffect(() => {
        async function fetchDashboardStats() {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setLoading(false)
                return
            }

            try {
                const res = await fetch(`/api/stats?userId=${user.id}`)
                const data = await res.json()
                if (data.stats) {
                    setStats(data.stats)
                }
            } catch (err) {
                console.error('Erro ao buscar estatísticas:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardStats()
    }, [supabase])

    return (
        <div className="min-h-screen bg-bg flex flex-col font-sans">
            <Navbar />

            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* 1. Header & Banner de Boas-Vindas */}
                <div className="bg-gradient-to-r from-primary/10 via-primary-soft to-transparent p-6 sm:p-8 rounded-3xl border border-primary/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Preparatório Concurso Educação Infantil</span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
                            Painel de Estudos
                        </h1>
                        <p className="text-sm text-text-secondary max-w-xl leading-relaxed">
                            Continue seu plano de estudos. Resolva simulados com IA e acompanhe seu rendimento em tempo real.
                        </p>
                    </div>

                    <Link
                        href="/caderno-de-erros"
                        className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error hover:text-white transition-all font-semibold text-xs shadow-sm"
                    >
                        <BookX className="w-4 h-4" />
                        <span>Revisar Caderno de Erros ({stats.erros})</span>
                    </Link>
                </div>

                {/* 2. Grid Principal (Esquerda: Conteúdo / Direita: Sidebar Métricas) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* LADO ESQUERDO (Módulos de Estudo - 8 Colunas) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-primary" />
                                <span>Módulos de Conhecimento</span>
                            </h2>
                            <span className="text-xs text-text-secondary font-medium">
                                {modulesData.length} Módulos Disponíveis
                            </span>
                        </div>

                        {/* Grade de Módulos */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {modulesData.map((m) => {
                                const modStat = stats.moduleStats[m.id]
                                const modTotal = modStat?.total || 0
                                const modAcertos = modStat?.acertos || 0
                                const modPercent =
                                    modTotal > 0 ? Math.round((modAcertos / modTotal) * 100) : 0

                                return (
                                    <Link
                                        key={m.id}
                                        href={`/modulo/${m.id}`}
                                        className="bg-bg-secondary p-5 rounded-2xl border border-border hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all flex flex-col justify-between group space-y-4"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-bold text-text group-hover:text-primary transition-colors leading-snug">
                                                    {m.title}
                                                </h3>
                                                <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                                                    {m.topics.length} tópicos
                                                </span>
                                            </div>
                                            <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                                                {m.description}
                                            </p>
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-border/40">
                                            <div className="flex justify-between items-center text-[11px] text-text-secondary font-medium">
                                                <span>Aproveitamento</span>
                                                <span className="font-bold text-text">
                                                    {modTotal > 0 ? `${modPercent}% (${modAcertos}/${modTotal})` : '0%'}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-bg rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary transition-all duration-500 rounded-full"
                                                    style={{ width: `${modPercent}%` }}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-xs font-semibold text-primary pt-1">
                                            <span>Estudar agora</span>
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </div>
                                    </Link>
                                )
                            })}
                        </div>
                    </div>

                    {/* LADO DIREITO (Barra Lateral com Resumo de Métricas - 4 Colunas) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-text flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <span>Resumo de Rendimento</span>
                            </h2>
                        </div>

                        {/* Card Principal da Taxa de Acerto */}
                        <div className="bg-bg-secondary p-6 rounded-2xl border border-border text-center space-y-3">
                            <p className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                                Taxa Global de Acerto
                            </p>
                            <div className="relative inline-flex items-center justify-center">
                                <span className="text-4xl font-extrabold text-primary">
                                    {loading ? '...' : `${stats.taxaAcerto}%`}
                                </span>
                            </div>
                            <p className="text-xs text-text-secondary">
                                {stats.totalRespondidas > 0
                                    ? `Baseado em ${stats.totalRespondidas} questões resolvidas`
                                    : 'Resolva quizzes para calcular seu desempenho.'}
                            </p>
                        </div>

                        {/* Grid de Estatísticas Pequenas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-bg-secondary p-4 rounded-2xl border border-border space-y-1">
                                <div className="flex items-center gap-2 text-success">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-semibold text-text-secondary">Acertos</span>
                                </div>
                                <p className="text-xl font-bold text-text">
                                    {loading ? '...' : stats.acertos}
                                </p>
                            </div>

                            <div className="bg-bg-secondary p-4 rounded-2xl border border-border space-y-1">
                                <div className="flex items-center gap-2 text-error">
                                    <XCircle className="w-4 h-4" />
                                    <span className="text-xs font-semibold text-text-secondary">Erros</span>
                                </div>
                                <p className="text-xl font-bold text-text">
                                    {loading ? '...' : stats.erros}
                                </p>
                            </div>

                            <div className="bg-bg-secondary p-4 rounded-2xl border border-border space-y-1">
                                <div className="flex items-center gap-2 text-primary">
                                    <Target className="w-4 h-4" />
                                    <span className="text-xs font-semibold text-text-secondary">Respondidas</span>
                                </div>
                                <p className="text-xl font-bold text-text">
                                    {loading ? '...' : stats.totalRespondidas}
                                </p>
                            </div>

                            <div className="bg-bg-secondary p-4 rounded-2xl border border-border space-y-1">
                                <div className="flex items-center gap-2 text-accent">
                                    <Flame className="w-4 h-4" />
                                    <span className="text-xs font-semibold text-text-secondary">Testes</span>
                                </div>
                                <p className="text-xl font-bold text-text">
                                    {loading ? '...' : stats.quizzesConcluidos}
                                </p>
                            </div>
                        </div>

                        {/* Dica de Estudo */}
                        <div className="bg-accent/10 p-5 rounded-2xl border border-accent/20 space-y-2 text-xs text-text">
                            <p className="font-bold flex items-center gap-1.5 text-accent">
                                💡 Dica de Foco:
                            </p>
                            <p className="text-text-secondary leading-relaxed">
                                Priorize responder ao <strong>Caderno de Erros</strong> regularmente para consolidar sua memória de longo prazo antes de avançar para novos módulos.
                            </p>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}