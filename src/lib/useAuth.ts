import { useState, useEffect } from 'react';
import { db } from './supabase';

interface User {
  id: string;
  username: string;
  fullName: string;
  role: string;
  email: string;
  permissions: string[];
}

// Map module IDs to permission names that are stored in database
const MODULE_PERMISSION_MAP: Record<string, string[]> = {
  'dashboard': ['all'], // Everyone can see dashboard
  'patients': ['Patient Registration'],
  'opd': ['OPD Management', 'OPD Token Generation'],
  'admission': ['Admission Management'],
  'discharge': ['Discharge Patients', 'Admission Management'],
  'lab': ['Lab Management', 'Lab Order Processing', 'Lab Order Creation'],
  'doctors': ['Doctor Management'],
  'rooms': ['System Settings', 'Admission Management'],
  'departments': ['System Settings'],
  'labtests': ['Lab Test Management', 'System Settings'],
  'users': ['User Management']
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (stored in localStorage)
    const storedUser = localStorage.getItem('hospital_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('hospital_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
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

      // Check password
      const storedPassword = data.password || 'password123'; // Default password if not set
      
      if (password !== storedPassword) {
        console.error('Invalid password');
        return false;
      }

      const userData: User = {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        role: data.role,
        email: data.email,
        permissions: data.permissions || []
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

  const hasPermission = (moduleId: string): boolean => {
    if (!user) return false;
    
    // Dashboard is accessible to everyone
    if (moduleId === 'dashboard') return true;
    
    // Get required permissions for this module
    const requiredPermissions = MODULE_PERMISSION_MAP[moduleId] || [];
    
    // If no permissions defined, deny access
    if (requiredPermissions.length === 0) return false;
    
    // Check if user has ANY of the required permissions for this module
    return requiredPermissions.some(reqPerm => 
      user.permissions.includes(reqPerm)
    );
  };

  return { user, loading, login, logout, hasPermission };
};
