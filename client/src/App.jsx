import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Books from './pages/Books.jsx';
import Members from './pages/Members.jsx';
import IssueReturn from './pages/IssueReturn.jsx';
import Reservations from './pages/Reservations.jsx';
import Categories from './pages/Categories.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import AIAssistant from './pages/AIAssistant.jsx';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="splash">📖 LibraryPro loading…</div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login mode="login" />} />
      <Route path="/signup" element={user ? <Navigate to="/" replace /> : <Login mode="signup" />} />
      {user ? (
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/members" element={<Members />} />
          <Route path="/issue" element={<IssueReturn />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route path="*" element={<Navigate to="/login" replace />} />
      )}
    </Routes>
  );
}
