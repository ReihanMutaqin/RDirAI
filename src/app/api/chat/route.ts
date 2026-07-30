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

4. GENERASI DESAIN LOGO, VECTOR ART, & VISUAL ASSET (FITUR KEUNGGULAN RDIRAI):
   - Anda DILENGKAPI KEMAMPUAN PERENDERAN DESAIN LOGO & VISUAL ASSET KELAS DUNIA secara langsung di chat!
   - JIKA PENGGUNA MEMINTA LOGO, IKON, FOTO, ILUSTRASI, BANNER, POSTER, ATAU GAMBAR (misal: "buatkan logo kedai kopi", "desain logo toko", "bikinkan ilustrasi cyberpunk", "gambar naga"):
   - Anda WAJIB LANGSUNG MERENDER LOGO / VISUAL ASSET TERSEBUT menggunakan sintaks Markdown Gambar berikut (Ganti spasi dengan %20):
     ![Desain Logo / Visual](https://image.pollinations.ai/prompt/[PROMPT_DETIL_BAHASA_INGGRIS]?width=1280&height=1280&nologo=true&enhance=true&model=flux)
   - UNTUK LOGO: Otomatis tambahkan kata kunci \`award winning logo design, modern minimalist emblem, clean vector lines, Behance trending, masterpiece, isolated background\`.
   - CONTOH REAKSI TERHADAP REQUEST LOGO KOPI:
     ![Desain Logo Beans Coffee](https://image.pollinations.ai/prompt/award%20winning%20logo%20design%20for%20Beans%20Coffee%20shop,%20modern%20minimalist%20emblem,%20clean%20vector%20lines,%20Behance%20trending,%20masterpiece,%20isolated%20white%20background?width=1280&height=1280&nologo=true&enhance=true&model=flux)

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
function extractHitsFromYouData(data: any): any[] {
  if (!data) return [];
  const hits: any[] = [];
  
  if (Array.isArray(data.hits)) hits.push(...data.hits);
  if (Array.isArray(data.news)) hits.push(...data.news);
  if (Array.isArray(data.news?.results)) hits.push(...data.news.results);
  if (Array.isArray(data.web)) hits.push(...data.web);
  if (Array.isArray(data.web?.results)) hits.push(...data.web.results);

  if (data.results && typeof data.results === 'object' && !Array.isArray(data.results)) {
    if (Array.isArray(data.results.web)) hits.push(...data.results.web);
    if (Array.isArray(data.results.news)) hits.push(...data.results.news);
  } else if (Array.isArray(data.results)) {
    hits.push(...data.results);
  }

  const map = new Map<string, any>();
  hits.forEach((item) => {
    if (item && (item.title || item.url)) {
      const key = item.url || item.title;
      if (!map.has(key)) map.set(key, item);
    }
  });

  return Array.from(map.values());
}

async function safeFetchYouSearch(query: string, apiKey: string): Promise<any> {
  // Attempt 1: Fast Search with LiveCrawl (3.5s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(query)}&country=ID&livecrawl=all&livecrawl_formats=markdown`, {
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('LiveCrawl search timed out, falling back to instant search...', e);
  }

  // Attempt 2: Instant Fast Search Fallback (2s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(query)}&country=ID`, {
      headers: { 'X-API-Key': apiKey },
      signal: controller.signal
    });
    clearTimeout(timer);
    if (res.ok) return await res.json();
  } catch (e) {
    console.error('Fast search fallback failed:', e);
  }

  return null;
}

async function fetchCompletionWithFallback(
  messages: any[],
  model: string,
  orApiKey: string
): Promise<Response> {
  const modelsToTry = Array.from(new Set([
    model,
    'inclusionai/ling-3.0-flash:free',
    'google/gemini-2.0-flash-exp:free',
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen-2.5-coder-32b-instruct:free',
    'deepseek/deepseek-r1:free',
    'deepseek/deepseek-chat:free',
    'mistralai/mistral-7b-instruct:free',
    'google/gemini-2.0-pro-exp-02-05:free',
    'openchat/openchat-7b:free',
    'microsoft/phi-3-medium-128k-instruct:free'
  ])).filter(Boolean);

  for (const m of modelsToTry) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orApiKey}`,
          'HTTP-Referer': 'https://rdirai.vercel.app',
          'X-Title': 'RdirAI Workspace',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: m,
          messages: messages,
          stream: true,
        }),
        signal: controller.signal
      });
      clearTimeout(timer);

      if (res.ok) {
        console.log(`Successfully connected to OpenRouter model: ${m}`);
        return res;
      }
    } catch (e) {
      console.warn(`OpenRouter model ${m} timed out/rate-limited, trying next free model in pool...`);
    }
  }

  // Ultimate Fast Engine: Pollinations AI Free Unlimited Text Engine (No API Key, No Rate Limits)
  console.warn('All OpenRouter free models rate-limited or timed out. Activating Pollinations Unlimited Engine!');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const res = await fetch('https://text.pollinations.ai/openai/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'openai',
      messages: messages,
      stream: true,
    }),
    signal: controller.signal
  });
  clearTimeout(timer);
  return res;
}

async function parseAndEnqueueStream(
  res: Response,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  decoder: TextDecoder
): Promise<string> {
  let fullText = '';
  if (!res.body) return fullText;

  const reader = res.body.getReader();
  let accumulatedRaw = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    accumulatedRaw += chunk;

    const lines = accumulatedRaw.split('\n');
    // Keep incomplete last line in accumulatedRaw
    accumulatedRaw = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('data: ')) {
        const dataStr = trimmed.replace('data: ', '');
        if (dataStr === '[DONE]') continue;

        try {
          const json = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || '';
          if (content) {
            fullText += content;
            controller.enqueue(encoder.encode(content));
          }
        } catch (e) {}
      }
    }
  }

  // Handle final remaining buffer (especially non-SSE single-line JSON like Pollinations AI)
  const finalRaw = accumulatedRaw.trim();
  if (finalRaw) {
    if (finalRaw.startsWith('data: ')) {
      const dataStr = finalRaw.replace('data: ', '');
      if (dataStr !== '[DONE]') {
        try {
          const json = JSON.parse(dataStr);
          const content = json.choices?.[0]?.delta?.content || json.choices?.[0]?.message?.content || '';
          if (content) {
            fullText += content;
            controller.enqueue(encoder.encode(content));
          }
        } catch (e) {}
      }
    } else if (finalRaw.startsWith('{') && finalRaw.endsWith('}')) {
      try {
        const json = JSON.parse(finalRaw);
        const content = json.choices?.[0]?.message?.content || json.choices?.[0]?.delta?.content || json.text || '';
        if (content && !fullText) {
          fullText += content;
          controller.enqueue(encoder.encode(content));
        }
      } catch (e) {}
    }
  }

  return fullText;
}

async function streamFormattedDataWithLLM(
  rawSearchData: string,
  userPrompt: string,
  orApiKey: string,
  selectedModel: string,
  controller: ReadableStreamDefaultController,
  encoder: TextEncoder,
  decoder: TextDecoder
): Promise<string> {
  const formatMessages = [
    {
      role: 'system',
      content: `Anda adalah RdirAI Executive Data Presenter - Engine Penyaji Data & Visualisasi Real-Time Kelas Atas.
WAKTU & TANGGAL REAL-TIME SEKARANG: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} (Tahun ${new Date().getFullYear()}).

Tugas Utama Anda: Ambil data mentah hasil pencarian internet dan SAJIKAN RINGKASAN DATA KLASEMEN/JADWAL TERKINI YANG SINGKAT, PADAT, DAN ELEGANKAN.

ATURAN PRESENTASI MUTLAK:
1. MANDATORI BAHASA: WAJIB SELALU MENJAWAB DALAM BAHASA INDONESIA YANG RAMAH, CLEAR, DAN ELEGANKAN! DILARANG KERAS MENJAWAB DALAM BAHASA INGGRIS!
2. ATURAN ANTI-REPETISI & RINGKAS: DILARANG KERAS MEMBUAT SEKSI BERULANG ATAU MEMBUAT BEBERAPA TABEL KLASEMEN DENGAN DATA YANG SAMA! GABUNGKAN SELURUH DATA MENJADI SATU KARYA TABEL MAHKOTA RINGKAS UTUH!
3. DILARANG MEMBUAT PARAGRAF PANJANG LEBAR JIKA PENGGUNA HANYA MEMINTA KLASEMEN ATAU JADWAL!
4. HAPUS 100% SEMUA SITASI ANGKA MENTAH seperti [[1, 2]], [[12, 23]], [1], [27], dll.
5. JIKA ADA DATA ANGKA / KURS / STATISTIK: WAJIB SERTAKAN BLOK DIAGRAM ("chart") DISAMPING TABEL MARKDOWN!
6. WAJIB BUATKAN 1 TABEL MARKDOWN UTUH (| Header 1 | Header 2 |) yang simetris, rapi, dan berisi detail lengkap.
7. Format struktur laporan:
   - 📌 **Poin Penting Eksekutif** (Ringkasan fakta tebal 2 kalimat dari hasil pencarian)
   - 📊 **Tabel Ringkasan Klasemen / Jadwal Utama**
   - 📈 **Diagram Visualisasi Interactive** (Blok \`\`\`chart jika ada data statistik/poin)
   - 💡 **Catatan Ringkas**`
    },
    {
      role: 'user',
      content: `Pertanyaan Pengguna: ${userPrompt}\n\nData Mentah Hasil Pencarian:\n${rawSearchData}`
    }
  ];

  const targetModel = selectedModel && !selectedModel.toLowerCase().includes('you')
    ? selectedModel
    : (process.env.NEXT_PUBLIC_DEFAULT_MODEL || 'google/gemini-2.0-flash-exp:free');

  let fullText = '';
  try {
    const res = await fetchCompletionWithFallback(formatMessages, targetModel, orApiKey);
    if (res && res.ok) {
      fullText = await parseAndEnqueueStream(res, controller, encoder, decoder);
    }
  } catch (err) {
    console.error('LLM formatting failed:', err);
  }

  // 100% Guaranteed Non-Empty Fallback (Never leaves UI hanging on "Mencari informasi...")
  if (!fullText.trim()) {
    const fallbackNotice = `📌 **Ringkasan Informasi Web Terkini**\n\nBerikut adalah data hasil pencarian internet untuk: **${userPrompt}**\n\n${rawSearchData.substring(0, 1500)}`;
    controller.enqueue(encoder.encode(fallbackNotice));
    fullText = fallbackNotice;
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

            let searchKeyword = lastUserMessage.content;
            if (/vct|mpl|esports|jadwal|liga|standings|schedule|bracket|presiden/i.test(searchKeyword)) {
              searchKeyword += " Liquipedia match schedule standings";
            }
            const data = await safeFetchYouSearch(searchKeyword, ydcApiKey);
            
            let rawResultMarkdown = "";
            const hits = extractHitsFromYouData(data);

            if (hits && hits.length > 0) {
              hits.slice(0, 5).forEach((hit: any, idx: number) => {
                const snippetText = 
                  hit.contents?.markdown ||
                  hit.contents?.text ||
                  (Array.isArray(hit.snippets) && hit.snippets.length > 0 ? hit.snippets.join(' ') : '') ||
                  hit.snippet ||
                  hit.description ||
                  hit.content ||
                  hit.text ||
                  '';
                rawResultMarkdown += `[Data Sumber ${idx + 1}: ${hit.title || 'Sumber'} - ${hit.url || '#'}]\n${snippetText}\n\n`;
              });
            } else {
              rawResultMarkdown = data?.answer || "Tidak ada hasil instan spesifik dari pencarian.";
            }

            const formatted = await streamFormattedDataWithLLM(rawResultMarkdown, lastUserMessage.content, orApiKey || '', selectedModel, controller, encoder, decoder);
            accumulatedContent += formatted;
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
              const res = await fetch(`https://api.you.com/v1/search?query=${encodeURIComponent(lastUserMessage.content)}&country=ID&livecrawl=all&livecrawl_formats=markdown&crawl_timeout=30`, {
                headers: { 'X-API-Key': ydcApiKey }
              });
              if (res.ok) {
                const data = await res.json();
                const hits = extractHitsFromYouData(data);
                if (hits.length > 0) {
                  hits.slice(0, 8).forEach((hit: any) => {
                    const snippetText = 
                      hit.contents?.markdown ||
                      hit.contents?.text ||
                      (Array.isArray(hit.snippets) && hit.snippets.length > 0 ? hit.snippets.join(' ') : '') ||
                      hit.snippet ||
                      hit.description ||
                      hit.content ||
                      hit.text ||
                      '';
                    liveWebData += `[Sumber Web: ${hit.title || 'Berita Terkini'}] (${hit.url || '#'})\n${snippetText}\n\n`;
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
