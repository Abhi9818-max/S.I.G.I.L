
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { UserData } from '@/types';

const FAKE_DOMAIN = 'sigil.local';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupCredentials: (username: string, password: string) => Promise<boolean>;
  updateProfilePicture: (url: string) => Promise<string | null>;
  userData: UserData | null;
  loading: boolean;
  isUserDataLoaded: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUserDataLoaded, setIsUserDataLoaded] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
        if (user) {
            setIsUserDataLoaded(false); // Reset loading state
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data() as UserData);
            } else {
                // This might happen for a brief moment for new users.
                // The setupCredentials function should handle creating the initial doc.
                setUserData(null);
            }
            setIsUserDataLoaded(true);
        } else {
            setUserData(null);
            setIsUserDataLoaded(false);
        }
    };
    if (isFirebaseConfigured) {
      fetchUserData();
    }
  }, [user]);

  useEffect(() => {
    if (loading) return;
    
    const isAuthPage = pathname === '/login';

    if (!isFirebaseConfigured) {
      if (!isAuthPage) router.push('/login');
      return;
    }

    if (!user) {
      if (!isAuthPage) router.push('/login');
    } else { // User is logged in
      if (isAuthPage) router.push('/');
    }

  }, [user, loading, pathname, router]);


  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!firebaseAuth) return false;
    try {
      const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
      await signInWithEmailAndPassword(firebaseAuth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      return true;
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
      } else {
        toast({ title: 'Login Failed', description: 'An unexpected error occurred.', variant: 'destructive' });
        console.error("Login error:", error);
      }
      return false;
    }
  }, [toast]);

  const logout = useCallback(async () => {
    if (!firebaseAuth) return;
    try {
      await signOut(firebaseAuth);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  }, [router, toast]);

  const setupCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!firebaseAuth) return false;
    try {
      const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
      const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      
      await updateProfile(userCredential.user, { displayName: username });

      const userDocRef = doc(db, 'users', userCredential.user.uid);
      const initialUserData: UserData = {
        username: username,
        username_lowercase: username.toLowerCase(),
        photoURL: null,
        records: [],
        taskDefinitions: [],
        bonusPoints: 0,
        unlockedAchievements: [],
        spentSkillPoints: {},
        unlockedSkills: [],
        freezeCrystals: 0,
        awardedStreakMilestones: {},
        highGoals: [],
        todoItems: [],
      };
      await setDoc(userDocRef, initialUserData);

      // Manually update local state to avoid race conditions with useEffect
      setUser(userCredential.user);
      setUserData(initialUserData);
      setIsUserDataLoaded(true);

      toast({ title: 'Account Created!', description: 'Welcome to S.I.G.I.L.' });
      return true;
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({ title: 'Setup Failed', description: 'This username is already taken.', variant: 'destructive' });
      } else {
        toast({ title: 'Setup Failed', description: 'An unexpected error occurred. Please try again.', variant: 'destructive' });
        console.error("Setup error:", error);
      }
      return false;
    }
  }, [toast]);
  
  const updateProfilePicture = useCallback(async (url: string): Promise<string | null> => {
    if (!user) {
        toast({ title: "Not Authenticated", description: "You must be logged in to update your avatar.", variant: "destructive" });
        return null;
    }

    try {
        const photoURL = url || null;
        // Update auth profile
        await updateProfile(user, { photoURL });
        
        // Update Firestore document
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { photoURL }, { merge: true });

        // Update local state
        setUserData(prev => prev ? ({ ...prev, photoURL }) : null);

        toast({ title: "Avatar Updated", description: "Your new avatar has been saved." });
        return url;

    } catch (error) {
        console.error("Error updating profile picture:", error);
        toast({ title: "Update Failed", description: "Could not update your avatar.", variant: "destructive" });
        return null;
    }
  }, [user, toast]);


  if (loading || (!user && pathname !== '/login' && isFirebaseConfigured)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-primary">Loading S.I.G.I.L...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, setupCredentials, updateProfilePicture, userData, loading, isUserDataLoaded }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
