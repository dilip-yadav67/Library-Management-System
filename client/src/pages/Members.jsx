import { useEffect, useState } from 'react';
import { api, fmtDate, isoDate } from '../api.js';
import Modal, { Field, StatusBadge } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

const nextYear = () => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return isoDate(d); };
const EMPTY = () => ({ name: '', email: '', phone: '', type: 'Student', expiry: nextYear() });

export default function Members() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [hist, setHist] = useState(null); // { member, loans }
  const [busy, setBusy] = useState(false);

  const load = () => api.get(`/members?q=${encodeURIComponent(q)}`).then(setList).catch((e) => toast(e.message, 'err'));
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (form._id) await api.put(`/members/${form._id}`, form);
      else await api.post('/members', form);
      toast(form._id ? 'Member updated' : 'Member registered');
      setForm(null);
      load();
    } catch (e2) { toast(e2.message, 'err'); } finally { setBusy(false); }
  };

  const remove = async (m) => {
    if (!window.confirm(`${m.name} ko delete karein?`)) return;
    try { await api.del(`/members/${m._id}`); toast('Member deleted'); load(); } catch (e) { toast(e.message, 'err'); }
  };

  const renew = async (m) => {
    try { await api.put(`/members/${m._id}`, { ...m, expiry: nextYear() }); toast('Membership 1 saal ke liye renew ho gayi'); load(); }
    catch (e) { toast(e.message, 'err'); }
  };

  const history = async (m) => {
    try { setHist({ member: m, loans: await api.get(`/members/${m._id}/history`) }); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <>
      <div className="page-head">
        <h2>👥 Members</h2>
        <button className="btn primary" onClick={() => setForm(EMPTY())}>+ Add member</button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}><input placeholder="Search name or email" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Member</th><th>Type</th><th>Status</th><th>Loans</th><th>Fine due</th><th /></tr></thead>
            <tbody>
              {!list && <tr><td colSpan="6" className="empty">Loading…</td></tr>}
              {list && list.length === 0 && <tr><td colSpan="6" className="empty">Koi member nahi mila.</td></tr>}
              {list?.map((m) => (
                <tr key={m._id}>
                  <td><b>{m.name}</b><small>{m.email}{m.phone ? ` · ${m.phone}` : ''}</small></td>
                  <td>{m.type}</td>
                  <td><span className={`badge ${m.status === 'Active' ? 'green' : 'red'}`}>{m.status}</span><small>till {isoDate(m.expiry)}</small></td>
                  <td>{m.activeLoans}</td>
                  <td style={{ color: m.fineDue > 0 ? 'var(--red)' : undefined, fontWeight: m.fineDue > 0 ? 700 : 400 }}>₹{m.fineDue}</td>
                  <td><div className="actions">
                    <button className="btn sm" onClick={() => history(m)}>History</button>
                    {m.status === 'Expired' && <button className="btn sm" onClick={() => renew(m)}>Renew</button>}
                    <button className="btn sm" onClick={() => setForm({ ...m, expiry: isoDate(m.expiry) })}>Edit</button>
                    <button className="btn sm danger" onClick={() => remove(m)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <Modal title={form._id ? 'Edit member' : 'Add member'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label="Full name"><input value={form.name} onChange={set('name')} required /></Field>
            <div className="grid2">
              <Field label="Email"><input type="email" value={form.email} onChange={set('email')} /></Field>
              <Field label="Phone"><input value={form.phone} onChange={set('phone')} /></Field>
              <Field label="Membership type">
                <select value={form.type} onChange={set('type')}>
                  <option>Student</option><option>Faculty</option><option>Public</option>
                </select>
              </Field>
              <Field label="Membership valid till"><input type="date" value={form.expiry} onChange={set('expiry')} required /></Field>
            </div>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {hist && (
        <Modal wide title={`${hist.member.name} — issue history`} onClose={() => setHist(null)}>
          <div className="table-wrap">
            <table style={{ minWidth: 520 }}>
              <thead><tr><th>Book</th><th>Issued</th><th>Due</th><th>Returned</th><th>Fine</th><th>Status</th></tr></thead>
              <tbody>
                {hist.loans.length === 0 && <tr><td colSpan="6" className="empty">Abhi tak koi book issue nahi hui.</td></tr>}
                {hist.loans.map((l) => (
                  <tr key={l._id}>
                    <td><b>{l.book?.title}</b></td><td>{fmtDate(l.issueDate)}</td><td>{fmtDate(l.dueDate)}</td>
                    <td>{fmtDate(l.returnDate)}</td><td>{l.fine ? `₹${l.fine}${l.returnDate && !l.finePaid ? ' (unpaid)' : ''}` : '—'}</td>
                    <td><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Modal>
      )}
    </>
  );
}
