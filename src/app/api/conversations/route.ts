import { NextResponse } from 'next/server';
import pool, { initDb } from '@/lib/db';

export async function GET(request: Request) {
  try {
    await initDb();
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (conversationId) {
      // Fetch messages for a specific conversation
      const [messages]: any = await pool.query(
        'SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC',
        [conversationId]
      );
      return NextResponse.json({ messages });
    }

    // List all conversations
    const [conversations]: any = await pool.query(
      'SELECT * FROM conversations ORDER BY updated_at DESC'
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
    const body = await request.json();
    const { id, title, model } = body;

    const convId = id || `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const convTitle = title || 'Percakapan Baru';
    const convModel = model || 'nvidia/nemotron-3-ultra-550b-a55b:free';

    await pool.query(
      'INSERT INTO conversations (id, title, model) VALUES (?, ?, ?)',
      [convId, convTitle, convModel]
    );

    return NextResponse.json({
      success: true,
      conversation: { id: convId, title: convTitle, model: convModel },
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM conversations WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json(
      { error: 'Failed to delete conversation', details: error.message },
      { status: 500 }
    );
  }
}
