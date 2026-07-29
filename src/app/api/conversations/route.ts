import { NextResponse } from 'next/server';
import pool, { initDb } from '@/lib/db';
import { cookies } from 'next/headers';

async function getCurrentUserId(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('rdir_session');
    if (sessionCookie && sessionCookie.value) {
      const user = JSON.parse(sessionCookie.value);
      if (user.id) return user.id;
    }
  } catch (e) {}
  return 'guest_user';
}

export async function GET(request: Request) {
  try {
    await initDb();
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      const [messages]: any = await pool.query(
        `SELECT m.* FROM messages m 
         INNER JOIN conversations c ON m.conversation_id = c.id 
         WHERE m.conversation_id = ? AND c.user_id = ? 
         ORDER BY m.created_at ASC`,
        [conversationId, userId]
      );
      return NextResponse.json({ messages });
    }

    const [conversations]: any = await pool.query(
      'SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );
    return NextResponse.json({ conversations });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await initDb();
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { id, title, model } = body;

    const convId = id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const convTitle = title || 'Percakapan Baru';
    const convModel = model || 'inclusionai/ling-3.0-flash:free';

    await pool.query(
      'INSERT INTO conversations (id, user_id, title, model) VALUES (?, ?, ?, ?)',
      [convId, userId, convTitle, convModel]
    );

    return NextResponse.json({
      success: true,
      conversation: { id: convId, user_id: userId, title: convTitle, model: convModel },
    });
  } catch (error: any) {
    console.error('Error creating conversation:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    await initDb();
    const userId = await getCurrentUserId();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM conversations WHERE id = ? AND user_id = ?', [id, userId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation', details: error.message },
      { status: 500 }
    );
  }
}
