import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import { useToast } from '../components/Toast.jsx';

function Bars({ items, green }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length) return <p className="muted">Abhi koi data nahi.</p>;
  return (
    <div className="bars">
      {items.map((i) => (
        <div key={i.name} className="bar-row">
          {i.name} <small>({i.count})</small>
          <div className={`bar ${green ? 'green' : ''}`}><i style={{ width: `${(i.count / max) * 100}%` }} /></div>
        </div>
      ))}
    </div>
  );
}

export default function Reports() {
  const toast = useToast();
  const [r, setR] = useState(null);
  const [ai, setAi] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  useEffect(() => { api.get('/reports').then(setR).catch((e) => toast(e.message, 'err')); }, []);
  if (!r) return <div className="loader">Loading reports…</div>;

  const summary = async () => {
    setAiBusy(true);
    try { setAi((await api.post('/ai/summary')).summary); } catch (e) { toast(e.message, 'err'); } finally { setAiBusy(false); }
  };
  const exportCsv = () => api.download('/reports/export.csv', 'library-report.csv').catch((e) => toast(e.message, 'err'));

  const maxM = Math.max(1, ...r.monthly.map((m) => Math.max(m.issued, m.returned)));
  const cards = [
    ['Total issues', r.totalIssues], ['Active loans', r.activeLoans], ['Overdue', r.overdue],
    ['Fines', `₹${r.finesTotal}`, `collected ₹${r.finesCollected} · pending ₹${r.finesPending}`],
  ];

  return (
    <>
      <div className="page-head">
        <h2>📊 Reports</h2>
        <div className="head-actions">
          <button className="btn" onClick={exportCsv}>⬇ Excel / CSV</button>
          <button className="btn" onClick={() => window.print()}>🖨 PDF / Print</button>
          <button className="btn primary" disabled={aiBusy} onClick={summary}>{aiBusy ? 'Thinking…' : '✨ AI summary'}</button>
        </div>
      </div>

      {ai && <div className="card ai-box"><h3>✨ AI summary</h3>{ai}</div>}

      <div className="stats" style={{ marginTop: ai ? 18 : 0 }}>
        {cards.map(([l, v, sub]) => (
          <div className="card" key={l}><small className="muted">{l}</small><b style={{ fontSize: 34, display: 'block' }}>{v}</b>{sub && <small className="muted">{sub}</small>}</div>
        ))}
      </div>

      <div className="cols" style={{ marginTop: 0 }}>
        <div className="card"><h3>Most issued books</h3><Bars items={r.mostIssued} /></div>
        <div className="card"><h3>Issues by category</h3><Bars items={r.byCategory} green /></div>
      </div>

      <div className="card">
        <h3>Monthly activity (last 6 months)</h3>
        <div className="vbars">
          {r.monthly.map((m) => (
            <div key={m.label} className="vbar" title={`Issued ${m.issued}, Returned ${m.returned}`}>
              <b>{m.issued}</b>
              <div style={{ height: `${(m.issued / maxM) * 100}%` }} />
              <span className="muted">{m.label}</span>
            </div>
          ))}
        </div>
        <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>Bars = books issued per month</p>
      </div>

      <div className="card">
        <h3>Overdue list</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Book</th><th>Member</th><th>Due</th><th>Late</th><th>Fine</th></tr></thead>
            <tbody>
              {r.overdueList.length === 0 && <tr><td colSpan="5" className="empty">Nothing here yet.</td></tr>}
              {r.overdueList.map((o) => (
                <tr key={o._id}><td><b>{o.book}</b></td><td>{o.member}</td><td>{fmtDate(o.dueDate)}</td><td>{o.late} din</td><td style={{ color: 'var(--red)', fontWeight: 700 }}>₹{o.fine}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
