import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import { StatusBadge } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

export default function IssueReturn() {
  const toast = useToast();
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState(null);
  const [unpaid, setUnpaid] = useState([]);
  const [settings, setSettings] = useState(null);
  const [memberId, setMemberId] = useState('');
  const [bookId, setBookId] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [m, b, active, returned, s] = await Promise.all([
        api.get('/members'), api.get('/books'), api.get('/loans?status=active'), api.get('/loans?status=returned'), api.get('/settings'),
      ]);
      setMembers(m); setBooks(b); setLoans(active); setSettings(s);
      setUnpaid(returned.filter((l) => l.fine > 0 && !l.finePaid));
      setMemberId((x) => x || m[0]?._id || '');
      setBookId((x) => x || b.find((k) => k.available > 0)?._id || '');
    } catch (e) { toast(e.message, 'err'); }
  };
  useEffect(() => { load(); }, []);

  const run = async (fn, okMsg) => {
    setBusy(true);
    try { const r = await fn(); if (okMsg) toast(typeof okMsg === 'function' ? okMsg(r) : okMsg); await load(); }
    catch (e) { toast(e.message, 'err'); }
    finally { setBusy(false); }
  };

  const issue = () => run(() => api.post('/loans/issue', { memberId, bookId }), 'Book issued ✅');

  const giveBack = (l) => {
    let collected = false;
    if (l.fine > 0) collected = window.confirm(`${l.late} din late — fine ₹${l.fine}.\n\nOK = fine abhi collect ho gaya\nCancel = fine baad mein lena hai (pending rahega)`);
    run(() => api.post(`/loans/${l._id}/return`, { collected }),
      (r) => `Book returned${r.fine ? ` — fine ₹${r.fine}` : ''}${r.notified ? ` · ${r.notified} ko reservation notification gaya` : ''}`);
  };

  return (
    <>
      <div className="page-head"><h2>🔁 Issue / Return</h2></div>

      <div className="card">
        <h3>Issue a book</h3>
        <div className="row">
          <div className="grow" style={{ flex: 1 }}>
            <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
              {members.map((m) => <option key={m._id} value={m._id}>{m.name}{m.status === 'Expired' ? ' (expired)' : ''}</option>)}
            </select>
          </div>
          <div className="grow" style={{ flex: 1.3 }}>
            <select value={bookId} onChange={(e) => setBookId(e.target.value)}>
              {books.map((b) => <option key={b._id} value={b._id} disabled={b.available === 0}>{b.title} ({b.available}/{b.copies}{b.available === 0 ? ' — reserve karein' : ''})</option>)}
            </select>
          </div>
          <button className="btn primary" disabled={busy || !memberId || !bookId} onClick={issue}>Issue</button>
        </div>
        {settings && <p className="muted" style={{ marginTop: 12, fontSize: 14 }}>Loan {settings.loanDays} days · fine ₹{settings.finePerDay}/day · max {settings.maxBooks} books per member</p>}
      </div>

      <div className="card">
        <h3>Active loans ({loans?.length ?? 0})</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Book</th><th>Member</th><th>Due</th><th>Status</th><th>Fine</th><th /></tr></thead>
            <tbody>
              {!loans && <tr><td colSpan="6" className="empty">Loading…</td></tr>}
              {loans && loans.length === 0 && <tr><td colSpan="6" className="empty">Nothing here yet.</td></tr>}
              {loans?.map((l) => (
                <tr key={l._id}>
                  <td><b>{l.book?.title}</b>{l.renewCount > 0 && <small>Renewed {l.renewCount}×</small>}</td>
                  <td>{l.member?.name}</td>
                  <td>{fmtDate(l.dueDate)}</td>
                  <td><StatusBadge status={l.status} /></td>
                  <td>{l.fine ? `₹${l.fine}` : '—'}</td>
                  <td><div className="actions">
                    <button className="btn sm" disabled={busy} onClick={() => run(() => api.post(`/loans/${l._id}/renew`), 'Renewed ✅')}>Renew</button>
                    <button className="btn sm primary" disabled={busy} onClick={() => giveBack(l)}>Return</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {unpaid.length > 0 && (
        <div className="card">
          <h3>Pending fines ({unpaid.length})</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Book</th><th>Member</th><th>Returned</th><th>Fine</th><th /></tr></thead>
              <tbody>
                {unpaid.map((l) => (
                  <tr key={l._id}>
                    <td><b>{l.book?.title}</b></td><td>{l.member?.name}</td><td>{fmtDate(l.returnDate)}</td>
                    <td style={{ color: 'var(--red)', fontWeight: 700 }}>₹{l.fine}</td>
                    <td><div className="actions"><button className="btn sm primary" disabled={busy} onClick={() => run(() => api.post(`/loans/${l._id}/pay-fine`), 'Fine collected ✅')}>Collect fine</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
