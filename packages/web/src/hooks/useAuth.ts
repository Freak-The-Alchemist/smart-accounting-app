import { useState, useEffect } from 'react';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  updateEmail,
  updatePassword,
} from 'firebase/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user);
        setLoading(false);
      },
      (error) => {
        setError(error as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    try {
      setError(null);
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Send verification email
      await sendEmailVerification(result.user);
      
      return result.user;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut(auth);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const verifyEmail = async () => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      await sendEmailVerification(user);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      await updateProfile(user, data);
      setUser({ ...user });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateUserEmail = async (newEmail: string) => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      await updateEmail(user, newEmail);
      setUser({ ...user });
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const updateUserPassword = async (newPassword: string) => {
    if (!user) throw new Error('No user logged in');
    try {
      setError(null);
      await updatePassword(user, newPassword);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    resetPassword,
    verifyEmail,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
  };
} 