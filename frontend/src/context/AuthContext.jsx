import { createContext, useContext, useEffect, useState } from 'react';
import api, { clearToken, getToken, setToken } from '../utils/api';

const AuthContext = createContext(null);

/**
 * Nyimpen user yang login + fungsi login/register/logout.
 * Pas app dibuka, kalo tab ini punya token (lihat getToken di utils/api.js), cek ke /auth/me.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearToken();
      setUser(null);
    };
    window.addEventListener('zenq:unauthorized', handleUnauthorized);

    if (!getToken()) {
      setLoading(false);
    } else {
      api.get('/auth/me')
        .then((res) => setUser(res.data))
        .catch(handleUnauthorized)
        .finally(() => setLoading(false));
    }

    return () => window.removeEventListener('zenq:unauthorized', handleUnauthorized);
  }, []);

  const saveSession = (res) => {
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const login = async (email, password) => saveSession(await api.post('/auth/login', { email, password }));

  const register = async (payload) => saveSession(await api.post('/auth/register', payload));

  const logout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
