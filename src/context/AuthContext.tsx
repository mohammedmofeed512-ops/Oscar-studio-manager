import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db as firestore } from '../firebase';
import { onAuthStateChanged, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firestoreService } from '@/services/firestoreService';

interface AuthContextType {
  user: string | null;
  role: 'admin' | 'team' | 'trainee' | 'partner' | null;
  userId: string | number | null;
  avatar: string | null;
  avatarIcon: string | null;
  login: (username: string, role: 'admin' | 'team' | 'trainee' | 'partner', id?: string | number) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  firebaseUser: any;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const MANAGERS = [
  'اسلام مفيد',
  'احمد حسن',
  'محمد مفيد'
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<string | null>(localStorage.getItem('studio_user'));
  const [role, setRole] = useState<'admin' | 'team' | 'trainee' | 'partner' | null>(
    localStorage.getItem('studio_role') as any
  );
  const [userId, setUserId] = useState<string | number | null>(() => {
    const id = localStorage.getItem('studio_user_id');
    return id ? (isNaN(Number(id)) ? id : parseInt(id)) : null;
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [avatarIcon, setAvatarIcon] = useState<string | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fUser) => {
      setFirebaseUser(fUser);
      setLoading(false);
    }, (error) => {
      console.error("Auth state change error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/login') {
      navigate('/login');
    }
    if (userId) {
      refreshProfile();
    }
  }, [user, location.pathname, userId, loading]);

  const refreshProfile = async () => {
    if (!userId) return;
    try {
      const data = await firestoreService.getById('team', userId.toString()) as any;
      if (data) {
        setAvatar(data.avatar || null);
        setAvatarIcon(data.avatar_icon || null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const login = (username: string, role: 'admin' | 'team' | 'trainee' | 'partner', id?: string | number) => {
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

  const logout = async () => {
    await signOut(auth);
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
    <AuthContext.Provider value={{ user, role, userId, avatar, avatarIcon, login, logout, refreshProfile, firebaseUser, loading }}>
      {!loading && children}
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
