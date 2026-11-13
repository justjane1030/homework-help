// Cloudflare Pages Function: backup host for Homework Captain.
// Holds the Gemini key server-side (env.GEMINI_API_KEY, set as an encrypted
// secret in the Pages project) so the page never exposes it.
// Behavior mirrors the Netlify scan function: quiz mode, worksheet scans,
// model fall-through, a restate retry when Google filters a printed page,
// an optional KV-backed worksheet cache + daily cap (binding HC_KV).
// Without the KV binding everything fails open, exactly like the Netlify
// version does when its store is unavailable: scans are never blocked by
// a storage problem.

const PROMPT = `You are reading a photo of a child's ELEMENTARY homework worksheet (US grades K-5, Florida public school: Florida B.E.S.T. standards for reading/ELA and math, Florida NGSSS for science).
Return ONLY a JSON object, no markdown, no commentary. Choose the ONE type that best fits.
ALWAYS include a top-level "grade": the grade level as "K","1","2","3","4" or "5" if it is printed or clearly implied by the work, else "".
Match the tips, words and quiz difficulty to that grade (e.g. K-1: sounds, sight words, counting; 2-3: vowel teams, main idea, multiplication; 4-5: context clues, prefixes/suffixes, theme, text evidence, fractions, decimals, multi-digit math).

TYPE 1 — WORD LIST / spelling / phonics (a list of words to spell or sound out):
{"type":"word","sound":"short u | long a | '' if none stated","spell":["every spelling/decodable word exactly as printed"],"sight":["high-frequency / 'words to know' words"],"vocab":[{"word":"w","meaning":"kid-friendly meaning"}]}

TYPE 2 — READING passage with questions (a story PLUS comprehension or phonics questions, e.g. "circle short-u words", "who are the characters", story map):
{"type":"story","title":"title if any","story":"EVERY sentence of the passage, one per line, \\n separated, nothing skipped","questions":[{"q":"each question exactly as printed","answer":"the CORRECT answer to this question, taken from the story (for 'circle the short-u words' list the actual words; for a comprehension question give the real answer, not a hint)","cue":"ONE short clue a parent can give to guide the child without handing over the answer"}],"sound":"a phonics sound the questions ask about, e.g. 'short u', else ''"}

TYPE 3 — MATH worksheet (addition, subtraction, multiplication, division, fractions, decimals, measurement, number problems):
{"type":"math","topic":"short topic, e.g. 'missing factors & multiplication'","problems":[{"q":"the question text as printed","answer":"the correct answer","start":"the FIRST question the parent asks, written as the parent's exact words, warm and simple, never giving the answer","steps":["step 1: exact words the parent says or asks next","step 2","step 3 (3-4 steps total, each one short line of parent words, questions first; suggest drawing it, fingers, counters or a number line when that helps; never state the final answer)"],"stuck":"ONE smaller hint the parent can give if the child is stuck, exact words","check":"ONE question to ask at the end so the child explains WHY the answer works, exact words"}]} For math, coach the parent like the reading cards do: deep, patient guidance in plain words a tired parent can just read aloud — Florida B.E.S.T. methods (equal groups, arrays, bar models, number lines) without naming the jargon.

TYPE 4 — SCIENCE worksheet (plants, animals, weather, matter, forces, Earth and space, life cycles, experiments, diagrams to label):
{"type":"science","topic":"short topic, e.g. 'states of matter'","passage":"any reading text on the page, one sentence per line, \\n separated, else ''","vocab":[{"word":"science word on the page","meaning":"kid-friendly meaning"}],"questions":[{"q":"each question or label task exactly as printed","answer":"the CORRECT answer","cue":"ONE short clue that gets the child thinking, e.g. 'What happens to ice on a hot day?'"}],"tryit":"ONE quick, safe at-home activity with household items that shows the same idea (needs a grown-up, no heat, sharp tools or chemicals)"}

Rules: copy text EXACTLY as printed. Do NOT invent content. If a field is unknown use "" or []. For a reading passage, include the COMPLETE story text, not just the lines the questions touch, AND give the real correct answer to every question (never a hint in place of the answer). For math, solve each problem correctly and give a parent-friendly 'how', not just the answer.`;

const QUIZ_PROMPT_HEAD = `Make a 5-question multiple-choice quick-check quiz for an elementary child, based ONLY on the worksheet data JSON below. Return ONLY a JSON object: {"quiz":[{"q":"question a child in this grade can read","choices":["A","B","C"],"answer":"must be EXACTLY one of the choices","say":""}]}. Use 2 or 3 choices, exactly ONE correct, kid-friendly wording, only facts from the data. Never make the correct answer obvious from the wording. "say" stays "" except for 'which word did you hear' questions. WORKSHEET DATA: `;

const RESTATE_NOTE = '\n\nIMPORTANT OVERRIDE: Do NOT quote the page word-for-word. Restate every problem, question and passage in your own words, keeping all numbers, names and what is being asked exactly the same, so each problem can still be solved and answered the same way.';

const MODELS = ['gemini-flash-lite-latest', 'gemini-flash-latest'];
const MAX_B64 = 6 * 1024 * 1024;
const DAILY_GOOGLE_CAP = 500;
const REST_MESSAGE = 'Homework Captain has done a lot of reading today and is resting — please try again tomorrow!';

function json(status, obj, extraHeaders) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, extraHeaders || {})
  });
}

function kv(env) {
  try { return env && env.HC_KV ? env.HC_KV : null; } catch (e) { return null; }
}
async function cacheGet(env, hash) {
  try {
    const s = kv(env); if (!s) return null;
    const raw = await s.get('wx:' + hash);
    if (!raw) return null;
    const hit = JSON.parse(raw);
    return (hit && hit.candidates) ? hit : null;
  } catch (e) { return null; }
}
async function cachePut(env, hash, obj) {
  try {
    const s = kv(env); if (!s) return;
    await s.put('wx:' + hash, JSON.stringify(obj), { expirationTtl: 60 * 60 * 24 * 30 });
  } catch (e) { /* cache is a bonus, never a blocker */ }
}
async function underDailyCap(env, day) {
  try {
    const s = kv(env); if (!s) return true; // no store -> never block scans
    const k = 'usage-' + day;
    const cur = await s.get(k, { type: 'json' });
    const n = (cur && typeof cur.count === 'number') ? cur.count : 0;
    if (n >= DAILY_GOOGLE_CAP) return false;
    await s.put(k, JSON.stringify({ count: n + 1 }), { expirationTtl: 60 * 60 * 48 });
    return true;
  } catch (e) { return true; }
}

async function callGemini(key, bodyObj) {
  let last = { status: 502, text: JSON.stringify({ error: { message: 'No model answered' } }) };
  for (const model of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key),
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(bodyObj) });
      const text = await r.text();
      last = { status: r.status, text };
      if (r.ok) return last;
      if (![404, 429, 500, 503].includes(r.status)) return last;
    } catch (e) { last = { status: 502, text: JSON.stringify({ error: { message: String(e.message || e) } }) }; }
  }
  return last;
}

function extractText(t) {
  try {
    const j = JSON.parse(t);
    const c = (j.candidates || [])[0] || {};
    const parts = (c.content && c.content.parts) || [];
    return parts.map(p => p.text || '').join('');
  } catch (e) { return ''; }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const key = env && env.GEMINI_API_KEY;
  if (!key) return json(500, { error: { message: 'Server key not set' } });

  const h = request.headers;
  const rawId = String(h.get('x-device-id') || '');
  const device = /^[a-f0-9]{16,32}$/.test(rawId) ? rawId : 'unknown';
  const rawSrc = String(h.get('x-src') || '').toLowerCase();
  const src = /^[a-z0-9\-]{1,24}$/.test(rawSrc) ? rawSrc : '';
  const rawCode = String(h.get('x-family-code') || '').toUpperCase();
  const code = /^[A-Z0-9\-]{4,24}$/.test(rawCode) ? rawCode : '';
  const day = new Date().toISOString().slice(0, 10);

  let req;
  try { req = await request.json(); } catch (e) { return json(400, {}); }

  // Quiz mode: text-only, built from an already-read worksheet.
  if (req.mode === 'quiz') {
    const qEntry = { event: 'quiz', device, day };
    if (src) qEntry.src = src;
    if (code) qEntry.code = code;
    console.log(JSON.stringify(qEntry));
    if (!req.card || typeof req.card !== 'object') return json(400, {});
    if (!(await underDailyCap(env, day))) return json(429, { error: { message: REST_MESSAGE } });
    const out = await callGemini(key, {
      contents: [{ parts: [{ text: QUIZ_PROMPT_HEAD + JSON.stringify(req.card).slice(0, 12000) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    });
    return new Response(out.text, { status: out.status, headers: { 'Content-Type': 'application/json' } });
  }

  const entry = { event: 'scan', device, day };
  if (src) entry.src = src;
  if (code) entry.code = code;
  console.log(JSON.stringify(entry));

  const { data, mime } = req;
  if (!data || typeof data !== 'string' || data.length > MAX_B64 || !/^image\//.test(mime || '')) {
    return json(400, { error: { message: 'Bad image' } });
  }

  const rawHash = String(h.get('x-image-hash') || '').toLowerCase();
  const imgHash = /^[a-f0-9]{64}$/.test(rawHash) ? rawHash : '';
  if (imgHash) {
    const hit = await cacheGet(env, imgHash);
    if (hit) {
      const hitEntry = { event: 'cache_hit', device, day };
      if (src) hitEntry.src = src;
      if (code) hitEntry.code = code;
      console.log(JSON.stringify(hitEntry));
      return json(200, hit, { 'X-Cache': 'hit' });
    }
  }

  if (!(await underDailyCap(env, day))) {
    console.log(JSON.stringify({ event: 'daily_cap', device, day }));
    return json(429, { error: { message: REST_MESSAGE } });
  }

  const mkBody = (promptText) => ({
    contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mime, data } }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' }
  });

  let last = { status: 502, text: JSON.stringify({ error: { message: 'No model answered' } }) };
  let sawFilterBlock = false;
  for (const promptText of [PROMPT, PROMPT + RESTATE_NOTE]) {
    const out = await callGemini(key, mkBody(promptText));
    last = out;
    if (out.status >= 200 && out.status < 300) {
      if (extractText(out.text)) {
        if (imgHash) { try { await cachePut(env, imgHash, JSON.parse(out.text)); } catch (e) {} }
        return new Response(out.text, { status: out.status, headers: { 'Content-Type': 'application/json' } });
      }
      sawFilterBlock = true; // 200 but empty/filtered (RECITATION): retry with restated prompt
      continue;
    }
    if (![404, 429, 500, 503].includes(out.status)) break; // real error: stop
  }
  if (sawFilterBlock) {
    return json(422, { error: { message: 'Google blocked this page: it looks like a printed textbook page, and Google will not read those out. Try photographing one problem at a time.' } });
  }
  return new Response(last.text, { status: last.status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequest(context) {
  if (context.request.method !== 'POST') return new Response('POST only', { status: 405 });
  return onRequestPost(context);
}
