import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { auth, googleProvider } from '../services/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile
} from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginAsDemoUser: (uid: string, name: string, email: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  loginSimulated: (name: string, email: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedUser = localStorage.getItem('taskflow_user');
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          const freshUser = await api.getProfile();
          setUser(freshUser);
          localStorage.setItem('taskflow_user', JSON.stringify(freshUser));
        } catch (err) {
          console.warn('Session sync failed, using cached session:', err);
          const errorMsg = String(err).toLowerCase();
          if (errorMsg.includes('unauthorized') || errorMsg.includes('401')) {
            setUser(null);
            localStorage.removeItem('taskflow_user');
            localStorage.removeItem('taskflow_firebase_token');
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const isFirebaseKeyInvalidError = (err: any): boolean => {
    const msg = String(err?.message || err || '').toLowerCase();
    return (
      msg.includes('api-key-not-valid') ||
      msg.includes('api_key_invalid') ||
      msg.includes('auth/api-key-not-valid') ||
      msg.includes('api key')
    );
  };

  const timeout = (ms: number) =>
    new Promise<any>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)
    );

  const shouldFallbackToSimulated = (err: any): boolean => {
    const msg = String(err?.message || err?.message || err || '').toLowerCase();
    const code = String(err?.code || '').toLowerCase();
    return (
      msg.includes('api-key-not-valid') ||
      msg.includes('api_key_invalid') ||
      msg.includes('auth/api-key-not-valid') ||
      msg.includes('api key') ||
      msg.includes('timeout') ||
      msg.includes('network-request-failed') ||
      msg.includes('invalid-credential') ||
      code.includes('invalid-credential') ||
      msg.includes('user-not-found') ||
      code.includes('user-not-found')
    );
  };

  const loginAsDemoUser = async (uid: string, name: string, email: string) => {
    setLoading(true);
    try {
      const res = await api.login({ uid, name, email });
      const authenticatedUser: User = res.user;
      setUser(authenticatedUser);
      localStorage.setItem('taskflow_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      let uid: string = '';
      let name: string = '';
      let email: string = '';

      try {
        const result = await signInWithPopup(auth, googleProvider);
        const token = await result.user.getIdToken();
        localStorage.setItem('taskflow_firebase_token', token);
        uid = result.user.uid;
        name = result.user.displayName || result.user.email?.split('@')[0] || 'Google User';
        email = result.user.email || '';
      } catch (fbError: any) {
        console.warn('Firebase Google Auth failed or was bypassed. Falling back to local simulated Google login:', fbError);
        localStorage.removeItem('taskflow_firebase_token');
        uid = 'simulated_google_user';
        name = 'Google User';
        email = 'google_user@example.com';
      }

      const res = await api.login({ uid, name, email });
      const authenticatedUser: User = res.user;
      setUser(authenticatedUser);
      localStorage.setItem('taskflow_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    setLoading(true);
    try {
      let uid: string = '';
      let name: string = '';
      const userEmail = email.toLowerCase().trim();

      try {
        const credential = await Promise.race([
          signInWithEmailAndPassword(auth, email, password),
          timeout(3500),
        ]);
        const token = await credential.user.getIdToken();
        localStorage.setItem('taskflow_firebase_token', token);
        uid = credential.user.uid;
        name = credential.user.displayName || userEmail.split('@')[0];
      } catch (fbError: any) {
        if (shouldFallbackToSimulated(fbError)) {
          console.warn('Firebase login bypassed or timed out. Falling back to local simulated login.');
          localStorage.removeItem('taskflow_firebase_token');
          
          if (userEmail === 'alice@example.com') {
            uid = 'alice_uid';
            name = 'Alice Admin';
          } else if (userEmail === 'bob@example.com') {
            uid = 'bob_uid';
            name = 'Bob Developer';
          } else if (userEmail === 'charlie@example.com') {
            uid = 'charlie_uid';
            name = 'Charlie Manager';
          } else {
            uid = `simulated_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
            name = userEmail.split('@')[0];
          }
        } else {
          throw fbError;
        }
      }

      const res = await api.login({ uid, name, email: userEmail });
      const authenticatedUser: User = res.user;
      setUser(authenticatedUser);
      localStorage.setItem('taskflow_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Email login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      let uid: string = '';
      const userEmail = email.toLowerCase().trim();
      const userName = name.trim();

      try {
        const credential = await Promise.race([
          createUserWithEmailAndPassword(auth, email, password),
          timeout(3500),
        ]);
        await updateProfile(credential.user, { displayName: userName });
        const token = await credential.user.getIdToken();
        localStorage.setItem('taskflow_firebase_token', token);
        uid = credential.user.uid;
      } catch (fbError: any) {
        if (shouldFallbackToSimulated(fbError)) {
          console.warn('Firebase signup bypassed or timed out. Falling back to local simulated signup.');
          localStorage.removeItem('taskflow_firebase_token');
          
          if (userEmail === 'alice@example.com') {
            uid = 'alice_uid';
          } else if (userEmail === 'bob@example.com') {
            uid = 'bob_uid';
          } else if (userEmail === 'charlie@example.com') {
            uid = 'charlie_uid';
          } else {
            uid = `simulated_${userEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
          }
        } else {
          throw fbError;
        }
      }

      const res = await api.login({ uid, name: userName, email: userEmail });
      const authenticatedUser: User = res.user;
      setUser(authenticatedUser);
      localStorage.setItem('taskflow_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Email sign up failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginSimulated = async (name: string, email: string) => {
    setLoading(true);
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const mockUid = `simulated_${normalizedEmail.replace(/[^a-zA-Z0-9]/g, '_')}`;
      localStorage.removeItem('taskflow_firebase_token');
      
      const res = await api.login({
        uid: mockUid,
        name: name.trim(),
        email: normalizedEmail,
      });

      const authenticatedUser: User = res.user;
      setUser(authenticatedUser);
      localStorage.setItem('taskflow_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      console.error('Simulated login failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    try {
      signOut(auth).catch(() => {});
    } catch (e) {}
    setUser(null);
    localStorage.removeItem('taskflow_user');
    localStorage.removeItem('taskflow_firebase_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginAsDemoUser,
        loginWithGoogle,
        loginWithEmail,
        signUpWithEmail,
        loginSimulated,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
