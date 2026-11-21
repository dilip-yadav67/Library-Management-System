import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmtDate, timeAgo } from '../api.js';
import { StatusBadge } from '../components/Modal.jsx';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
const ICONS = { book: '📗', member: '👤', issue: '📙', return: '🔁', renew: '♻️', reservation: '🎟️', fine: '💰', info: '✨' };

function Donut({ data }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const R = 70;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 200 200" width="180" height="180">
      <g transform="rotate(-90 100 100)">
        {total === 0 && <circle cx="100" cy="100" r={R} fill="none" stroke="var(--gray-bg)" strokeWidth="28" />}
        {data.map((x, i) => {
          const len = (C * x.value) / total;
          const el = (
            <circle key={x.name} cx="100" cy="100" r={R} fill="none" stroke={COLORS[i % COLORS.length]} strokeWidth="28"
              strokeDasharray={`${len} ${C - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </g>
      <text x="100" y="102" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--text)">{total}</text>
      <text x="100" y="122" textAnchor="middle" fontSize="12" fill="var(--muted)">Total Books</text>
    </svg>
  );
}

function LineChart({ data }) {
  const W = 320, H = 170, pl = 30, pr = 12, pt = 14, pb = 26;
  const max = Math.max(4, ...data.map((d) => d.count));
  const top = Math.ceil(max / 2) * 2;
  const x = (i) => pl + (i * (W - pl - pr)) / (data.length - 1);
  const y = (v) => pt + (1 - v / top) * (H - pt - pb);
  const pts = data.map((d, i) => `${x(i)},${y(d.count)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pl} x2={W - pr} y1={y(top * t)} y2={y(top * t)} stroke="var(--border)" />
          <text x={pl - 6} y={y(top * t) + 4} textAnchor="end" fontSize="10" fill="var(--muted)">{Math.round(top * t)}</text>
        </g>
      ))}
      <polygon points={`${x(0)},${y(0)} ${pts} ${x(data.length - 1)},${y(0)}`} fill="rgba(59,130,246,.12)" />
      <polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="2.5" />
      {data.map((d, i) => (
        <g key={d.label}>
          <circle cx={x(i)} cy={y(d.count)} r="4" fill="#2563eb" />
          <text x={x(i)} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--muted)">{d.label}</text>
        </g>
      ))}
    </svg>
  );
}

function Calendar({ dueDates }) {
  const [cur, setCur] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const y = cur.getFullYear(), m = cur.getMonth();
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const due = new Set(dueDates.map((d) => { const x = new Date(d); return `${x.getFullYear()}-${x.getMonth()}-${x.getDate()}`; }));
  const cells = [...Array(first).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  return (
    <div className="cal">
      <div className="cal-head">
        <button className="btn ghost sm" onClick={() => setCur(new Date(y, m - 1, 1))}>‹</button>
        {cur.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        <button className="btn ghost sm" onClick={() => setCur(new Date(y, m + 1, 1))}>›</button>
      </div>
      <div className="cal-grid">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => <span key={d} className="dow">{d}</span>)}
        {cells.map((c, i) => {
          if (!c) return <span key={i} />;
          const isToday = c === today.getDate() && m === today.getMonth() && y === today.getFullYear();
          const has = due.has(`${y}-${m}-${c}`);
          return <span key={i} className={`${isToday ? 'today' : ''} ${has ? 'has' : ''}`}>{c}</span>;
        })}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const nav = useNavigate();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.get('/dashboard').then(setD).catch((e) => setErr(e.message)); }, []);
  if (err) return <div className="alert">{err}</div>;
  if (!d) return <div className="loader">Loading dashboard…</div>;

  const t = d.totals;
  const total = d.distribution.reduce((a, b) => a + b.value, 0);
  const stats = [
    ['Total Books', t.books, '📘', '#dbeafe', `${t.titles} titles`],
    ['Total Members', t.members, '👥', '#dcfce7', 'registered'],
    ['Issued Books', t.issued, '🔁', '#ede9fe', 'abhi bahar'],
    ['Due Returns', t.dueReturns, '🗓️', '#ffedd5', '3 din mein / overdue'],
  ];

  return (
    <>
      <section className="hero">
        <div>
          <h2>Welcome to<br />Library Management System</h2>
          <p>Discover • Borrow • Read • Repeat</p>
          <button className="btn" onClick={() => nav('/books')}>Explore Books →</button>
        </div>
        <div className="hero-art">📖📚</div>
      </section>

      <section className="stats">
        {stats.map(([label, val, ico, bg, sub]) => (
          <div key={label} className="card stat">
            <div className="ico" style={{ background: bg }}>{ico}</div>
            <div><small>{label}</small><b>{val}</b><small>{sub}</small></div>
          </div>
        ))}
      </section>

      <section className="dash-grid">
        <div className="card">
          <div className="card-head"><h3>📘 Books Overview</h3><Link to="/categories">View All →</Link></div>
          <div className="donut-wrap">
            <Donut data={d.distribution} />
            <div className="legend">
              {d.distribution.map((x, i) => (
                <span key={x.name}><i style={{ background: COLORS[i % COLORS.length] }} />{x.name}<b>{Math.round((x.value * 100) / total)}%</b></span>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>📈 Library Activity</h3><span className="muted">Last 4 weeks</span></div>
          <LineChart data={d.weekly} />
        </div>
        <div className="card">
          <div className="card-head"><h3>⚡ Recent Activity</h3></div>
          <div className="activity">
            {d.recentActivity.length === 0 && <span className="muted">Abhi koi activity nahi</span>}
            {d.recentActivity.map((a) => (
              <div className="act" key={a._id}>
                <div className="dot">{ICONS[a.type] || '✨'}</div>
                <div><b>{a.text}</b><small>{a.sub}</small></div>
                <time>{timeAgo(a.at)}</time>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dash-grid2">
        <div className="card">
          <div className="card-head"><h3>🧑‍🎓 Recently Issued Books</h3><Link to="/issue">View All →</Link></div>
          <div className="table-wrap">
            <table style={{ minWidth: 440 }}>
              <thead><tr><th>Book</th><th>Member</th><th>Due</th><th>Status</th></tr></thead>
              <tbody>
                {d.recentlyIssued.length === 0 && <tr><td colSpan="4" className="empty">Nothing issued yet.</td></tr>}
                {d.recentlyIssued.map((l) => (
                  <tr key={l._id}><td><b>{l.book?.title}</b></td><td>{l.member?.name}</td><td>{fmtDate(l.dueDate)}</td><td><StatusBadge status={l.status} /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>⏰ Upcoming Due Books</h3><Link to="/issue">View All →</Link></div>
          <div className="table-wrap">
            <table style={{ minWidth: 340 }}>
              <thead><tr><th>Book</th><th>Member</th><th>Due</th></tr></thead>
              <tbody>
                {d.upcomingDue.length === 0 && <tr><td colSpan="3" className="empty">No pending returns.</td></tr>}
                {d.upcomingDue.map((l) => (
                  <tr key={l._id}><td><b>{l.book?.title}</b></td><td>{l.member?.name}</td>
                    <td><span className={`badge ${l.status === 'overdue' ? 'red' : 'gray'}`}>{fmtDate(l.dueDate)}</span></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>📅 Calendar</h3></div>
          <Calendar dueDates={d.dueDates} />
        </div>
      </section>
    </>
  );
}
