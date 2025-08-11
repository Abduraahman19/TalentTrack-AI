import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refreshToken = useCallback(async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/auth/refresh', {}, {
        withCredentials: true
      });
      return response.data.token;
    } catch (error) {
      throw error;
    }
  }, []);

  const loadUser = useCallback(async () => {
    try {
      let token = localStorage.getItem('token');
      
      if (!token) {
        try {
          token = await refreshToken();
          localStorage.setItem('token', token);
        } catch {
          console.log('No valid session');
          return;
        }
      }

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Agar backend se data object aa raha hai to direct use karo
      const userData = response.data?.user || response.data;
      setUser({ ...userData, token });

    } catch (error) {
      console.error('Error loading user:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, [refreshToken]);

  useEffect(() => {
    loadUser();

    const interval = setInterval(async () => {
      try {
        const newToken = await refreshToken();
        localStorage.setItem('token', newToken);
        if (user) {
          setUser(prev => ({ ...prev, token: newToken }));
        }
      } catch (error) {
        console.log('Token refresh failed', error);
      }
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadUser, refreshToken, user]);

  const login = useCallback(async (userData, token) => {
    localStorage.setItem('token', token);
    setUser({ ...userData, token });
    navigate('/home');
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      navigate('/');
    }
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loadUser }}>
      {children}
    </AuthContext.Provider>
  );
};
