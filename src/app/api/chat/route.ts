import { NextResponse } from 'next/server';
import pool, { initDb } from '@/lib/db';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

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

const SYSTEM_PROMPT = `
Anda adalah RdirAI, asisten AI canggih ahli pemrograman web (HTML, CSS, JavaScript, PHP, SVG, React, Python).
Saat pengguna meminta untuk membuat website, aplikasi web, atau modul kode:
1. Bagi proses pembuatan menjadi beberapa Tahap (Phase Execution) yang terstruktur.
2. SELALU gunakan nama file standar web yang mudah dibaca dan intuitif:
   - Gunakan \`index.html\` untuk struktur HTML utama.
   - Gunakan \`style.css\` untuk styling CSS.
   - Gunakan \`script.js\` untuk logika JavaScript.
   - Gunakan \`index.php\` untuk backend PHP.
   - DILARANG menggunakan nama file generik seperti file_1.html, file_2.html, file_1.css!

Sertakan nama file di atas blok kode persis seperti contoh berikut:
\`\`\`html index.html
<!-- Kode HTML -->
\`\`\`
\`\`\`css style.css
/* Kode CSS */
\`\`\`
\`\`\`javascript script.js
// Kode JS
\`\`\`
\`\`\`php index.php
<?php // Kode PHP ?>
\`\`\`

Berikan jawaban yang sangat jelas, ramah, dan profesional.
`;

export async function POST(request: Request) {
  try {
    await initDb();
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { conversationId, messages, model } = body;

    const orApiKey = process.env.OPENROUTER_API_KEY;
    const ydcApiKey = process.env.YDC_API_KEY;
    const selectedModel = model || process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'inclusionai/ling-3.0-flash:free';

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];

    let currentConvId = conversationId;
    if (!currentConvId) {
      currentConvId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const title = lastUserMessage?.content?.substring(0, 40) || 'Percakapan AI Baru';
      try {
        await pool.query(
          'INSERT INTO conversations (id, user_id, title, model) VALUES (?, ?, ?, ?)',
          [currentConvId, userId, title, selectedModel]
        );
      } catch (err) {
        console.error('Failed to auto-create conversation in TiDB:', err);
      }
    }

    if (lastUserMessage && lastUserMessage.role === 'user') {
      const userMsgId = `msg_u_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      try {
        await pool.query(
          'INSERT INTO messages (id, conversation_id, role, content, model) VALUES (?, ?, ?, ?, ?)',
          [userMsgId, currentConvId, 'user', lastUserMessage.content, selectedModel]
        );
      } catch (err) {
        console.error('Failed to save user message to TiDB:', err);
      }
    }

    const isYouModel = selectedModel.toLowerCase().includes('you');
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          if (isYouModel) {
            // YOU.COM LOGIC
            if (!ydcApiKey) throw new Error("YDC_API_KEY is missing in .env");
            
            const response = await fetch('https://api.you.com/v1/research', {
              method: 'POST',
              headers: {
                'X-API-Key': ydcApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: lastUserMessage.content,
                research_effort: 'exhaustive',
              }),
            });

            if (!response.ok) throw new Error(`You.com API error: ${await response.text()}`);

            const data = await response.json();
            const content = data.output?.content || data.answer || data.text || data.response || "Maaf, tidak ada jawaban khusus teks dari You.com.";
            
            accumulatedContent = content;
            controller.enqueue(encoder.encode(content));
            
          } else {
            // OPENROUTER LOGIC
            if (!orApiKey) throw new Error("OPENROUTER_API_KEY is missing in .env");

            const fullMessages = [
              { role: 'system', content: SYSTEM_PROMPT },
              ...messages.map((m: any) => ({
                role: m.role,
                content: m.content,
              })),
            ];

            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${orApiKey}`,
                'HTTP-Referer': 'https://rdirai.vercel.app',
                'X-Title': 'RdirAI Workspace',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: selectedModel,
                messages: fullMessages,
                stream: true,
              }),
            });

            if (!response.ok) throw new Error(`OpenRouter API error: ${await response.text()}`);

            const reader = response.body?.getReader();
            if (!reader) {
              controller.close();
              return;
            }

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                const trimmed = line.trim();
                if (trimmed.startsWith('data: ')) {
                  const dataStr = trimmed.replace('data: ', '');
                  if (dataStr === '[DONE]') continue;

                  try {
                    const json = JSON.parse(dataStr);
                    const content = json.choices?.[0]?.delta?.content || '';
                    if (content) {
                      accumulatedContent += content;
                      controller.enqueue(encoder.encode(content));
                    }
                  } catch (e) {
                    // Ignore parsing error for partial chunks
                  }
                }
              }
            }
          }
        } catch (error: any) {
          console.error('API/Stream error:', error);
          const errorMsg = 'Error memproses respons AI: ' + error.message;
          accumulatedContent = errorMsg;
          controller.enqueue(encoder.encode(errorMsg));
        } finally {
          controller.close();

          if (accumulatedContent && currentConvId) {
            const assistantMsgId = `msg_a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            try {
              await pool.query(
                'INSERT INTO messages (id, conversation_id, role, content, model) VALUES (?, ?, ?, ?, ?)',
                [assistantMsgId, currentConvId, 'assistant', accumulatedContent, selectedModel]
              );
              await pool.query(
                'UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [currentConvId]
              );
            } catch (err) {
              console.error('Failed to save assistant message to TiDB:', err);
            }
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Conversation-Id': currentConvId,
      },
    });
  } catch (error: any) {
    console.error('Chat API Handler Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
