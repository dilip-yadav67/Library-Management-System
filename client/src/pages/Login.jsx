import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Login({ mode }) {
  const { login, signup } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState(mode === 'signup' ? 'signup' : 'login');
  const isSignup = tab === 'signup';
  const [form, setForm] = useState({ name: '', email: localStorage.getItem('lp_email') || '', password: '' });
  const [remember, setRemember] = useState(!!localStorage.getItem('lp_email'));
  const [show, setShow] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [slow, setSlow] = useState(false);

  // Render free plan par pehli request slow ho sakti hai
  useEffect(() => {
    if (!busy) { setSlow(false); return; }
    const t = setTimeout(() => setSlow(true), 4000);
    return () => clearTimeout(t);
  }, [busy]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const switchTab = (t) => { setTab(t); setErr(''); };
  const soon = () => toast('Ye feature jaldi aayega 🙂');

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      if (isSignup) await signup(form.name, form.email, form.password);
      else await login(form.email, form.password);
      if (remember) localStorage.setItem('lp_email', form.email);
      else localStorage.removeItem('lp_email');
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="au-bg">
      <div className="au-shell">
        {/* left panel */}
                {/* left panel */}
        <div className="au-left" aria-hidden="true" />
        

        {/* right panel */}
        <form className="au-right" onSubmit={submit}>
          <div className="au-tabs">
            <button type="button" className={!isSignup ? 'on' : ''} onClick={() => switchTab('login')}>👤 Sign In</button>
            <button type="button" className={isSignup ? 'on' : ''} onClick={() => switchTab('signup')}>➕ Sign Up</button>
          </div>

          <h3>{isSignup ? 'Create Your Account' : 'Sign In to Your Account'}</h3>
          <p className="sub">{isSignup ? 'Fill in the details to get started.' : 'Welcome back! Please enter your details.'}</p>

          {isSignup && (
            <div className="au-input">
              <span>🧑</span>
              <input placeholder="Full Name" value={form.name} onChange={set('name')} required />
            </div>
          )}
          <div className="au-input">
            <span>✉️</span>
            <input type="email" placeholder="Email Address" value={form.email} onChange={set('email')} required />
          </div>
          <div className="au-input">
            <span>🔒</span>
            <input type={show ? 'text' : 'password'} placeholder="Password" value={form.password} onChange={set('password')} minLength={6} required />
            <button type="button" className="eye" onClick={() => setShow(!show)} aria-label="Show password">{show ? '🙈' : '👁️'}</button>
          </div>

          {!isSignup && (
            <div className="au-row">
              <label><input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} /> Remember Me</label>
              <button type="button" className="link" onClick={soon}>Forgot Password?</button>
            </div>
          )}

          {err && <div className="alert">{err}</div>}
          {slow && <div className="hint">⏳ Server start ho raha hai (free hosting par 30-60 sec lag sakte hain)…</div>}

          <button className="au-submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignup ? '➜ Create Account' : '➜ Sign In'}
          </button>

          <div className="au-or"><i />or continue with<i /></div>
          <div className="au-social">
            <button type="button" onClick={soon} aria-label="Google">
              <svg width="22" height="22" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.7 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.4 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.7 2.3-7.7 2.3-6.3 0-11.7-4.1-13.6-9.8l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>
            </button>
            <button type="button" onClick={soon} aria-label="GitHub">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="#111"><path d="M12 .5a11.5 11.5 0 0 0-3.6 22.4c.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.200 1.8 1.200 1 1.800 2.800 1.300 3.400 1 .1-.8.400-1.300.7-1.600-2.600-.3-5.300-1.300-5.300-5.700 0-1.300.5-2.300 1.200-3.100-.1-.3-.5-1.500.1-3.100 0 0 1-.3 3.200 1.200a11 11 0 0 1 5.800 0c2.200-1.500 3.200-1.200 3.200-1.200.6 1.600.2 2.800.1 3.100.7.8 1.200 1.800 1.200 3.100 0 4.400-2.700 5.400-5.300 5.700.4.4.8 1.100.8 2.200v3.200c0 .3.2.7.8.6A11.500 11.500 0 0 0 12 .5z"/></svg>
            </button>
            <button type="button" onClick={soon} aria-label="Microsoft">
              <svg width="22" height="22" viewBox="0 0 24 24"><path fill="#F25022" d="M1 1h10v10H1z"/><path fill="#7FBA00" d="M13 1h10v10H13z"/><path fill="#00A4EF" d="M1 13h10v10H1z"/><path fill="#FFB900" d="M13 13h10v10H13z"/></svg>
            </button>
          </div>

          <p className="au-switch">
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button type="button" className="link" onClick={() => switchTab(isSignup ? 'login' : 'signup')}>
              {isSignup ? 'Sign In' : 'Sign Up'} ›
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}