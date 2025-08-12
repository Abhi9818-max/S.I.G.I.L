
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth as firebaseAuth, db, storage as firebaseStorage, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { UserData } from '@/types';
import { TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

const FAKE_DOMAIN = 'sigil.local';
const GUEST_KEY = 'sigil-guest-mode';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupCredentials: (username: string, password: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say') => Promise<boolean>;
  continueAsGuest: () => void;
  updateProfilePicture: (url: string) => Promise<string | null>;
  updateBio: (newBio: string) => Promise<void>;
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
  const [showLoading, setShowLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const auth = isFirebaseConfigured ? firebaseAuth : null;
  const storage = isFirebaseConfigured ? firebaseStorage : null;


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
                    bio: 'A wanderer exploring the system.',
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
                    taskMastery: {},
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

  useEffect(() => {
    // This effect ensures the loading screen is only shown on the client
    // after the initial render, preventing the hydration error.
    setShowLoading(loading);
  }, [loading]);


  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    if (!auth) return false;
    try {
      const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Force user state update before redirection
      setUser(userCredential.user);
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
      setIsUserDataLoaded(false);
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

  const setupCredentials = useCallback(async (username: string, password: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'): Promise<boolean> => {
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
            bio: '',
            gender: gender,
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
            taskMastery: {},
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

  const updateBio = useCallback(async (newBio: string) => {
    if (isGuest) {
        setUserData(prev => prev ? { ...prev, bio: newBio } : null);
        const guestData = JSON.parse(localStorage.getItem('guest-userData') || '{}');
        guestData.bio = newBio;
        localStorage.setItem('guest-userData', JSON.stringify(guestData));
        toast({ title: 'Bio Updated' });
        return;
    }

    if (!user || !db) return;
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { bio: newBio }, { merge: true });
        setUserData(prev => prev ? { ...prev, bio: newBio } : null);
        toast({ title: 'Bio Updated' });
    } catch (error) {
        console.error('Error updating bio:', error);
        toast({ title: 'Error', description: 'Could not update your bio.', variant: 'destructive' });
    }
  }, [user, db, toast, isGuest]);
  

  if (showLoading && pathname !== '/login') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
          <div className="loader"></div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user && !isGuest, isGuest, login, logout, setupCredentials, continueAsGuest, updateProfilePicture, updateBio, userData, loading, isUserDataLoaded }}>
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
