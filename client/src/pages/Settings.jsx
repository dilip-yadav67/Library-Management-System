import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Field } from '../components/Modal.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Settings() {
  const toast = useToast();
  const { user, setUser } = useAuth();
  const [s, setS] = useState(null);
  const [name, setName] = useState(user?.name || '');
  const [pw, setPw] = useState({ current: '', next: '' });

  useEffect(() => { api.get('/settings').then(setS).catch((e) => toast(e.message, 'err')); }, []);
  if (!s) return <div className="loader">Loading…</div>;

  const saveRules = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', s);
      if (name.trim() && name.trim() !== user.name) setUser((await api.put('/auth/profile', { name })).user);
      toast('Settings saved ✅');
    } catch (e2) { toast(e2.message, 'err'); }
  };

  const changePw = async (e) => {
    e.preventDefault();
    try { await api.put('/auth/password', pw); setPw({ current: '', next: '' }); toast('Password change ho gaya ✅'); }
    catch (e2) { toast(e2.message, 'err'); }
  };

  const reset = async () => {
    if (!window.confirm('Saara data delete karke demo data wapas laayein? Ye undo nahi hoga.')) return;
    try { await api.post('/settings/reset-demo'); toast('Demo data reset ho gaya'); } catch (e) { toast(e.message, 'err'); }
  };

  const num = (k) => (e) => setS({ ...s, [k]: e.target.value });

  return (
    <>
      <div className="page-head"><h2>⚙️ Settings</h2></div>
      <div className="cols" style={{ marginTop: 0, alignItems: 'start' }}>
        <form className="card" onSubmit={saveRules} style={{ margin: 0 }}>
          <Field label="Admin name"><input value={name} onChange={(e) => setName(e.target.value)} required /></Field>
          <Field label="Loan period (days)"><input type="number" min="1" value={s.loanDays} onChange={num('loanDays')} required /></Field>
          <Field label="Fine per day (₹)"><input type="number" min="0" value={s.finePerDay} onChange={num('finePerDay')} required /></Field>
          <Field label="Max books per member"><input type="number" min="1" value={s.maxBooks} onChange={num('maxBooks')} required /></Field>
          <div className="row">
            <button className="btn primary">Save settings</button>
            <button type="button" className="btn danger" onClick={reset}>Reset demo data</button>
          </div>
        </form>

        <form className="card" onSubmit={changePw} style={{ margin: 0 }}>
          <h3>Change password</h3>
          <Field label="Current password"><input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required /></Field>
          <Field label="New password (min 6)"><input type="password" minLength={6} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required /></Field>
          <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>Logged in as {user.email}. Theme badalne ke liye sidebar mein "Toggle theme" dabayein.</p>
          <button className="btn primary">Update password</button>
        </form>
      </div>
    </>
  );
}
