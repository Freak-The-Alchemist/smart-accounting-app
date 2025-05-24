import { useState, useCallback } from 'react';
import { User } from 'firebase/auth';
import { auth } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
} from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: Error | null;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: auth.currentUser,
    loading: false,
    error: null,
  });

  const login = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      setState(prev => ({ ...prev, user: userCredential.user, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  const register = useCallback(async (email: string, password: string, userData: Omit<User, 'id'>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      setState(prev => ({ ...prev, user: userCredential.user, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await signOut(auth);
      setState(prev => ({ ...prev, user: null, loading: false }));
    } catch (error) {
      setState(prev => ({ ...prev, error: error as Error, loading: false }));
      throw error;
    }
  }, []);

  return {
    currentUser: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
  };
}; 