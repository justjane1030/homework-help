// Netlify Function: holds the Gemini key server-side so the page never exposes it.
// Set GEMINI_API_KEY in Netlify > Site configuration > Environment variables.
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

// Tried in order; falls through to the next on busy/rate-limit/not-found.
const MODELS = ['gemini-flash-lite-latest','gemini-flash-latest'];
const MAX_B64 = 6 * 1024 * 1024; // ~4.5MB image cap, limits abuse

const QUIZ_PROMPT_HEAD = `Make a 5-question multiple-choice quick-check quiz for an elementary child, based ONLY on the worksheet data JSON below. Return ONLY a JSON object: {"quiz":[{"q":"question a child in this grade can read","choices":["A","B","C"],"answer":"must be EXACTLY one of the choices","say":""}]}. Use 2 or 3 choices, exactly ONE correct, kid-friendly wording, only facts from the data. Never make the correct answer obvious from the wording. "say" stays "" except for 'which word did you hear' questions. WORKSHEET DATA: `;

// Worksheet cache (Lever 3): the card for a worksheet Cue has already read is kept in
// Netlify Blobs (included free on every Netlify plan) keyed by the SHA-256 of the photo
// the browser sends. A repeat of the SAME photo file — e.g. the screenshot a teacher or
// parent shares in the class chat — is served instantly with no Google call at all.
// Photos of the same page taken by different phones hash differently and still go to
// Google; that is deliberate, because a fuzzy match could hand a child the wrong answers.
// Every cache call is wrapped so a cache problem can never break a scan.
function cacheStore() {
  try {
    const { getStore } = require('@netlify/blobs');
    return getStore('cue-worksheets');
  } catch (e) { return null; }
}
async function cacheGet(hash) {
  try {
    const store = cacheStore(); if (!store) return null;
    const hit = await store.get(hash, { type: 'json' });
    return (hit && hit.candidates) ? hit : null;
  } catch (e) { return null; }
}
const DAILY_GOOGLE_CAP = 500; // fresh Google calls per day, all parents combined
async function underDailyCap(day) {
  try {
    const store = cacheStore(); if (!store) return true; // no store -> never block scans
    const k = 'usage-' + day;
    const cur = await store.get(k, { type: 'json' });
    const n = (cur && typeof cur.count === 'number') ? cur.count : 0;
    if (n >= DAILY_GOOGLE_CAP) return false;
    await store.setJSON(k, { count: n + 1 });
    return true;
  } catch (e) { return true; }
}
async function cachePut(hash, geminiJson) {
  try {
    const store = cacheStore(); if (!store) return;
    await store.setJSON(hash, geminiJson);
  } catch (e) { /* cache is a bonus, never a blocker */ }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: { message: 'Server key not set' } }) };

  // Anonymous usage log: a random per-phone ID made in the browser (no name, email or photo).
  // Only a strict hex ID is accepted, so nothing else can be written into the logs.
  // Optional extras from the shared link: a group label (src) and a family code —
  // both strictly validated before they may enter the logs.
  // See it in Netlify > Logs > Functions > scan.
  const h = event.headers || {};
  const rawId = String(h['x-device-id'] || h['X-Device-Id'] || '');
  const device = /^[a-f0-9]{16,32}$/.test(rawId) ? rawId : 'unknown';
  const rawSrc = String(h['x-src'] || h['X-Src'] || '').toLowerCase();
  const src = /^[a-z0-9\-]{1,24}$/.test(rawSrc) ? rawSrc : '';
  const rawCode = String(h['x-family-code'] || h['X-Family-Code'] || '').toUpperCase();
  const code = /^[A-Z0-9\-]{4,24}$/.test(rawCode) ? rawCode : '';
  let req;
  try { req = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '{}' }; }

  // Quiz mode: text-only request built from an already-read worksheet (no photo, no cache).
  if (req.mode === 'quiz') {
    const qEntry = { event: 'quiz', device, day: new Date().toISOString().slice(0, 10) };
    if (src) qEntry.src = src;
    if (code) qEntry.code = code;
    console.log(JSON.stringify(qEntry));
    if (!req.card || typeof req.card !== 'object') return { statusCode: 400, body: '{}' };
    if (!(await underDailyCap(qEntry.day))) return { statusCode: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: { message: 'Cue has done a lot of reading today and is resting — please try again tomorrow!' } }) };
    const qBody = JSON.stringify({
      contents: [{ parts: [{ text: QUIZ_PROMPT_HEAD + JSON.stringify(req.card).slice(0, 12000) }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
    });
    let qLast = { statusCode: 502, body: JSON.stringify({ error: { message: 'No model answered' } }) };
    for (const model of MODELS) {
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key),
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: qBody });
        const text = await r.text();
        qLast = { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: text };
        if (r.ok) return qLast;
        if (![404, 429, 500, 503].includes(r.status)) return qLast;
      } catch (e) { qLast = { statusCode: 502, body: JSON.stringify({ error: { message: String(e.message || e) } }) }; }
    }
    return qLast;
  }

  const entry = { event: 'scan', device, day: new Date().toISOString().slice(0, 10) };
  if (src) entry.src = src;
  if (code) entry.code = code;
  console.log(JSON.stringify(entry));
  const { data, mime } = req;
  if (!data || typeof data !== 'string' || data.length > MAX_B64 || !/^image\//.test(mime || '')) {
    return { statusCode: 400, body: JSON.stringify({ error: { message: 'Bad image' } }) };
  }
  // Cache: has Cue already read this exact photo? Serve the saved answer instantly.
  const rawHash = String(h['x-image-hash'] || h['X-Image-Hash'] || '').toLowerCase();
  const imgHash = /^[a-f0-9]{64}$/.test(rawHash) ? rawHash : '';
  if (imgHash) {
    const hit = await cacheGet(imgHash);
    if (hit) {
      const hitEntry = { event: 'cache_hit', device, day: entry.day };
      if (src) hitEntry.src = src;
      if (code) hitEntry.code = code;
      console.log(JSON.stringify(hitEntry));
      return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'X-Cache': 'hit' }, body: JSON.stringify(hit) };
    }
  }
  if (!(await underDailyCap(entry.day))) {
    console.log(JSON.stringify({ event: 'daily_cap', device, day: entry.day }));
    return { statusCode: 429, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: { message: 'Cue has done a lot of reading today and is resting — please try again tomorrow!' } }) };
  }
  // Textbook pages (e.g. Big Ideas Learning) trip Gemini's RECITATION filter when the
  // prompt asks for the text word-for-word: Google answers 200 with an empty,
  // filtered response, which parents see as "could not read this page". So a scan
  // that comes back filtered is retried with a restate instruction — same numbers,
  // names and questions, in the model's own words — which passes the filter.
  const RESTATE_NOTE = '\n\nIMPORTANT OVERRIDE: Do NOT quote the page word-for-word. Restate every problem, question and passage in your own words, keeping all numbers, names and what is being asked exactly the same, so each problem can still be solved and answered the same way.';
  const mkBody = (promptText) => JSON.stringify({
    contents: [{ parts: [{ text: promptText }, { inline_data: { mime_type: mime, data } }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' }
  });
  const extractText = (t) => {
    try {
      const j = JSON.parse(t);
      const c = (j.candidates || [])[0] || {};
      const parts = (c.content && c.content.parts) || [];
      return parts.map(p => p.text || '').join('');
    } catch (e) { return ''; }
  };
  let last = { statusCode: 502, body: JSON.stringify({ error: { message: 'No model answered' } }) };
  let sawFilterBlock = false;
  for (const promptText of [PROMPT, PROMPT + RESTATE_NOTE]) {
    for (const model of MODELS) {
      try {
        const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key),
          { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: mkBody(promptText) });
        const text = await r.text();
        last = { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: text };
        if (r.ok) {
          if (extractText(text)) {
            if (imgHash) { try { await cachePut(imgHash, JSON.parse(text)); } catch (e) {} }
            return last;
          }
          sawFilterBlock = true; // 200 but empty/filtered (RECITATION): try next model, then restated prompt
          continue;
        }
        if (![404, 429, 500, 503].includes(r.status)) return last; // real error (bad request/key): stop
      } catch (e) { last = { statusCode: 502, body: JSON.stringify({ error: { message: String(e.message || e) } }) }; }
    }
  }
  if (sawFilterBlock) {
    return { statusCode: 422, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: { message: 'Google blocked this page: it looks like a printed textbook page, and Google will not read those out. Try photographing one problem at a time.' } }) };
  }
  return last;
};
