const router = require('express').Router();
const { wrap, bad } = require('../utils');
const { libraryContext } = require('../report');

const SYSTEM = `You are LibraryPro Assistant, built into a library management dashboard.
Answer ONLY from the library data given below. If something isn't in the data, say so.
Reply in the same language as the user (Hindi/Hinglish/English). Keep answers short and practical; use short bullet points when listing.`;

// Gemini pehle, na ho to Claude, dono na ho to basic mode
const provider = () => (process.env.GEMINI_API_KEY ? 'gemini' : process.env.ANTHROPIC_API_KEY ? 'claude' : null);

async function askGemini(system, messages) {
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
    }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'Gemini request failed');
  return (data.candidates?.[0]?.content?.parts || []).map((p) => p.text || '').join('').trim();
}

async function askClaude(system, messages) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model: process.env.AI_MODEL || 'claude-sonnet-5-5', max_tokens: 700, system, messages }),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data?.error?.message || 'AI request failed');
  return (data.content || []).map((c) => c.text || '').join('').trim();
}

const ask = (system, messages) => (provider() === 'gemini' ? askGemini(system, messages) : askClaude(system, messages));

// API key na ho (ya AI fail ho) to simple rule-based jawab
function fallback(ctx, q = '') {
  const t = q.toLowerCase();
  const { r } = ctx;
  if (/overdue|late|der|deadline/.test(t))
    return r.overdueList.length
      ? 'Overdue books:\n' + r.overdueList.map((x) => `• ${x.book} — ${x.member} (${x.late} din, ₹${x.fine})`).join('\n')
      : 'Abhi koi book overdue nahi hai. 👍';
  if (/fine|jurmana|penalty/.test(t)) return `Total fine ₹${r.finesTotal} — collected ₹${r.finesCollected}, pending ₹${r.finesPending}.`;
  if (/popular|most|zyada|top|padh/.test(t))
    return r.mostIssued.length ? 'Sabse zyada issue hui books:\n' + r.mostIssued.map((x) => `• ${x.name} (${x.count})`).join('\n') : 'Abhi tak koi book issue nahi hui.';
  if (/stock|available|khatam|out/.test(t))
    return ctx.outOfStock.length ? 'In books ki saari copies issued hain:\n' + ctx.outOfStock.map((x) => `• ${x}`).join('\n') : 'Sabhi books ki kam se kam 1 copy available hai.';
  return ctx.text + '\n\n(Tip: backend .env mein GEMINI_API_KEY ya ANTHROPIC_API_KEY daalne par yahan full AI jawab milenge.)';
}

router.post('/chat', wrap(async (req, res) => {
  const message = (req.body.message || '').trim();
  if (!message) return bad(res, 'Message likhein');
  const ctx = await libraryContext(req.uid);
  if (!provider()) return res.json({ reply: fallback(ctx, message), mode: 'basic' });

  let history = Array.isArray(req.body.history) ? req.body.history.slice(-6) : [];
  history = history.filter((m) => ['user', 'assistant'].includes(m.role) && m.content).map((m) => ({ role: m.role, content: String(m.content) }));
  while (history.length && history[0].role !== 'user') history.shift(); // Gemini/Claude dono user message se shuru hone chahiye
  try {
    const reply = await ask(`${SYSTEM}\n\nLIBRARY DATA:\n${ctx.text}`, [...history, { role: 'user', content: message }]);
    if (!reply) throw new Error('empty');
    res.json({ reply, mode: 'ai' });
  } catch (e) {
    console.error('AI error:', e.message);
    res.json({ reply: fallback(ctx, message), mode: 'basic' });
  }
}));

router.post('/summary', wrap(async (req, res) => {
  const ctx = await libraryContext(req.uid);
  if (!provider()) return res.json({ summary: fallback(ctx, ''), mode: 'basic' });
  try {
    const summary = await ask(`${SYSTEM}\n\nLIBRARY DATA:\n${ctx.text}`, [
      { role: 'user', content: 'Is library ki ek chhoti report summary likho: 3-5 bullet points mein highlights, problems (overdue/fine/stock) aur ek suggestion.' },
    ]);
    if (!summary) throw new Error('empty');
    res.json({ summary, mode: 'ai' });
  } catch (e) {
    console.error('AI error:', e.message);
    res.json({ summary: fallback(ctx, ''), mode: 'basic' });
  }
}));

module.exports = router;