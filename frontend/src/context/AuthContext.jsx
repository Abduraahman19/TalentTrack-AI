// context/AuthContext.js - Updated
import { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        navigate('/'); // Redirect to login if no token
        return;
      }

      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser({
        ...response.data.data.user,
        token
      });

      // If user is already on login page but has token, redirect to home
      if (window.location.pathname === '/') {
        navigate('/home');
      }
    } catch (error) {
      console.error('Error loading user:', error);
      localStorage.removeItem('token');
      setUser(null);
      navigate('/'); // Redirect to login on error
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (userData, token) => {
    localStorage.setItem('token', token);

    // Fetch complete user data with company details
    try {
      const response = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.data) {
        setUser({ ...response.data.data.user, token });
      } else {
        setUser({ ...userData, token });
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      setUser({ ...userData, token });
    }

    navigate('/home');
  }, [navigate]);

  const logout = useCallback(async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout', {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
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