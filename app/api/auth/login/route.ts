// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';

export async function POST(req: Request) {
  const { name, password } = await req.json();
  const usersPath = path.join(process.cwd(), 'data/users.json');
  const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  const user = usersData.find(u => u.name === name && u.password === password);
  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
  const res = NextResponse.json({ id: user.id, role: user.role });
  res.cookies.set('user', JSON.stringify({ id: user.id, role: user.role }), {
    httpOnly: true,
    path: '/'
  });
  return res;
}
