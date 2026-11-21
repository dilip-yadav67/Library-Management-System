import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useToast } from '../components/Toast.jsx';

const SUGGEST = ['Which books are overdue?','What is the total fine amount?','Which books are the most popular?','Which books are out of stock?'];

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
          {busy && <div className="msg">Thinking...</div>}
          <div ref={end} />
        </div>
        <div className="chips">
          {SUGGEST.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
        </div>
        <form className="row" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <div className="grow"><input value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask anything about the library…" /></div>
          <button className="btn primary" disabled={busy}>Send</button>
        </form>
      </div>
    </>
  );
}
