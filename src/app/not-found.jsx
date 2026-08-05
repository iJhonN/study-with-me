'use client'

import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { AlertCircle, ArrowLeft, Home, BookOpen } from 'lucide-react'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-bg flex flex-col">
            <Navbar />

            <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
                {/* Ícone e Indicador 404 */}
                <div className="relative flex items-center justify-center mb-6">
                    <div className="w-24 h-24 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                        <AlertCircle className="w-12 h-12" />
                    </div>
                    <span className="absolute -top-2 -right-2 px-2.5 py-0.5 rounded-full bg-error text-white text-xs font-black uppercase tracking-wider shadow-sm">
                        404
                    </span>
                </div>

                {/* Textos Informativos */}
                <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight mb-3">
                    Página Não Encontrada
                </h1>

                <p className="text-sm sm:text-base text-text-secondary max-w-md leading-relaxed mb-8">
                    Ops! O caminho que você tentou acessar não existe, foi movido ou está temporariamente indisponível.
                </p>

                {/* Botões de Ação */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                    <Link
                        href="/dashboard"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary-hover transition-all shadow-sm hover:shadow"
                    >
                        <Home className="w-4 h-4" />
                        <span>Ir para o Dashboard</span>
                    </Link>

                    <Link
                        href="/revisao"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-border bg-bg-secondary text-text-secondary text-xs sm:text-sm font-semibold hover:text-text hover:border-primary/40 transition-all"
                    >
                        <BookOpen className="w-4 h-4" />
                        <span>Central de Revisão</span>
                    </Link>
                </div>

                {/* Detalhe sutil de rodapé */}
                <div className="mt-12 pt-6 border-t border-border/60 w-full max-w-xs text-center">
                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Voltar para a página anterior</span>
                    </button>
                </div>
            </main>
        </div>
    )
}