import { useEffect, useState } from 'react';
import { api, fmtDate } from '../api.js';
import Modal, { Field } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Reservations() {
  const toast = useToast();
  const [list, setList] = useState(null);
  const [members, setMembers] = useState([]);
  const [books, setBooks] = useState([]);
  const [form, setForm] = useState(null);

  const load = () => api.get('/reservations').then(setList).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  const openForm = async () => {
    try {
      const [m, b] = await Promise.all([api.get('/members'), api.get('/books')]);
      const out = b.filter((x) => x.available === 0); // sirf wahi jo abhi issued hain
      setMembers(m); setBooks(out);
      setForm({ memberId: m[0]?._id || '', bookId: out[0]?._id || '' });
    } catch (e) { toast(e.message, 'err'); }
  };

  const save = async (e) => {
    e.preventDefault();
    try { await api.post('/reservations', form); toast('Book reserved 🎟️'); setForm(null); load(); }
    catch (e2) { toast(e2.message, 'err'); }
  };

  const cancel = async (r) => {
    if (!window.confirm('Reservation cancel karein?')) return;
    try { await api.put(`/reservations/${r._id}/cancel`); toast('Reservation cancelled'); load(); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <>
      <div className="page-head">
        <h2>🎟️ Reservations</h2>
        <button className="btn primary" onClick={openForm}>+ Reserve</button>
      </div>
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead><tr><th>Queue</th><th>Book</th><th>Member</th><th>Date</th><th>Status</th><th /></tr></thead>
            <tbody>
              {!list && <tr><td colSpan="6" className="empty">Loading…</td></tr>}
              {list && list.length === 0 && <tr><td colSpan="6" className="empty">Nothing here yet.</td></tr>}
              {list?.map((r) => (
                <tr key={r._id}>
                  <td>#{r.position}</td>
                  <td><b>{r.book?.title}</b></td>
                  <td>{r.member?.name}</td>
                  <td>{fmtDate(r.createdAt)}</td>
                  <td>{r.status === 'ready'
                    ? <span className="badge green">Ready — issue kar do</span>
                    : <span className="badge orange">Waiting</span>}</td>
                  <td><div className="actions"><button className="btn sm danger" onClick={() => cancel(r)}>Cancel</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <Modal title="Reserve a book" onClose={() => setForm(null)}>
          {books.length === 0 ? (
            <p className="muted">Abhi saari books available hain, reservation ki zaroorat nahi. Seedha Issue karein.</p>
          ) : (
            <form onSubmit={save}>
              <Field label="Book (abhi issued)">
                <select value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
                  {books.map((b) => <option key={b._id} value={b._id}>{b.title}</option>)}
                </select>
              </Field>
              <Field label="Member">
                <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
                  {members.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </Field>
              <div className="modal-foot">
                <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
                <button className="btn primary">Reserve</button>
              </div>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
