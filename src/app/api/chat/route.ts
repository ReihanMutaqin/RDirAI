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

3. ATURAN REVISI & MELANJUTKAN KODE (CRUD):
   - Jika pengguna meminta untuk "melanjutkan", "menambahkan fitur", atau merevisi kode, JANGAN PERNAH mengulang menulis seluruh kode dari awal jika tidak perlu.
   - Cukup tuliskan blok kode spesifik yang baru atau yang diubah saja beserta nama filenya (contoh: \`\`\`javascript script.js). Sistem antarmuka kami akan otomatis menggabungkannya dengan file yang sudah ada.
   - PENTING: Jika Anda menambahkan fitur yang memerlukan perubahan di HTML dan JavaScript/CSS, Anda WAJIB menyertakan blok kode untuk SEMUA file yang terlibat (HTML, CSS, dan JS) agar fitur berfungsi penuh! Jangan hanya mengirim HTML-nya saja.
   - Jika kode sebelumnya terpotong di tengah jalan karena batas token, lanjutkan persis dari karakter terakhir yang terpotong TANPA mengulang kode sebelumnya.

4. GENERASI GAMBAR FOTO/RASTER GRATIS:
   - Jika pengguna meminta dibuatkan gambar foto, lukisan, atau render 3D (bukan UI/SVG), Anda BISA menghasilkannya menggunakan Pollinations AI.
   - Caranya, CUKUP tuliskan sintaks Markdown Gambar (TIDAK PERLU BLOK KODE HTML) dengan URL: \`https://image.pollinations.ai/prompt/[prompt_bahasa_inggris]?width=1920&height=1080&nologo=true&model=flux\`
   - Ganti spasi pada prompt dengan \`%20\`. 
   - CONTOH PENULISAN (langsung di chat, jangan dibungkus \`\`\`html):
     ![Gambar Naga Kucing](https://image.pollinations.ai/prompt/a%20massive%20dragon%20hugging%20a%20small%20cat?width=1920&height=1080&nologo=true&model=flux)

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

Berikan jawaban yang sangat jelas, ramah, dan profesional.
`;

export async function POST(request: Request) {
  try {
    await initDb();
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { conversationId, messages, model, isImageMode } = body;

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
            
            // Berikan feedback instan ke UI agar tidak terkesan nge-hang
            const searchMessage = "> 🔍 *Sedang menjelajahi internet untuk mencari data terbaru...*\n\n";
            accumulatedContent += searchMessage;
            controller.enqueue(encoder.encode(searchMessage));

            const response = await fetch('https://api.you.com/v1/research', {
              method: 'POST',
              headers: {
                'X-API-Key': ydcApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: lastUserMessage.content,
                research_effort: 'basic',
              }),
            });

            if (!response.ok) throw new Error(`You.com API error: ${await response.text()}`);

            const data = await response.json();
            const content = data.output?.content || data.answer || data.text || data.response || "Maaf, tidak ada jawaban khusus teks dari You.com.";
            
            // FAKE STREAMING FOR UI/UX
            const chunkSize = 4;
            for (let i = 0; i < content.length; i += chunkSize) {
              const chunk = content.slice(i, i + chunkSize);
              accumulatedContent += chunk;
              controller.enqueue(encoder.encode(chunk));
              await new Promise(r => setTimeout(r, 10));
            }
          } else {
            // OPENROUTER LOGIC
            if (!orApiKey) throw new Error("OPENROUTER_API_KEY is missing in .env");

            const fullMessages = isImageMode 
              ? [
                  { role: 'system', content: `PENTING: Pengguna mengaktifkan MODE GAMBAR. Tugas Anda adalah menjadi PROMPT ENGINEER. Terjemahkan permintaan pengguna ke Bahasa Inggris dan kembangkan menjadi deskripsi visual yang SANGAT DETAIL, ESTETIK, HIGH QUALITY, dan PROFESIONAL (sebutkan pencahayaan, gaya seni, warna, resolusi 8k, dll).\n\nSetelah itu, Balas HANYA dengan sintaks Markdown Gambar menggunakan URL Pollinations AI:\n![Deskripsi Gambar](https://image.pollinations.ai/prompt/[prompt_inggris_yang_sudah_diperkaya]?width=1920&height=1080&nologo=true&model=flux)\n\nGanti spasi pada prompt dengan %20. DILARANG menuliskan hal lain, teks sapaan, atau penjelasan apapun!` },
                  ...messages.map((m: any) => ({ role: m.role, content: m.content })).slice(-1)
                ]
              : [
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

            let buffer = '';
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              const chunk = decoder.decode(value, { stream: true });
              buffer += chunk;
              const lines = buffer.split('\n');
              
              // Keep the last incomplete line in the buffer
              buffer = lines.pop() || '';

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
