import { useState, useEffect } from 'react';
import { db } from './supabase';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const storedUser = localStorage.getItem('hospital_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username: string): Promise<boolean> => {
    try {
      const { data, error } = await db.users.getByUsername(username);
      
      if (error || !data) {
        console.error('Login error:', error);
        return false;
      }

      if (!data.active) {
        console.error('User is inactive');
        return false;
      }

      const userData: User = {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        role: data.role,
        email: data.email
      };

      setUser(userData);
      localStorage.setItem('hospital_user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hospital_user');
  };

  return { user, loading, login, logout };
};
