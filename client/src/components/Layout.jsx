import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { api } from '../api.js';

const NAV = [
  ['/', '🏠', 'Dashboard'],
  ['/books', '📚', 'Books'],
  ['/members', '👥', 'Members'],
  ['/issue', '🔁', 'Issue / Return'],
  ['/reservations', '🎟️', 'Reservations'],
  ['/categories', '🗂️', 'Categories'],
  ['/reports', '📊', 'Reports'],
  ['/settings', '⚙️', 'Settings'],
  ['/ai', '✨', 'AI Assistant'],
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [notes, setNotes] = useState([]);
  const [bell, setBell] = useState(false);
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');

  // page badalne par sidebar band + notifications refresh
  useEffect(() => {
    setOpen(false);
    setBell(false);
    api.get('/dashboard/notifications').then(setNotes).catch(() => {});
  }, [loc.pathname]);

  const toggleTheme = () => {
    const t = theme === 'light' ? 'dark' : 'light';
    setTheme(t);
    document.documentElement.dataset.theme = t;
    localStorage.setItem('lp_theme', t);
  };

  const search = (e) => {
    e.preventDefault();
    nav(`/books${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  const initials = (user?.name || 'A').split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="app">
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-logo">📖</div>
          <h1>LibraryPro</h1>
          <p>Manage • Organize • Grow</p>
        </div>
        <nav>
          {NAV.map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="ico">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="promo">
          <div style={{ fontSize: 30 }}>📚</div>
          <b>Knowledge</b>
          <span>Builds a Better Future</span>
        </div>
        <button className="nav-item plain" onClick={toggleTheme}>
          <span className="ico">{theme === 'light' ? '🌙' : '☀️'}</span>Toggle theme
        </button>
        <button className="nav-item plain" onClick={logout}>
          <span className="ico">🚪</span>Logout
        </button>
      </aside>

      <div className="main">
        <header className="topbar">
          <button className="hamburger" onClick={() => setOpen(true)} aria-label="Menu">☰</button>
          <form className="search" onSubmit={search}>
            <span>🔍</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search books, members..." />
          </form>
          <div className="top-right">
            <div className="bell-wrap">
              <button className="bell" onClick={() => setBell((b) => !b)} aria-label="Notifications">
                🔔{notes.length > 0 && <i>{notes.length}</i>}
              </button>
              {bell && (
                <div className="dropdown">
                  <h4>Notifications</h4>
                  {notes.length === 0 && <p className="muted pad">Sab theek hai, koi alert nahi 🎉</p>}
                  {notes.map((n, i) => (
                    <div key={i} className="note">
                      <b>{n.type === 'overdue' ? '⚠️' : n.type === 'reservation' ? '🎟️' : '⏰'} {n.text}</b>
                      <small>{n.sub}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="user">
              <div className="avatar">{initials}</div>
              <span>{user?.name}</span>
            </div>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
        {loc.pathname !== '/ai' && (
          <button className="fab" onClick={() => nav('/ai')}>✨ Ask AI</button>
        )}
      </div>
    </div>
  );
}
