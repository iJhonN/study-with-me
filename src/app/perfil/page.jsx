'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    User,
    Mail,
    Calendar,
    LogOut,
    RotateCcw,
    Award,
    Target,
    CheckCircle2,
    BookX,
    Sparkles,
    AlertTriangle
} from 'lucide-react'

export default function PerfilPage() {
    const router = useRouter()
    const supabase = createClient()

    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [resetting, setResetting] = useState(false)
    const [showConfirmReset, setShowConfirmReset] = useState(false)
    const [stats, setStats] = useState({
        totalAnswered: 0,
        correctAnswered: 0,
        accuracy: 0,
        completedTopics: 0
    })

    useEffect(() => {
        async function loadUserData() {
            setLoading(true)
            const { data: { user: currentUser } } = await supabase.auth.getUser()

            if (!currentUser) {
                router.push('/')
                return
            }

            setUser(currentUser)

            // Buscar métricas globais de tentativas
            const { data: usageData } = await supabase
                .from('question_usage')
                .select('respondeu_certo')
                .eq('user_id', currentUser.id)

            // Buscar tópicos concluídos
            const { data: progressData } = await supabase
                .from('user_progress')
                .select('topic_id')
                .eq('user_id', currentUser.id)
                .eq('completed', true)

            const total = usageData ? usageData.length : 0
            const correct = usageData ? usageData.filter(q => q.respondeu_certo).length : 0
            const acc = total > 0 ? Math.round((correct / total) * 100) : 0
            const completedCount = progressData ? progressData.length : 0

            setStats({
                totalAnswered: total,
                correctAnswered: correct,
                accuracy: acc,
                completedTopics: completedCount
            })

            setLoading(false)
        }

        loadUserData()
    }, [supabase, router])

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/')
    }

    const handleResetProgress = async () => {
        if (!user) return
        setResetting(true)

        try {
            // Limpa o histórico de progresso e de uso das questões
            await supabase.from('user_progress').delete().eq('user_id', user.id)
            await supabase.from('question_usage').delete().eq('user_id', user.id)
            await supabase.from('quiz_attempts').delete().eq('user_id', user.id)

            setStats({
                totalAnswered: 0,
                correctAnswered: 0,
                accuracy: 0,
                completedTopics: 0
            })
            setShowConfirmReset(false)
        } catch (error) {
            console.error('Erro ao resetar progresso:', error)
        } finally {
            setResetting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-bg flex flex-col">
                <Navbar />
                <div className="flex-1 flex flex-col items-center justify-center p-4 space-y-3">
                    <Sparkles className="w-8 h-8 text-primary animate-spin" />
                    <p className="text-sm font-semibold text-text-secondary">
                        Carregando Perfil...
                    </p>
                </div>
            </div>
        )
    }

    const userCreatedDate = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        : 'Recente'

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

                {/* Card Principal do Usuário */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary text-xl font-bold">
                            {user?.email?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-text">
                                {user?.user_metadata?.name || user?.email?.split('@')[0]}
                            </h1>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs text-text-secondary mt-1">
                                <span className="flex items-center gap-1">
                                    <Mail className="w-3.5 h-3.5" />
                                    {user?.email}
                                </span>
                                <span className="hidden sm:inline">•</span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    Membro desde {userCreatedDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSignOut}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-bg text-text-secondary text-xs font-semibold hover:text-error hover:border-error/40 transition-all"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Sair da Conta</span>
                    </button>
                </div>

                {/* Métricas Consolidadas */}
                <div className="space-y-3">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-secondary">
                        Desempenho Geral
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="bg-bg-secondary p-5 rounded-2xl border border-border space-y-1">
                            <Target className="w-5 h-5 text-primary" />
                            <p className="text-2xl font-extrabold text-text">{stats.totalAnswered}</p>
                            <p className="text-xs font-medium text-text-secondary">Questões Feitas</p>
                        </div>

                        <div className="bg-bg-secondary p-5 rounded-2xl border border-border space-y-1">
                            <Award className="w-5 h-5 text-accent" />
                            <p className="text-2xl font-extrabold text-text">{stats.accuracy}%</p>
                            <p className="text-xs font-medium text-text-secondary">Taxa de Acerto</p>
                        </div>

                        <div className="bg-bg-secondary p-5 rounded-2xl border border-border space-y-1">
                            <CheckCircle2 className="w-5 h-5 text-success" />
                            <p className="text-2xl font-extrabold text-text">{stats.completedTopics}</p>
                            <p className="text-xs font-medium text-text-secondary">Tópicos Concluídos</p>
                        </div>

                        <div className="bg-bg-secondary p-5 rounded-2xl border border-border space-y-1">
                            <BookX className="w-5 h-5 text-error" />
                            <p className="text-2xl font-extrabold text-text">
                                {stats.totalAnswered - stats.correctAnswered}
                            </p>
                            <p className="text-xs font-medium text-text-secondary">Total de Erros</p>
                        </div>
                    </div>
                </div>

                {/* Zona de Perigo / Configurações de Dados */}
                <div className="bg-bg-secondary p-6 sm:p-8 rounded-3xl border border-border space-y-4">
                    <h2 className="text-base font-bold text-text flex items-center gap-2">
                        <RotateCcw className="w-5 h-5 text-error" />
                        <span>Gerenciamento de Dados</span>
                    </h2>
                    <p className="text-sm text-text-secondary leading-relaxed">
                        Se deseja reiniciar seu treinamento do zero, é possível apagar o seu histórico de acertos, simulados e cadernos de erros.
                    </p>

                    {!showConfirmReset ? (
                        <button
                            onClick={() => setShowConfirmReset(true)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-error/30 text-error bg-error/10 text-xs font-semibold hover:bg-error hover:text-white transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Resetar Todo o Progresso</span>
                        </button>
                    ) : (
                        <div className="p-4 bg-error/10 border border-error/30 rounded-2xl space-y-3">
                            <div className="flex items-center gap-2 text-error text-xs font-bold">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Tem certeza? Esta ação não pode ser desfeita.</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleResetProgress}
                                    disabled={resetting}
                                    className="px-4 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-opacity-90 disabled:opacity-50 transition-all"
                                >
                                    {resetting ? 'Resetando...' : 'Sim, apagar meu histórico'}
                                </button>
                                <button
                                    onClick={() => setShowConfirmReset(false)}
                                    className="px-4 py-2 rounded-xl bg-bg border border-border text-text-secondary text-xs font-semibold hover:text-text transition-all"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}