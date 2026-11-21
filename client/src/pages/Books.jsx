import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import Modal, { Field } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

const EMPTY = { title: '', author: '', isbn: '', category: '', copies: 1, shelf: '', cover: '' };

export default function Books() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const [cat, setCat] = useState('');
  const [books, setBooks] = useState(null);
  const [cats, setCats] = useState([]);
  const [form, setForm] = useState(null); // null = modal band
  const [busy, setBusy] = useState(false);

  // top search bar se URL ?q= badle to yahan sync
  useEffect(() => { setQ(params.get('q') || ''); }, [params]);

  const load = () =>
    api.get(`/books?q=${encodeURIComponent(q)}${cat ? `&category=${cat}` : ''}`).then(setBooks).catch((e) => toast(e.message, 'err'));

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [q, cat]);

  useEffect(() => { api.get('/categories').then(setCats).catch(() => {}); }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...form, copies: Number(form.copies) };
      if (form._id) await api.put(`/books/${form._id}`, body);
      else await api.post('/books', body);
      toast(form._id ? 'Book updated' : 'Book added');
      setForm(null);
      load();
    } catch (e2) {
      toast(e2.message, 'err');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (b) => {
    if (!window.confirm(`"${b.title}" delete karein?`)) return;
    try { await api.del(`/books/${b._id}`); toast('Book deleted'); load(); } catch (e) { toast(e.message, 'err'); }
  };

  const edit = (b) => setForm({ ...b, category: b.category?._id || '' });

  return (
    <>
      <div className="page-head">
        <h2>📚 Books</h2>
        <button className="btn primary" onClick={() => setForm({ ...EMPTY, category: cats[0]?._id || '' })}>+ Add book</button>
      </div>

      <div className="card">
        <div className="row" style={{ marginBottom: 16 }}>
          <div className="grow" style={{ flex: 2 }}>
            <input placeholder="Search title, author, ISBN" value={q} onChange={(e) => { setQ(e.target.value); if (params.get('q')) setParams({}); }} />
          </div>
          <div className="grow">
            <select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">All categories</option>
              {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>

        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Author</th><th>Category</th><th>Available</th><th>Shelf</th><th /></tr></thead>
            <tbody>
              {!books && <tr><td colSpan="6" className="empty">Loading…</td></tr>}
              {books && books.length === 0 && <tr><td colSpan="6" className="empty">Koi book nahi mili.</td></tr>}
              {books?.map((b) => (
                <tr key={b._id}>
                  <td>
                    <div className="book-cell">
                      {b.cover ? <img className="cover" src={b.cover} alt="" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <div className="cover">{b.title[0]}</div>}
                      <div>{b.title}{b.isbn && <small>ISBN {b.isbn}</small>}</div>
                    </div>
                  </td>
                  <td>{b.author}</td>
                  <td>{b.category?.name || '—'}</td>
                  <td>
                    <span className={`badge ${b.available > 0 ? 'green' : 'red'}`}>{b.available}/{b.copies}</span>
                    {b.available === 0 && <small>Issued</small>}
                  </td>
                  <td>{b.shelf || '—'}</td>
                  <td><div className="actions">
                    <button className="btn sm" onClick={() => edit(b)}>Edit</button>
                    <button className="btn sm danger" onClick={() => remove(b)}>Delete</button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form && (
        <Modal title={form._id ? 'Edit book' : 'Add book'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label="Title"><input value={form.title} onChange={set('title')} required /></Field>
            <Field label="Author"><input value={form.author} onChange={set('author')} required /></Field>
            <div className="grid2">
              <Field label="ISBN"><input value={form.isbn} onChange={set('isbn')} /></Field>
              <Field label="Category">
                <select value={form.category} onChange={set('category')}>
                  <option value="">— none —</option>
                  {cats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Copies"><input type="number" min="1" value={form.copies} onChange={set('copies')} required /></Field>
              <Field label="Shelf / Rack (e.g. R1-S2)"><input value={form.shelf} onChange={set('shelf')} /></Field>
            </div>
            <Field label="Cover image URL (optional)"><input value={form.cover} onChange={set('cover')} placeholder="https://..." /></Field>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
