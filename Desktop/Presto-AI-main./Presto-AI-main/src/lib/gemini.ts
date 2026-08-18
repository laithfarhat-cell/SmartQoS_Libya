import { PE_CODES, COMPENSATIONS, FORBIDDEN_CITIES } from './peData';

const STORAGE_KEY = 'prestoeat_gemini_key';
const ENV_KEY = (import.meta as any).env?.VITE_GEMINI_API_KEY as string | undefined;

export function getGeminiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ENV_KEY ?? '';
  } catch {
    return ENV_KEY ?? '';
  }
}

export function setGeminiKey(key: string): void {
  try {
    if (key) localStorage.setItem(STORAGE_KEY, key);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

// 1. فحص التحيات والرد السريع
const GREETINGS = [
  'مرحبا', 'مرحبتين', 'اهلين', 'أهلين', 'السلام عليكم', 'سلام', 'شن الجو', 
  'كيف حالك', 'شن اخبارك', 'صباح الخير', 'مساء الخير', 'welcome', 'hi', 'hello', 'hey', 'أهلا', 'اهلا'
];

export function isCasualGreeting(query: string): boolean {
  const clean = query.trim().toLowerCase();
  if (clean.length < 35 && GREETINGS.some((g) => clean.includes(g))) {
    return true;
  }
  return false;
}

// 2. محرك RAG المطور بنظام نقاط الترشيح (Scoring System)
const COMMON_STOP_WORDS = new Set(['طلب', 'طلبات', 'الطلب', 'الزبون', 'زبون', 'سائق', 'السائق', 'في', 'من', 'على', 'عن', 'هو', 'هل', 'كيف', 'ما', 'ماذا', 'لو']);

export function retrieveRAGContext(query: string): string {
  const q = query.toLowerCase().trim();

  if (isCasualGreeting(q)) return '';

  // فحص المدن الممنوعة
  const forbiddenMatch = FORBIDDEN_CITIES.filter((city) => q.includes(city.toLowerCase()));
  if (forbiddenMatch.length > 0) {
    return `[تحذير أمني - مدن ممنوعة]: المدن المذكورة (${forbiddenMatch.join('، ')}) ممنوع التعامل معها تماماً في بريستو. يجب إلغاء أي طلب فوراً.`;
  }

  // تقييم وتنقيتها لاستخراج الإجراء الأدق فقط
  const scoredPEs = PE_CODES.map((pe) => {
    let score = 0;
    const codeClean = pe.code.toLowerCase().replace('-', '');

    if (q.includes(pe.code.toLowerCase()) || q.includes(codeClean)) {
      score += 100; // مطابقة رمز الإجراء مباشرة
    }

    pe.keywords.forEach((kw) => {
      const kwClean = kw.toLowerCase();
      if (!COMMON_STOP_WORDS.has(kwClean) && q.includes(kwClean)) {
        score += 20; // مطابقة كلمة مفتاحية خاصة
      }
    });

    if (q.includes(pe.titleAr.toLowerCase())) score += 15;

    return { pe, score };
  })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  // جلب الإجراء الأفضل والوحيد فقط لمنع تكرار البيانات
  if (scoredPEs.length > 0) {
    const bestMatch = scoredPEs[0].pe;
    return `[إجراء رسمي - ${bestMatch.code}: ${bestMatch.titleAr}]\nالملخص: ${bestMatch.summary}\nخطوات التنفيذ:\n${bestMatch.details.map((d) => `• ${d}`).join('\n')}`;
  }

  // فحص التعويضات والمالية عند عدم مطابقة إجراء PE خاص
  if (['تعويض', 'مالية', 'تعويضات', 'فلوس', 'خصم', 'أرباح', 'عجز', '/المالية'].some((k) => q.includes(k))) {
    const compText = COMPENSATIONS.map((c) => `• ${c.label}: ${c.values}`).join('\n');
    return `[سياسة التعويضات والمالية الرسمية]:\n${compText}`;
  }

  return '';
}

// 3. تعليمات النظام
export const BASE_SYSTEM_PROMPT = `أنت "Presto AI"، وكيل العمليات الأقدم في منصة بريستو (Prestoeat) لتوصيل الطعام في ليبيا.

قواعد الرد:
1. التحدث باللهجة الليبية الأصيلة والودودة (مثل: "أهلين يا بطل"، "شن الجو"، "تفضل يا غالي").
2. في التحيات (مرحبا، السلام عليكم، welcome...): رحب بالمستخدم بلباقة واسأله كيف تساعده في بريستو دون عرض أي إجراءات.
3. في أسئلة العمليات: أجب فقط بخصوص الإجراء المحدد المرفق لك في سياق RAG وبشكل مختصر ومنظم. لا تجلب إجراءات أخرى لم يطلبها.
4. المواضيع الخارجية تماماً: اعتذر بلطف باللهجة الليبية وتجنب الإجابة عنها.`;

type GeminiMessage = { role: 'user' | 'model'; parts: { text: string }[] };

// 4. البث المباشر
export async function streamGeminiReply(
  history: { role: 'user' | 'assistant'; content: string }[],
  onToken: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const key = getGeminiKey();
  const lastUserMsg = [...history].reverse().find((m) => m.role === 'user')?.content ?? '';

  if (isCasualGreeting(lastUserMsg)) {
    const greetingReply = 'مرحبتين وأهلين بيك يا بطل! مرحباً بك في بريستو. شن الجو وكيف نقدر نساعدك اليوم في أي إجراء أو طلبية؟';
    for (const chunk of greetingReply.match(/.{1,3}/g) || [greetingReply]) {
      if (signal?.aborted) return;
      await new Promise((r) => setTimeout(r, 15));
      onToken(chunk);
    }
    return;
  }

  const ragContext = retrieveRAGContext(lastUserMsg);

  if (!key) {
    await localFallbackReply(history, onToken, signal);
    return;
  }

  const contents: GeminiMessage[] = history.map((m, idx) => {
    const isLast = idx === history.length - 1;
    let textContent = m.content;

    if (isLast && m.role === 'user' && ragContext) {
      textContent = `[السياق المسترجع - RAG]:\n${ragContext}\n\n[سؤال المستخدم]:\n${m.content}`;
    }

    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: textContent }],
    };
  });

  const model = 'gemini-1.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${key}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: BASE_SYSTEM_PROMPT }] },
        generationConfig: { temperature: 0.3, maxOutputTokens: 800 },
      }),
      signal,
    });

    if (!res.ok || !res.body) throw new Error(`Gemini HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (!payload || payload === '[DONE]') continue;
        try {
          const json = JSON.parse(payload);
          const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) onToken(text);
        } catch {}
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') return;
    await localFallbackReply(history, onToken, signal);
  }
}

// 5. المحرك الاحتياطي
async function localFallbackReply(
  history: { role: 'user' | 'assistant'; content: string }[],
  onToken: (chunk: string) => void,
  signal?: AbortSignal
): Promise<void> {
  const last = [...history].reverse().find((m) => m.role === 'user');
  const q = (last?.content ?? '').trim();

  const reply = buildFallbackReply(q);
  const tokens = reply.match(/.{1,3}/g) ?? [reply];
  for (const t of tokens) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 12));
    onToken(t);
  }
}

function buildFallbackReply(q: string): string {
  if (isCasualGreeting(q)) {
    return 'مرحبتين وأهلين بيك يا بطل! مرحباً بك في بريستو. شن الجو وكيف نقدر نساعدك اليوم؟';
  }

  const ragData = retrieveRAGContext(q);
  if (ragData) {
    return `تفضل يا غالي، الإجراء المعتمد لطلبك:\n\n${ragData}`;
  }

  return 'مرحبا معك Presto AI كيف يمكنني مساعدتك ؟ أعتذر منك يا غالي، الموضوع هذا خارج عن نطاق اختصاصي وصلاحياتي البرمجية، لكن نقدر نساعدك في أي إجراء يتعلق بطلبيات وعمليات بريستو!';
}