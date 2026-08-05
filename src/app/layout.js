import { Sora, Manrope } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata = {
  title: 'Study With Me',
  description: 'Plataforma de estudos para concursos',
}

export default function RootLayout({ children }) {
  return (
      <html lang="pt-BR" suppressHydrationWarning className={`${sora.variable} ${manrope.variable}`}>
      <body className="min-h-screen antialiased selection:bg-primary-soft selection:text-primary">
      <Providers>{children}</Providers>
      </body>
      </html>
  )
}