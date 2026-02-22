import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  if (request.nextUrl.pathname.startsWith('/admin') && !user) {
    const loginUrl = new URL('/', request.url);
    loginUrl.searchParams.set('login', '1');
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
