
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth as firebaseAuth, db, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { UserData } from '@/types';
import { TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS } from '@/lib/config';

const FAKE_DOMAIN = 'sigil.local';
const GUEST_KEY = 'sigil-guest-mode';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupCredentials: (username: string, password: string) => Promise<boolean>;
  continueAsGuest: () => void;
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
  const [isGuest, setIsGuest] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = isFirebaseConfigured ? firebaseAuth : null;


  useEffect(() => {
    const isGuestSession = sessionStorage.getItem(GUEST_KEY) === 'true';
    if (isGuestSession) {
      setIsGuest(true);
      setLoading(false);
      return;
    }
    
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    const fetchUserData = async () => {
        if (isGuest) {
            setIsUserDataLoaded(false);
            const guestDataString = localStorage.getItem('guest-userData');
            if (guestDataString) {
                setUserData(JSON.parse(guestDataString));
            } else {
                 const initialGuestData: UserData = {
                    username: "Guest",
                    photoURL: null,
                    records: [],
                    taskDefinitions: DEFAULT_TASK_DEFINITIONS,
                    bonusPoints: 0,
                    unlockedAchievements: [],
                    spentSkillPoints: {},
                    unlockedSkills: [],
                    freezeCrystals: 0,
                    awardedStreakMilestones: {},
                    highGoals: [],
                    todoItems: [],
                };
                setUserData(initialGuestData);
                localStorage.setItem('guest-userData', JSON.stringify(initialGuestData));
            }
            setIsUserDataLoaded(true);
        } else if (user) {
            setIsUserDataLoaded(false);
            const docRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setUserData(docSnap.data() as UserData);
            } else {
                setUserData(null);
            }
            setIsUserDataLoaded(true);
        } else {
            setUserData(null);
            setIsUserDataLoaded(false);
        }
    };
    fetchUserData();
  }, [user, isGuest]);

  useEffect(() => {
    if (loading) return;
    
    const isAuthPage = pathname === '/login';

    if (!isFirebaseConfigured && !isGuest && !isAuthPage) {
        router.push('/login');
        return;
    }

    if (!isGuest && !user) {
      if (!isAuthPage) router.push('/login');
    } else {
      if (isAuthPage) router.push('/');
    }

  }, [user, isGuest, loading, pathname, router]);


  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
      router.push('/');
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
  }, [auth, toast, router]);

  const logout = useCallback(async () => {
    if (isGuest) {
      sessionStorage.removeItem(GUEST_KEY);
      setIsGuest(false);
      setUserData(null);
      router.push('/login');
      return;
    }

    if (!auth) return;
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  }, [auth, router, toast, isGuest]);

  const setupCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!auth || !db) return false;
    try {
        const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        await updateProfile(newUser, { displayName: username });

        const initialUserData: UserData = {
            username: username,
            username_lowercase: username.toLowerCase(),
            photoURL: null,
            records: [],
            taskDefinitions: DEFAULT_TASK_DEFINITIONS,
            bonusPoints: 0,
            unlockedAchievements: [],
            spentSkillPoints: {},
            unlockedSkills: [],
            freezeCrystals: 0,
            awardedStreakMilestones: {},
            highGoals: [],
            todoItems: [],
        };

        const userDocRef = doc(db, 'users', newUser.uid);
        await setDoc(userDocRef, initialUserData);

        setUser(newUser);
        setUserData(initialUserData);
        setIsUserDataLoaded(true);

        toast({ title: 'Account Created!', description: 'Welcome to S.I.G.I.L.' });
        router.push('/');
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
  }, [auth, db, toast, router]);

  const continueAsGuest = useCallback(() => {
    sessionStorage.setItem(GUEST_KEY, 'true');
    setIsGuest(true);
    router.push('/');
  }, [router]);
  
  const updateProfilePicture = useCallback(async (url: string): Promise<string | null> => {
    if (isGuest) {
      setUserData(prev => prev ? ({ ...prev, photoURL: url }) : null);
      const guestData = JSON.parse(localStorage.getItem('guest-userData') || '{}');
      guestData.photoURL = url;
      localStorage.setItem('guest-userData', JSON.stringify(guestData));
      toast({ title: "Avatar Updated", description: "Your new avatar has been saved for this session." });
      return url;
    }

    if (!user || !auth || !db) {
        toast({ title: "Not Authenticated", description: "You must be logged in to update your avatar.", variant: "destructive" });
        return null;
    }

    try {
        const photoURL = url || null;
        if(auth.currentUser){
           await updateProfile(auth.currentUser, { photoURL });
        }
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { photoURL }, { merge: true });

        setUserData(prev => prev ? ({ ...prev, photoURL: url }) : null);

        toast({ title: "Avatar Updated", description: "Your new avatar has been saved." });
        return url;

    } catch (error) {
        console.error("Error updating profile picture:", error);
        toast({ title: "Update Failed", description: "Could not update your avatar.", variant: "destructive" });
        return null;
    }
  }, [user, auth, toast, isGuest, db]);


  if (loading && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
          <div className="text-primary">Loading S.I.G.I.L...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user && !isGuest, isGuest, login, logout, setupCredentials, continueAsGuest, updateProfilePicture, userData, loading, isUserDataLoaded }}>
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
