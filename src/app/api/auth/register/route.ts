import { NextResponse } from 'next/server';
import pool, { initDb } from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    await initDb();
    const body = await request.json();
    const { name, email, password } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Nama, Email, dan Password wajib diisi' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const [existing]: any = await pool.query(
      'SELECT id FROM users WHERE email = ?',
      [cleanEmail]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar. Silakan login!' },
        { status: 400 }
      );
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await pool.query(
      'INSERT INTO users (id, name, email, password) VALUES (?, ?, ?, ?)',
      [userId, name.trim(), cleanEmail, password]
    );

    const userObj = { id: userId, name: name.trim(), email: cleanEmail };

    const cookieStore = await cookies();
    cookieStore.set('rdir_session', JSON.stringify(userObj), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({ success: true, user: userObj });
  } catch (error: any) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Gagal mendaftar pengguna baru', details: error.message },
      { status: 500 }
    );
  }
}
