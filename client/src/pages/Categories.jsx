import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Modal, { Field } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Categories() {
  const toast = useToast();
  const [cats, setCats] = useState(null);
  const [form, setForm] = useState(null); // { _id?, name }

  const load = () => api.get('/categories').then(setCats).catch((e) => toast(e.message, 'err'));
  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (form._id) await api.put(`/categories/${form._id}`, { name: form.name });
      else await api.post('/categories', { name: form.name });
      toast(form._id ? 'Category updated' : 'Category added');
      setForm(null);
      load();
    } catch (e2) { toast(e2.message, 'err'); }
  };

  const remove = async (c) => {
    if (!window.confirm(`"${c.name}" delete karein?`)) return;
    try { await api.del(`/categories/${c._id}`); toast('Category deleted'); load(); } catch (e) { toast(e.message, 'err'); }
  };

  return (
    <>
      <div className="page-head">
        <h2>🗂️ Categories</h2>
        <button className="btn primary" onClick={() => setForm({ name: '' })}>+ Add category</button>
      </div>
      {!cats && <div className="loader">Loading…</div>}
      <div className="cat-grid">
        {cats?.map((c) => (
          <div key={c._id} className="card">
            <h3>{c.name}</h3>
            <p className="muted" style={{ marginBottom: 14 }}>{c.books} {c.books === 1 ? 'book' : 'books'}</p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm" onClick={() => setForm({ _id: c._id, name: c.name })}>Edit</button>
              <button className="btn sm danger" onClick={() => remove(c)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {form && (
        <Modal title={form._id ? 'Edit category' : 'Add category'} onClose={() => setForm(null)}>
          <form onSubmit={save}>
            <Field label="Category name"><input autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></Field>
            <div className="modal-foot">
              <button type="button" className="btn" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
