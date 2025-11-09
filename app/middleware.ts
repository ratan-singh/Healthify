import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get('user');
  if (!cookie) {
    // If not authenticated, allow only login/register
    if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }
  
  const { role } = JSON.parse(cookie.value);
  if ((pathname === '/login' || pathname === '/register') && role) {
    return NextResponse.redirect(new URL(`/${role}/dashboard`, req.url));
  }
  if (pathname.startsWith('/patient') && role !== 'patient') {
    return NextResponse.redirect(new URL('/doctor/dashboard', req.url));
  }
  if (pathname.startsWith('/doctor') && role !== 'doctor') {
    return NextResponse.redirect(new URL('/patient/dashboard', req.url));
  }
  return NextResponse.next();
}
