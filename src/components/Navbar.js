'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'
import {
    Sun,
    Moon,
    LogOut,
    BookOpen,
    LayoutDashboard,
    BookmarkCheck,
    BookX,
    Flame,
    User,
    Menu,
    X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const { theme, setTheme } = useTheme()
    const router = useRouter()
    const pathname = usePathname()

    const [user, setUser] = useState(null)
    const [mounted, setMounted] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    useEffect(() => {
        setMounted(true)
        const supabase = createClient()

        supabase.auth.getUser().then(({ data }) => {
            setUser(data?.user || null)
        })

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        const supabase = createClient()
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Estrutura de navegação para facilitar a renderização e estado ativo
    const navLinks = [
        { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/simulado', label: 'Simulado Geral', icon: Flame, iconColor: 'text-accent' },
        { href: '/revisao', label: 'Revisão', icon: BookmarkCheck },
        { href: '/caderno-de-erros', label: 'Caderno de Erros', icon: BookX, iconColor: 'text-error' },
    ]

    return (
        <header className="border-b border-border bg-bg-secondary/90 backdrop-blur-md sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">

                {/* Logo & Marca */}
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2.5 font-bold text-lg text-text hover:opacity-95 transition-opacity"
                >
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <BookOpen className="w-5 h-5" />
                    </div>
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-extrabold tracking-tight">
                        StudyWithMe
                    </span>
                </Link>

                {/* Navegação Desktop */}
                {user && (
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                                        isActive
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-text-secondary hover:text-text hover:bg-bg'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${link.iconColor && !isActive ? link.iconColor : ''}`} />
                                    <span>{link.label}</span>
                                </Link>
                            )
                        })}
                    </nav>
                )}

                {/* Ações da Direita */}
                <div className="flex items-center gap-2">
                    {/* Botão de Tema (Light / Dark) */}
                    {mounted && (
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="p-2.5 rounded-xl border border-border bg-bg hover:border-primary/40 transition-all text-text-secondary hover:text-text"
                            aria-label="Alternar Tema"
                        >
                            {theme === 'dark' ? (
                                <Sun className="w-4 h-4 text-accent" />
                            ) : (
                                <Moon className="w-4 h-4 text-primary" />
                            )}
                        </button>
                    )}

                    {user && (
                        <>
                            {/* Link do Perfil */}
                            <Link
                                href="/perfil"
                                className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                                    pathname === '/perfil'
                                        ? 'bg-primary/10 text-primary border-primary/20'
                                        : 'border-border bg-bg text-text-secondary hover:text-text hover:border-primary/40'
                                }`}
                            >
                                <User className="w-4 h-4" />
                                <span>Perfil</span>
                            </Link>

                            {/* Botão Sair */}
                            <button
                                onClick={handleLogout}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-border bg-bg text-text-secondary hover:text-error hover:border-error/30 transition-all"
                            >
                                <LogOut className="w-4 h-4" />
                                <span>Sair</span>
                            </button>

                            {/* Botão Menu Mobile */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="md:hidden p-2.5 rounded-xl border border-border bg-bg text-text-secondary hover:text-text"
                                aria-label="Abrir Menu"
                            >
                                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Menu Dropdown Mobile */}
            {user && isMenuOpen && (
                <div className="md:hidden border-t border-border bg-bg-secondary p-4 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    <nav className="flex flex-col gap-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon
                            const isActive = pathname === link.href

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                        isActive
                                            ? 'bg-primary/10 text-primary border border-primary/20'
                                            : 'text-text-secondary hover:text-text hover:bg-bg'
                                    }`}
                                >
                                    <Icon className={`w-4 h-4 ${link.iconColor && !isActive ? link.iconColor : ''}`} />
                                    <span>{link.label}</span>
                                </Link>
                            )
                        })}

                        <Link
                            href="/perfil"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                                pathname === '/perfil'
                                    ? 'bg-primary/10 text-primary border border-primary/20'
                                    : 'text-text-secondary hover:text-text hover:bg-bg'
                            }`}
                        >
                            <User className="w-4 h-4" />
                            <span>Meu Perfil</span>
                        </Link>
                    </nav>

                    <div className="pt-2 border-t border-border/60">
                        <button
                            onClick={() => {
                                setIsMenuOpen(false)
                                handleLogout()
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl border border-error/30 bg-error/10 text-error hover:bg-error hover:text-white transition-all"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sair da Conta</span>
                        </button>
                    </div>
                </div>
            )}
        </header>
    )
}