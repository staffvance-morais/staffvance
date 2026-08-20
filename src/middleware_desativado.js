import { NextResponse } from 'next/server'

export function middleware(request) {
  // 1. Verifica se o navegador possui o "crachá" (cookie de login) do Supabase
  const hasToken = request.cookies.getAll().some(cookie => cookie.name.includes('-auth-token'));

  // 2. Define quais áreas do site são restritas
  const url = request.nextUrl.pathname;
  const isProtectedRoute = url.startsWith('/admin') || 
                           url.startsWith('/coordenador') || 
                           url.startsWith('/freelancers');

  // 3. Se tentar entrar na área restrita sem crachá, é expulso para a tela inicial
  if (isProtectedRoute && !hasToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 4. Se tiver crachá ou for uma página pública (como o login), deixa passar
  return NextResponse.next();
}

// Otimização: diz ao servidor para vigiar apenas essas rotas específicas
export const config = {
  matcher: [
    '/admin/:path*',
    '/coordenador/:path*',
    '/freelancers/:path*',
  ],
}