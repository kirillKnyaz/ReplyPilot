import { createContext, useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import API from '../api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = (msg) => {
    localStorage.removeItem('token');
    setAuthenticated(false);
    setUser(null);
    navigate('/login', { state: { logoutMessage: 'Logged out successfully' } });
  };

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/auth/me');
      setUser(res.data);
      console.log('User authenticated:', res.data);
      setAuthenticated(true);
    } catch (err) {
      logout('Session expired. Please log in again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setAuthenticated(true);
      setUser(res.data.user);
      if (res.data && res.data.user && res.data.user.profile) {
        navigate('/');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      console.log('Login failed', err);
    }
  };

  useEffect(() => {
    checkAuth();
  }, [location]);

  return (
    <AuthContext.Provider value={{ user, authenticated, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}