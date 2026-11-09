// Netlify Function: holds the Gemini key server-side so the page never exposes it.
// Set GEMINI_API_KEY in Netlify > Site configuration > Environment variables.
const PROMPT = `You are reading a photo of a child's ELEMENTARY homework worksheet (US grades K-3, Florida).
Return ONLY a JSON object, no markdown, no commentary. Choose the ONE type that best fits.

TYPE 1 — WORD LIST / spelling / phonics (a list of words to spell or sound out):
{"type":"word","sound":"short u | long a | '' if none stated","spell":["every spelling/decodable word exactly as printed"],"sight":["high-frequency / 'words to know' words"],"vocab":[{"word":"w","meaning":"kid-friendly meaning"}]}

TYPE 2 — READING passage with questions (a story PLUS comprehension or phonics questions, e.g. "circle short-u words", "who are the characters", story map):
{"type":"story","title":"title if any","story":"EVERY sentence of the passage, one per line, \\n separated, nothing skipped","questions":[{"q":"each question exactly as printed","answer":"the CORRECT answer to this question, taken from the story (for 'circle the short-u words' list the actual words; for a comprehension question give the real answer, not a hint)","cue":"ONE short clue a parent can give to guide the child without handing over the answer"}],"sound":"a phonics sound the questions ask about, e.g. 'short u', else ''"}

TYPE 3 — MATH worksheet (multiplication, factors, tables, number problems):
{"type":"math","topic":"short topic, e.g. 'missing factors & multiplication'","problems":[{"q":"the question text as printed","answer":"the correct answer","how":"ONE short plain-English way a parent can guide the child to it, no jargon"}]}

QUIZ (for ALL types): also add a top-level key "quiz" with 5 short, fun, kid-friendly multiple-choice questions that check whether the child really learned what THIS worksheet taught (word meanings, the phonics sound, who/where/what happened in the story, the order of events, or the math idea). Each item: {"q":"question a 3rd grader can read","choices":["A","B","C"],"answer":"must be EXACTLY one of the choices","say":"optional: one word to read aloud, only for 'which word did you hear' questions, else ''"}. Use 2 or 3 choices, exactly ONE correct. Use only facts that are on the worksheet. Never make the correct answer obvious from the wording.

Rules: copy text EXACTLY as printed. Do NOT invent content. If a field is unknown use "" or []. For a reading passage, include the COMPLETE story text, not just the lines the questions touch, AND give the real correct answer to every question (never a hint in place of the answer). For math, solve each problem correctly and give a parent-friendly 'how', not just the answer.`;

// Tried in order; falls through to the next on busy/rate-limit/not-found.
const MODELS = ['gemini-flash-lite-latest','gemini-flash-latest'];
const MAX_B64 = 6 * 1024 * 1024; // ~4.5MB image cap, limits abuse

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { statusCode: 500, body: JSON.stringify({ error: { message: 'Server key not set' } }) };
  let req;
  try { req = JSON.parse(event.body || '{}'); } catch (e) { return { statusCode: 400, body: '{}' }; }
  const { data, mime } = req;
  if (!data || typeof data !== 'string' || data.length > MAX_B64 || !/^image\//.test(mime || '')) {
    return { statusCode: 400, body: JSON.stringify({ error: { message: 'Bad image' } }) };
  }
  const body = JSON.stringify({
    contents: [{ parts: [{ text: PROMPT }, { inline_data: { mime_type: mime, data } }] }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' }
  });
  let last = { statusCode: 502, body: JSON.stringify({ error: { message: 'No model answered' } }) };
  for (const model of MODELS) {
    try {
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + encodeURIComponent(key),
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      const text = await r.text();
      last = { statusCode: r.status, headers: { 'Content-Type': 'application/json' }, body: text };
      if (r.ok) return last;
      if (![404, 429, 500, 503].includes(r.status)) return last; // real error (bad request/key): stop
    } catch (e) { last = { statusCode: 502, body: JSON.stringify({ error: { message: String(e.message || e) } }) }; }
  }
  return last;
};
