import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';

const SUGGEST = ['Kaun si books overdue hain?', 'Total fine kitna hai?', 'Sabse popular books kaun si hain?', 'Kaun si books ka stock khatam hai?'];

export default function AIAssistant() {
  const toast = useToast();
  const [msgs, setMsgs] = useState([{ role: 'assistant', content: 'Namaste! 👋 Main aapki library ka data dekh kar jawab de sakta hoon — overdue, fine, popular books, stock, kuch bhi puchhiye.' }]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef(null);

  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, busy]);

  const send = async (message) => {
    const m = (message ?? text).trim();
    if (!m || busy) return;
    const history = msgs.slice(1);
    setMsgs((x) => [...x, { role: 'user', content: m }]);
    setText('');
    setBusy(true);
    try {
      const r = await api.post('/ai/chat', { message: m, history });
      setMsgs((x) => [...x, { role: 'assistant', content: r.reply }]);
    } catch (e) { toast(e.message, 'err'); } finally { setBusy(false); }
  };

  return (
    <>
      <div className="page-head"><h2>✨ AI Assistant</h2></div>
      <div className="card chat">
        <div className="msgs">
          {msgs.map((m, i) => <div key={i} className={`msg ${m.role}`}>{m.content}</div>)}
          {busy && <div className="msg">Soch raha hoon…</div>}
          <div ref={end} />
        </div>
        <div className="chips">
          {SUGGEST.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <div className="grow"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Library ke baare mein kuch bhi puchhein…" /></div>
          <button className="btn primary" disabled={busy}>Send</button>
        </form>
      </div>
    </>
  );
}
