'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChange, getUserData } from '@/lib/firebaseAuth';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Cookies from 'js-cookie';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (firebaseUser) => {
      if (firebaseUser) {
        // Check if email is verified
        if (!firebaseUser.emailVerified) {
          // Sign out users with unverified emails
          await signOut(auth);
          setUser(null);
          setUserData(null);
          setIsAdmin(false);
          // Clear cookies
          Cookies.remove('isAuthenticated');
          Cookies.remove('isAdmin');
          setLoading(false);
          return;
        }

        setUser(firebaseUser);
        
        // Get additional user data from Firestore
        const { success, userData: firestoreData } = await getUserData(firebaseUser.uid);
        if (success) {
          setUserData(firestoreData);
          const isAdminUser = firestoreData.role === 'admin' || firebaseUser.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
          setIsAdmin(isAdminUser);
          
          // Set cookies for middleware (secure: false for local development)
          Cookies.set('isAuthenticated', 'true', { expires: 7, secure: false, sameSite: 'lax' });
          Cookies.set('isAdmin', isAdminUser ? 'true' : 'false', { expires: 7, secure: false, sameSite: 'lax' });
        } else {
          // Set authenticated but not admin if userData fetch fails
          Cookies.set('isAuthenticated', 'true', { expires: 7, secure: false, sameSite: 'lax' });
          Cookies.set('isAdmin', 'false', { expires: 7, secure: false, sameSite: 'lax' });
        }
      } else {
        setUser(null);
        setUserData(null);
        setIsAdmin(false);
        // Clear cookies
        Cookies.remove('isAuthenticated');
        Cookies.remove('isAdmin');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      // Clear cookies on logout
      Cookies.remove('isAuthenticated');
      Cookies.remove('isAdmin');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    userData,
    loading,
    isAdmin,
    isAuthenticated: !!user,
    isEmailVerified: user?.emailVerified || false,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
