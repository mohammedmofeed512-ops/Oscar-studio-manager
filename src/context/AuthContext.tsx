import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface AuthContextType {
  user: string | null;
  role: 'admin' | 'team' | 'trainee' | 'partner' | null;
  userId: number | null;
  avatar: string | null;
  avatarIcon: string | null;
  login: (username: string, role: 'admin' | 'team' | 'trainee' | 'partner', id?: number) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const MANAGERS = [
  'اسلام مفيد',
  'احمد حسن',
  'محمد مفيد'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(() => {
    return localStorage.getItem('studio_user');
  });
  const [role, setRole] = useState<'admin' | 'team' | 'trainee' | 'partner' | null>(() => {
    return localStorage.getItem('studio_role') as 'admin' | 'team' | 'trainee' | 'partner' | null;
  });
  const [userId, setUserId] = useState<number | null>(() => {
    const id = localStorage.getItem('studio_user_id');
    return id ? parseInt(id) : null;
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarIcon, setAvatarIcon] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!user && location.pathname !== '/login') {
      navigate('/login');
    }
    if (userId) {
      refreshProfile();
    }
  }, [user, location.pathname, userId]);

  const refreshProfile = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/team/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setAvatar(data.avatar || null);
        setAvatarIcon(data.avatar_icon || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const login = (username: string, role: 'admin' | 'team' | 'trainee' | 'partner', id?: number) => {
    setUser(username);
    setRole(role);
    if (id) setUserId(id);
    
    localStorage.setItem('studio_user', username);
    localStorage.setItem('studio_role', role);
    if (id) localStorage.setItem('studio_user_id', id.toString());
    
    if (role === 'team' || role === 'trainee') {
      navigate('/team-dashboard');
    } else if (role === 'partner') {
      navigate('/partner-dashboard');
    } else {
      navigate('/');
    }
  };

  const logout = () => {
    setUser(null);
    setRole(null);
    setUserId(null);
    setAvatar(null);
    setAvatarIcon(null);
    
    localStorage.removeItem('studio_user');
    localStorage.removeItem('studio_role');
    localStorage.removeItem('studio_user_id');
    
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, role, userId, avatar, avatarIcon, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
