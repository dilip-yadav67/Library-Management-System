import { createContext, useContext, useEffect, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.get('/auth/me')
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const out = () => setUser(null);
    window.addEventListener('lp:logout', out);
    return () => window.removeEventListener('lp:logout', out);
  }, []);

  const authenticate = async (path, body) => {
    const d = await api.post(path, body);
    setToken(d.token);
    setUser(d.user);
  };

  const value = {
    user,
    loading,
    login: (email, password) => authenticate('/auth/login', { email, password }),
    signup: (name, email, password) => authenticate('/auth/signup', { name, email, password }),
    logout: () => { setToken(null); setUser(null); },
    setUser,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
