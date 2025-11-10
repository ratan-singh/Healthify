// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user || user.password !== password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ 
      id: user.id, 
      role: user.role,
      name: user.name 
    });
    
    res.cookies.set('user', JSON.stringify({ id: user.id, role: user.role }), {
      httpOnly: true,
      path: '/'
    });
    
    return res;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Failed to login' },
      { status: 500 }
    );
  }
}
