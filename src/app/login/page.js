'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { BookOpen, ArrowRight } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) throw error
            router.push('/dashboard')
        } catch (err) {
            setMessage('E-mail ou senha incorretos. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-bg">
            <div className="w-full max-w-md bg-bg-secondary p-8 rounded-2xl border border-border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-primary-soft rounded-xl">
                        <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-text">Study With Me</h1>
                        <p className="text-xs text-text-secondary">Seu espaço pessoal de estudos</p>
                    </div>
                </div>

                <h2 className="text-2xl font-semibold mb-2 text-text">
                    Acessar a plataforma
                </h2>
                <p className="text-sm text-text-secondary mb-6">
                    Entre com seu e-mail e senha para acessar seu painel de estudos.
                </p>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-text mb-1 uppercase tracking-wider">
                            E-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-primary transition-colors text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-text mb-1 uppercase tracking-wider">
                            Senha
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-bg text-text focus:outline-none focus:border-primary transition-colors text-sm"
                        />
                    </div>

                    {message && (
                        <p className="text-xs p-3 rounded-lg bg-error/10 text-error font-medium">
                            {message}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary hover:bg-primary-hover text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 text-sm cursor-pointer"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>
            </div>
        </div>
    )
}