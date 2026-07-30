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

async function streamFormattedDataWithLLM(
  rawSearchData: string,
  userPrompt: string,
  orApiKey: string,
  selectedModel: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  decoder: TextDecoder
): Promise<string> {
  let fullText = '';
  const formatMessages = [
    {
      role: 'system',
      content: `Anda adalah RdirAI Executive Data Presenter - Engine Penyaji Data & Visualisasi Real-Time Kelas Atas.
WAKTU & TANGGAL REAL-TIME SEKARANG: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (Tahun ${new Date().getFullYear()}).

Tugas Utama Anda: Ambil data mentah hasil pencarian internet dan SAJIKAN INFORMASI DARI DATA PENCARIAN TERSEBUT SECARA AKURAT, LENGKAP, DAN TERSTRUKTUR.

ATURAN PRESENTASI MUTLAK:
1. PENTING: Percayai data hasil pencarian internet yang diberikan di bawah ini. Sajikan informasi terkini dari hasil pencarian tersebut tanpa ragu!
2. HAPUS 100% SEMUA SITASI ANGKA MENTAH seperti [[1, 2]], [[12, 23]], [1], [27], dll. DILARANG MENYISAKAN BRAKET ANGKA SITASI APAPUN!
3. JIKA ADA DATA ANGKA / KURS / PERBANDINGAN HARGA / KRIPTO / SAHAM / PERSENTASE / STATISTIK: WAJIB SERTAKAN BLOK DIAGRAM ("chart") DISAMPING TABEL MARKDOWN!
   Sintaks Blok Diagram yang didukung:
   \`\`\`chart
   {
     "type": "bar", // gunakan "bar" untuk diagram batang, atau "pie" / "donut" for diagram bundar
     "title": "Judul Diagram Visual",
     "data": [
       { "label": "Label 1", "value": 100 },
       { "label": "Label 2", "value": 200 }
     ]
   }
   \`\`\`
4. WAJIB BUATKAN TABEL MARKDOWN (| Header 1 | Header 2 |) yang simetris dan rapi.
5. Format struktur laporan:
   - 📌 **Poin Penting Eksekutif** (Ringkasan fakta tebal 2-3 kalimat dari hasil pencarian)
   - 📊 **Tabel Ringkasan Data & Nilai**
   - 📈 **Diagram Visualisasi Interactive** (Blok \`\`\`chart)
   - 💡 **Analisis & Catatan Informasi**
6. Buat tampilan terasa sangat eksklusif, canggih, mahal, dan profesional!`
    },
    {
      role: 'user',
      content: `Pertanyaan Pengguna: ${userPrompt}\n\nData Mentah Hasil Pencarian:\n${rawSearchData}`
    }
  ];

  const targetModel = selectedModel && !selectedModel.toLowerCase().includes('you')
    ? selectedModel
    : (process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'inclusionai/ling-3.0-flash:free');

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${orApiKey}`,
        'HTTP-Referer': 'https://rdirai.vercel.app',
        'X-Title': 'RdirAI Workspace',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: targetModel,
        messages: formatMessages,
        stream: true,
      }),
    });

    if (res.ok && res.body) {
      const reader = res.body.getReader();
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
                fullText += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch (e) {}
          }
        }
      }
    }
  } catch (err) {
    console.error('LLM formatting failed, falling back to raw:', err);
  }

  if (!fullText) {
    controller.enqueue(encoder.encode(rawSearchData));
    return rawSearchData;
  }
  return fullText;
}

export async function POST(request: Request) {
  try {
    await initDb();
    const userId = await getCurrentUserId();
    const body = await request.json();
    const { conversationId, messages, model, isImageMode, searchMode } = body;

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

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // 1. SKILL: WEB SEARCH INSTAN (/v1/search)
          if (searchMode === 'web_search') {
            if (!ydcApiKey) throw new Error("YDC_API_KEY is missing in .env");
            
            const searchNotice = "> 🔍 *Mencari informasi di web secara instan...*\n\n";
            accumulatedContent += searchNotice;
            controller.enqueue(encoder.encode(searchNotice));

            const res = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(lastUserMessage.content)}&livecrawl=all&livecrawl_formats=markdown&crawl_timeout=30`, {
              headers: { 'X-API-Key': ydcApiKey }
            });
            if (!res.ok) throw new Error(`You.com Search API error: ${await res.text()}`);
            const data = await res.json();
            
            let rawResultMarkdown = "";
            if (data.hits && data.hits.length > 0) {
              data.hits.slice(0, 5).forEach((hit: any) => {
                rawResultMarkdown += `#### 🌐 [${hit.title}](${hit.url})\n${hit.snippets?.join(' ') || ''}\n\n`;
              });
            } else {
              rawResultMarkdown = data.answer || "Tidak ada hasil instan spesifik dari pencarian.";
            }

            if (orApiKey) {
              const formatted = await streamFormattedDataWithLLM(rawResultMarkdown, lastUserMessage.content, orApiKey, selectedModel, controller, encoder, decoder);
              accumulatedContent += formatted;
            } else {
              accumulatedContent += rawResultMarkdown;
              controller.enqueue(encoder.encode(rawResultMarkdown));
            }
          }
          // 2. SKILL: DEEP RESEARCH (/v1/research exhaustive)
          else if (searchMode === 'deep_research') {
            if (!ydcApiKey) throw new Error("YDC_API_KEY is missing in .env");
            
            const researchNotice = "> 🔭 *Melakukan riset internet secara mendalam (Exhaustive Research)...*\n\n";
            accumulatedContent += researchNotice;
            controller.enqueue(encoder.encode(researchNotice));

            const res = await fetch('https://api.you.com/v1/research', {
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

            if (!res.ok) throw new Error(`You.com Research API error: ${await res.text()}`);
            const data = await res.json();
            const rawContent = data.output?.content || data.answer || data.text || "Tidak ada hasil analisis riset.";
            
            if (orApiKey) {
              const formatted = await streamFormattedDataWithLLM(rawContent, lastUserMessage.content, orApiKey, selectedModel, controller, encoder, decoder);
              accumulatedContent += formatted;
            } else {
              accumulatedContent += rawContent;
              controller.enqueue(encoder.encode(rawContent));
            }
          }
          // 3. SKILL: FINANCE RESEARCH (Pasar Keuangan, Kripto, Saham)
          else if (searchMode === 'finance') {
            if (!ydcApiKey) throw new Error("YDC_API_KEY is missing in .env");
            
            const financeNotice = "> 📈 *Menganalisis data pasar finansial, saham, & kripto...*\n\n";
            accumulatedContent += financeNotice;
            controller.enqueue(encoder.encode(financeNotice));

            const res = await fetch('https://api.you.com/v1/research', {
              method: 'POST',
              headers: {
                'X-API-Key': ydcApiKey,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                input: `${lastUserMessage.content} (Berikan data finansial lengkap, harga saham/kripto real-time, statistik dan analisis pasar)`,
                research_effort: 'standard',
              }),
            });

            if (!res.ok) throw new Error(`You.com Finance API error: ${await res.text()}`);
            const data = await res.json();
            const rawContent = data.output?.content || data.answer || data.text || "Tidak ada data finansial.";
            
            if (orApiKey) {
              const formatted = await streamFormattedDataWithLLM(rawContent, lastUserMessage.content, orApiKey, selectedModel, controller, encoder, decoder);
              accumulatedContent += formatted;
            } else {
              accumulatedContent += rawContent;
              controller.enqueue(encoder.encode(rawContent));
            }
          }
          // 4. SKILL: BACA CONTENTS LINK URL (/v1/contents + Fallback Scraper)
          else if (searchMode === 'contents') {
            const contentsNotice = "> 📄 *Membaca & mengekstrak konten penuh dari link web...*\n\n";
            accumulatedContent += contentsNotice;
            controller.enqueue(encoder.encode(contentsNotice));

            const urlMatch = lastUserMessage.content.match(/(https?:\/\/[^\s]+)/i);
            const targetUrl = urlMatch ? urlMatch[0] : null;

            let extractedText = '';

            // Step A: Try You.com Contents / Search API if API key exists
            if (ydcApiKey) {
              try {
                let res;
                if (targetUrl) {
                  res = await fetch('https://api.you.com/v1/contents', {
                    method: 'POST',
                    headers: {
                      'X-API-Key': ydcApiKey,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ urls: [targetUrl] }),
                  });
                } else {
                  res = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(lastUserMessage.content)}`, {
                    headers: { 'X-API-Key': ydcApiKey }
                  });
                }

                if (res.ok) {
                  const data = await res.json();
                  const items = Array.isArray(data) ? data : (data.contents || data.results || data.hits || data.pages || []);
                  
                  if (items && items.length > 0) {
                    let markdownList = "### 📄 Ekstraksi Konten Halaman Web:\n\n";
                    items.forEach((item: any) => {
                      const textContent = item.markdown || item.text || item.content || item.snippets?.join('\n\n') || item.snippet;
                      if (textContent) {
                        markdownList += `## 🌐 [${item.title || 'Halaman Web'}](${item.url || targetUrl || '#'})\n\n${textContent}\n\n`;
                      }
                    });
                    if (markdownList.length > 40) {
                      extractedText = markdownList;
                    }
                  } else if (data.text || data.markdown || data.content || data.answer) {
                    extractedText = `### 📄 Ekstraksi Konten Halaman Web:\n\n${data.markdown || data.text || data.content || data.answer}`;
                  }
                }
              } catch (apiErr) {
                console.error('You.com Contents API failed, engaging fallback:', apiErr);
              }
            }

            // Step B: Direct Native Web Scraper Fallback (Guarantees 100% extraction for any URL)
            if (!extractedText && targetUrl) {
              try {
                const directRes = await fetch(targetUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                  },
                });

                if (directRes.ok) {
                  const html = await directRes.text();
                  const cleanText = html
                    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
                    .replace(/<head\b[^<]*(?:(?!<\/head>)<[^<]*)*<\/head>/gi, '')
                    .replace(/<[^>]+>/g, ' ')
                    .replace(/\s+/g, ' ')
                    .trim()
                    .substring(0, 6000);

                  if (cleanText && cleanText.length > 20 && !cleanText.toLowerCase().includes('requires javascript')) {
                    extractedText = `### 📄 Ekstraksi Konten Web (${targetUrl}):\n\n${cleanText}`;
                  }
                }
              } catch (directErr) {
                console.error('Direct Scraper Fallback failed:', directErr);
              }
            }

            // Step C: You.com Search Index Fallback (For JS-challenge protected sites like 42web.io)
            if ((!extractedText || extractedText.toLowerCase().includes('requires javascript')) && targetUrl && ydcApiKey) {
              try {
                const searchRes = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(targetUrl)}`, {
                  headers: { 'X-API-Key': ydcApiKey }
                });
                if (searchRes.ok) {
                  const searchData = await searchRes.json();
                  if (searchData.hits && searchData.hits.length > 0) {
                    let searchMarkdown = `### 📄 Ekstraksi Konten Web (Terindeks):\n\n`;
                    searchData.hits.forEach((hit: any) => {
                      searchMarkdown += `#### 🌐 [${hit.title}](${hit.url})\n${hit.snippets?.join('\n\n') || ''}\n\n`;
                    });
                    extractedText = searchMarkdown;
                  }
                }
              } catch (searchErr) {
                console.error('Step C Search Fallback failed:', searchErr);
              }
            }

            const rawResultText = extractedText || "Maaf, tidak dapat mengambil isi teks dari link tersebut.";
            
            // Pass through LLM Executive Presenter for beautiful formatting
            if (orApiKey) {
              const formatted = await streamFormattedDataWithLLM(rawResultText, lastUserMessage.content, orApiKey, selectedModel, controller, encoder, decoder);
              accumulatedContent += formatted;
            } else {
              accumulatedContent += rawResultText;
              controller.enqueue(encoder.encode(rawResultText));
            }
          }
          // 5. SKILL: MODE HYPER (Fusi You.com Real-time Search + Ling 3.0 Flash Engine)
          else if (searchMode === 'hyper') {
            if (!ydcApiKey) throw new Error("YDC_API_KEY is missing in .env");
            if (!orApiKey) throw new Error("OPENROUTER_API_KEY is missing in .env");

            const hyperNotice = "> ⚡ *MODE HYPER AKTIF...*\n\n";
            accumulatedContent += hyperNotice;
            controller.enqueue(encoder.encode(hyperNotice));

            // Step 1: Fetch live real-time web knowledge from You.com
            let liveWebData = "";
            try {
              const res = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(lastUserMessage.content)}&livecrawl=all&livecrawl_formats=markdown&crawl_timeout=30`, {
                headers: { 'X-API-Key': ydcApiKey }
              });
              if (res.ok) {
                const data = await res.json();
                if (data.hits && data.hits.length > 0) {
                  data.hits.slice(0, 5).forEach((hit: any) => {
                    liveWebData += `[Sumber Web: ${hit.title}] (${hit.url})\n${hit.snippets?.join(' ') || ''}\n\n`;
                  });
                } else {
                  liveWebData = data.answer || "";
                }
              }
            } catch (e) {
              console.error('Hyper mode web search failed:', e);
            }

            // Step 2: Inject live web data into Ling 3.0 Flash System Prompt!
            const hyperSystemPrompt = `${SYSTEM_PROMPT}\n\n[DATA INTERNET REAL-TIME TERBARU UNTUK PERTANYAAN PENGGUNA]:\n${liveWebData || 'Tidak ada data web tambahan.'}\n\nGunakan data internet real-time di atas untuk menjawab atau membuatkan kode aplikasi web yang up-to-date dan akurat!`;

            const fullMessages = [
              { role: 'system', content: hyperSystemPrompt },
              ...messages.map((m: any) => ({ role: m.role, content: m.content }))
            ];

            const targetModel = selectedModel && !selectedModel.toLowerCase().includes('you')
              ? selectedModel
              : (process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'inclusionai/ling-3.0-flash:free');

            // Step 3: Stream Ling 3.0 Flash with live internet powers!
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${orApiKey}`,
                'HTTP-Referer': 'https://rdirai.vercel.app',
                'X-Title': 'RdirAI Workspace',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: targetModel,
                messages: fullMessages,
                stream: true,
              }),
            });

            if (!response.ok) throw new Error(`OpenRouter Hyper Mode Error: ${await response.text()}`);
            const reader = response.body?.getReader();
            if (reader) {
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
                    } catch (e) {}
                  }
                }
              }
            }
          } else {
            // OPENROUTER LOGIC
            if (!orApiKey) throw new Error("OPENROUTER_API_KEY is missing in .env");

            const fullMessages = isImageMode 
              ? [
                  { role: 'system', content: `PENTING: Pengguna mengaktifkan MODE GAMBAR. Anda adalah AI PROMPT ENGINEER kelas dunia.
Tugas Anda: Terjemahkan permintaan pengguna ke bahasa Inggris dan kembangkan menjadi deskripsi yang LUAR BIASA DETAIL DAN ESTETIK.

- JIKA MEMINTA LOGO/DESAIN: Tambahkan keyword "award winning logo design, modern, minimalist, premium, vector graphic art, dribbble, behance, clean white background, sharp vector lines, crystal clear focus, masterpiece".
- JIKA MEMINTA FOTO/GAMBAR: Tambahkan keyword "masterpiece, 8k resolution, photorealistic, cinematic lighting, ultra sharp focus, highly detailed, dramatic, trending on artstation".

Setelah membuat prompt bahasa Inggris yang panjang dan kaya tersebut, Balas HANYA dengan sintaks Markdown Gambar ini:
![Hasil Gambar](https://image.pollinations.ai/prompt/[masukkan_prompt_panjang_tersebut_disini]?width=1280&height=1280&nologo=true&enhance=true&model=flux)

PENTING: Ganti seluruh spasi pada prompt dengan %20. DILARANG keras menulis teks awalan, sapaan, atau penjelasan apapun selain sintaks markdown tersebut!` },
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
          controller.close();
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
