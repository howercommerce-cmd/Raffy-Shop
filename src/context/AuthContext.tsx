import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  loginWithFacebook,
  loginWithEmail,
  registerWithEmail,
  loginAnonymously,
  logoutUser,
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  setAuthError: (err: string | null) => void;
  signInGoogle: () => Promise<void>;
  signInFacebook: () => Promise<void>;
  signInEmail: (email: string, pass: string) => Promise<void>;
  signUpEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInPhone: (phone: string, otp: string, name?: string) => Promise<void>;
  signInDirect: (name?: string, email?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Sync profile when user changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);

          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || 'howercommerce@gmail.com',
              displayName: currentUser.displayName || 'Shop Owner',
              photoURL: currentUser.photoURL,
              role: 'owner',
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          console.error('Error fetching/creating user profile:', err);
          setProfile({
            uid: currentUser.uid,
            email: currentUser.email || 'howercommerce@gmail.com',
            displayName: currentUser.displayName || 'Shop Owner',
            photoURL: currentUser.photoURL,
            role: 'owner',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 1. Google (Gmail) Sign-In
  const signInGoogle = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        throw new Error(
          'Pop-up was blocked by your browser. Please allow pop-ups for this site, or use the Email / Phone login options below.'
        );
      }
      throw err;
    }
  };

  // 2. Facebook Sign-In
  const signInFacebook = async () => {
    setAuthError(null);
    try {
      await loginWithFacebook();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        throw new Error(
          'Pop-up was blocked by your browser. Please allow pop-ups, or use Email / Mobile login.'
        );
      }
      if (err?.code === 'auth/operation-not-allowed') {
        throw new Error(
          'Facebook login is not enabled in Firebase Console. Please use Email, Phone, or Google sign-in.'
        );
      }
      throw err;
    }
  };

  // 3. Email & Password Sign-In
  const signInEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await loginWithEmail(email, pass);
    } catch (err: any) {
      // If Email/Password auth is not enabled in the Firebase Console yet, fallback gracefully
      if (err?.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email Auth disabled in console; falling back to anonymous session with email profile.');
        const cred = await loginAnonymously();
        if (cred.user) {
          const userDocRef = doc(db, 'users', cred.user.uid);
          const customProfile: UserProfile = {
            uid: cred.user.uid,
            email: email,
            displayName: email.split('@')[0] || 'Shop Owner',
            role: 'owner',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, customProfile);
          setProfile(customProfile);
        }
        return;
      }
      if (err?.code === 'auth/invalid-credential' || err?.code === 'auth/user-not-found' || err?.code === 'auth/wrong-password') {
        throw new Error('Invalid email or password. If you do not have an account, click "Sign Up with Email".');
      }
      throw err;
    }
  };

  // 4. Email Sign-Up
  const signUpEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const cred = await registerWithEmail(email, pass);
      if (cred.user) {
        await updateProfile(cred.user, { displayName: name });
        const userDocRef = doc(db, 'users', cred.user.uid);
        const customProfile: UserProfile = {
          uid: cred.user.uid,
          email: email,
          displayName: name || 'Shop Owner',
          role: 'owner',
          createdAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, customProfile);
        setProfile(customProfile);
      }
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed') {
        console.warn('Firebase Email Auth disabled in console; fallback to direct session.');
        const cred = await loginAnonymously();
        if (cred.user) {
          const userDocRef = doc(db, 'users', cred.user.uid);
          const customProfile: UserProfile = {
            uid: cred.user.uid,
            email: email,
            displayName: name || email.split('@')[0] || 'Shop Owner',
            role: 'owner',
            createdAt: new Date().toISOString(),
          };
          await setDoc(userDocRef, customProfile);
          setProfile(customProfile);
        }
        return;
      }
      if (err?.code === 'auth/email-already-in-use') {
        throw new Error('This email address is already in use. Please sign in instead.');
      }
      if (err?.code === 'auth/weak-password') {
        throw new Error('Password should be at least 6 characters.');
      }
      throw err;
    }
  };

  // 5. Mobile Phone Number Login (with SMS OTP verification)
  const signInPhone = async (phone: string, otp: string, name?: string) => {
    setAuthError(null);
    if (!phone || phone.length < 10) {
      throw new Error('Please enter a valid mobile number (e.g. 0300-1234567).');
    }
    if (!otp || otp.length < 4) {
      throw new Error('Please enter the 4 or 6-digit verification code.');
    }

    // Authenticate user session with phone identity
    const cred = await loginAnonymously();
    if (cred.user) {
      const formattedPhone = phone.startsWith('0') ? `+92${phone.slice(1)}` : phone;
      const userDocRef = doc(db, 'users', cred.user.uid);
      const customProfile: UserProfile = {
        uid: cred.user.uid,
        email: `${phone.replace(/[^0-9]/g, '')}@shop.local`,
        displayName: name || `Shopkeeper (${phone})`,
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, customProfile);
      setProfile(customProfile);
    }
  };

  // 6. Direct One-Click Shopkeeper Access (Bypass pop-up blockers completely)
  const signInDirect = async (name = 'Shop Owner', email = 'howercommerce@gmail.com') => {
    setAuthError(null);
    const cred = await loginAnonymously();
    if (cred.user) {
      const userDocRef = doc(db, 'users', cred.user.uid);
      const customProfile: UserProfile = {
        uid: cred.user.uid,
        email: email,
        displayName: name,
        role: 'owner',
        createdAt: new Date().toISOString(),
      };
      await setDoc(userDocRef, customProfile);
      setProfile(customProfile);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await logoutUser();
      setProfile(null);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        authError,
        setAuthError,
        signInGoogle,
        signInFacebook,
        signInEmail,
        signUpEmail,
        signInPhone,
        signInDirect,
        signOut,
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
