import { NextResponse } from 'next/server';
import pool, { initDb } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email dan Password wajib diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify user in TiDB database
    const [rows]: any = await pool.query(
      'SELECT id, name, email, password FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json(
        { error: 'Email atau Password salah!' },
        { status: 401 }
      );
    }

    const user = rows[0];

    if (user.password !== password) {
      return NextResponse.json(
        { error: 'Email atau Password salah!' },
        { status: 401 }
      );
    }

    const userObj = { id: user.id, name: user.name, email: user.email };

    // Set secure HTTP-Only cookie for 30 days
    const cookieStore = await cookies();
    cookieStore.set('rdir_session', JSON.stringify(userObj), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true, user: userObj });
  } catch (error: any) {
    console.error('Error logging in user:', error);
    return NextResponse.json(
      { error: 'Gagal login', details: error.message },
      { status: 500 }
    );
  }
}
