import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Aplica o middleware em todas as rotas, exceto:
         * - _next/static (arquivos estáticos)
         * - _next/image (otimização de imagens)
         * - favicon.ico, sitemap.xml, robots.txt
         * - imagens/assets públicos (png, jpg, svg, etc.)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}