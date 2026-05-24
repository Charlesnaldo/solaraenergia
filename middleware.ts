import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { isTwoFactorCookieValid } from '@/lib/auth/two-factor';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const isAdminPage = request.nextUrl.pathname.startsWith('/admin');
  const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');
  const isAdminApi = request.nextUrl.pathname.startsWith('/api/admin');

  if (isAdminPage || isDashboardPage || isAdminApi) {
    const role = user?.app_metadata?.role;
    const hasTwoFactor = await isTwoFactorCookieValid(request.cookies.get('solara_admin_2fa')?.value, user?.id);
    const isAdmin = (role === 'admin' || role === 'service_role') && hasTwoFactor;

    if (!isAdmin) {
      if (isAdminApi) {
        return NextResponse.json({ error: user ? 'Sem permissao.' : 'Nao autenticado.' }, { status: user ? 403 : 401 });
      }

      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('login', '1');
      loginUrl.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/api/admin/:path*'],
};
