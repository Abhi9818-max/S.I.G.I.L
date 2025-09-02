
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, type User, updateProfile } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { auth as firebaseAuth, db, storage as firebaseStorage, isFirebaseConfigured } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { UserData, PrivacySetting, TaskStatus } from '@/types';
import { TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS_BASE } from '@/lib/config';
import { v4 as uuidv4 } from 'uuid';
import Image from 'next/image';

const FAKE_DOMAIN = 'sigil.local';

const MALE_AVATAR_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
const FEMALE_AVATAR_NUMBERS = [13, 15, 16, 17, 33, 34, 35, 36, 37, 38, 39, 40, 41];

const DEFAULT_TASK_DEFINITIONS = DEFAULT_TASK_DEFINITIONS_BASE.map(task => ({
    ...task,
    status: 'active' as TaskStatus
}));


interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setupCredentials: (username: string, password: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say') => Promise<boolean>;
  updateProfilePicture: (url: string) => Promise<string | null>;
  updateBio: (newBio: string) => Promise<void>;
  equipTitle: (titleId: string | null) => Promise<void>;
  updatePrivacySetting: (setting: 'pacts' | 'activity', value: PrivacySetting) => Promise<void>;
  updateUserDataInDb: (dataToUpdate: Partial<UserData>) => Promise<void>;
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
  const auth = isFirebaseConfigured ? firebaseAuth : null;
  const storage = isFirebaseConfigured ? firebaseStorage : null;
  const isGuest = !user && !loading && !isFirebaseConfigured;


  useEffect(() => {
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
                    claimableAchievements: [],
                    spentSkillPoints: {},
                    unlockedSkills: [],
                    freezeCrystals: 0,
                    awardedStreakMilestones: {},
                    highGoals: [],
                    todoItems: [],
                    notes: [],
                    taskMastery: {},
                    aetherShards: 0,
                    reputation: {},
                    privacySettings: {
                      pacts: 'everyone',
                      activity: 'everyone'
                    },
                };
                setUserData(initialGuestData);
                localStorage.setItem('guest-userData', JSON.stringify(initialGuestData));
            }
            setIsUserDataLoaded(true);
        } else if (user) {
            if (!db) {
              console.error("Firestore DB is not initialized");
              return;
            }
            setIsUserDataLoaded(false);
            const userDocRef = doc(db, 'users', user.uid);
            const docSnap = await getDoc(userDocRef);
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

    if (!isFirebaseConfigured && !isAuthPage) {
        router.push('/login');
        return;
    }

    if (!user) {
      if (!isAuthPage) router.push('/login');
    } else {
      if (isAuthPage) router.push('/');
    }

  }, [user, loading, pathname, router]);

  const updateUserDataInDb = useCallback(async (dataToUpdate: Partial<UserData>) => {
    const getNewState = (prevData: UserData | null) => {
      const newState = { ...(prevData || {} as UserData), ...dataToUpdate };
      return newState as UserData;
    }
    setUserData(getNewState);

    if (isGuest) {
      // Not implemented for guest
      return;
    }
    
    if (user && db) {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, dataToUpdate, { merge: true });
    }
  }, [user, isGuest]);


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
    if (!auth) {
        router.push('/login');
        return;
    };
    try {
      await signOut(auth);
      router.push('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast({ title: 'Logout Failed', description: 'Could not log you out. Please try again.', variant: 'destructive' });
    }
  }, [auth, router, toast]);

  const setupCredentials = useCallback(async (username: string, password: string, gender: 'male' | 'female' | 'other' | 'prefer_not_to_say'): Promise<boolean> => {
    if (!auth || !db) return false;
    try {
        const email = `${username.toLowerCase()}@${FAKE_DOMAIN}`;
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        const avatarSet = gender === 'female' ? FEMALE_AVATAR_NUMBERS : MALE_AVATAR_NUMBERS;
        const randomAvatarIndex = Math.floor(Math.random() * avatarSet.length);
        const avatarNumber = avatarSet[randomAvatarIndex];
        const defaultPhotoURL = `/avatars/avatar${avatarNumber}.jpeg`;

        await updateProfile(newUser, { displayName: username, photoURL: defaultPhotoURL });

        const initialUserData: UserData = {
            username: username,
            username_lowercase: username.toLowerCase(),
            photoURL: defaultPhotoURL,
            bio: '',
            gender: gender,
            records: [],
            taskDefinitions: DEFAULT_TASK_DEFINITIONS,
            bonusPoints: 0,
            unlockedAchievements: [],
            claimableAchievements: [],
            spentSkillPoints: {},
            unlockedSkills: [],
            freezeCrystals: 0,
            awardedStreakMilestones: {},
            highGoals: [],
            todoItems: [],
            notes: [],
            taskMastery: {},
            aetherShards: 0,
            reputation: {},
            privacySettings: {
              pacts: 'everyone',
              activity: 'everyone'
            },
            pinnedAllianceIds: [],
        };

        const userDocRef = doc(db, 'users', newUser.uid);
        await setDoc(userDocRef, initialUserData);

        setUser(newUser);
        setUserData(initialUserData);
        setIsUserDataLoaded(true);

        // Trigger the welcome tour
        localStorage.setItem('sigil-tour-seen-interactive', 'pending');

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
  }, [auth, toast, router]);
  
  const updateProfilePicture = useCallback(async (url: string): Promise<string | null> => {
    if (isGuest) {
      setUserData(prev => prev ? ({ ...prev, photoURL: url }) : null);
      const guestData = JSON.parse(localStorage.getItem('guest-userData') || '{}');
      guestData.photoURL = url;
      localStorage.setItem('guest-userData', JSON.stringify(guestData));
      toast({ title: "Avatar Updated", description: "Your new avatar has been saved for this session." });
      return url;
    }

    if (!user || !auth) {
        toast({ title: "Not Authenticated", description: "You must be logged in to update your avatar.", variant: "destructive" });
        return null;
    }

    if (!db) {
      console.error("Firestore DB is not initialized");
      toast({ title: "Update Failed", description: "Database not available.", variant: "destructive" });
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
  }, [user, auth, toast, isGuest]);

  const updateBio = useCallback(async (newBio: string) => {
    if (isGuest) {
        setUserData(prev => prev ? { ...prev, bio: newBio } : null);
        const guestData = JSON.parse(localStorage.getItem('guest-userData') || '{}');
        guestData.bio = newBio;
        localStorage.setItem('guest-userData', JSON.stringify(guestData));
        toast({ title: 'Bio Updated' });
        return;
    }

    if (!user || !db) {
        console.error("Not authenticated or DB not initialized");
        return;
    }
    
    try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { bio: newBio }, { merge: true });
        setUserData(prev => prev ? { ...prev, bio: newBio } : null);
        toast({ title: 'Bio Updated' });
    } catch (error) {
        console.error('Error updating bio:', error);
        toast({ title: 'Error', description: 'Could not update your bio.', variant: 'destructive' });
    }
  }, [user, toast, isGuest]);

  const equipTitle = useCallback(async (titleId: string | null) => {
    const dataToUpdate = { equippedTitleId: titleId };
     if (isGuest) {
        setUserData(prev => prev ? { ...prev, ...dataToUpdate } : null);
        const guestData = JSON.parse(localStorage.getItem('guest-userData') || '{}');
        guestData.equippedTitleId = dataToUpdate.equippedTitleId;
        localStorage.setItem('guest-userData', JSON.stringify(guestData));
        toast({ title: 'Title Equipped!' });
        return;
    }

    if (!user || !db) {
        console.error("Not authenticated or DB not initialized");
        return;
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, dataToUpdate);
        setUserData(prev => prev ? { ...prev, ...dataToUpdate } : null);
        toast({ title: 'Title Equipped!' });
    } catch (error) {
        console.error('Error equipping title:', error);
        toast({ title: 'Error', description: 'Could not equip the title.', variant: 'destructive' });
    }
  }, [user, toast, isGuest]);
  
  const updatePrivacySetting = useCallback(async (setting: 'pacts' | 'activity', value: PrivacySetting) => {
    const dataToUpdate = { 
        privacySettings: {
            ...userData?.privacySettings,
            [setting]: value
        } 
    };

    if (isGuest) {
        setUserData(prev => prev ? { ...prev, ...dataToUpdate } : null);
        const guestData = JSON.parse(localStorage.getItem('guest-userData') || '{}');
        guestData.privacySettings = dataToUpdate.privacySettings;
        localStorage.setItem('guest-userData', JSON.stringify(guestData));
        toast({ title: 'Privacy Setting Updated' });
        return;
    }

    if (!user || !db) {
        console.error("Not authenticated or DB not initialized");
        return;
    }

    try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, dataToUpdate);
        setUserData(prev => prev ? { ...prev, ...dataToUpdate } : null);
        toast({ title: 'Privacy Setting Updated' });
    } catch (error) {
        console.error('Error updating privacy setting:', error);
        toast({ title: 'Error', description: 'Could not update privacy setting.', variant: 'destructive' });
    }
  }, [user, toast, isGuest, userData]);
  
  const showLoadingScreen = loading || (pathname !== '/login' && !isUserDataLoaded && !isGuest);

  if (showLoadingScreen) {
    return (
      <AuthContext.Provider value={{ user, isAuthenticated: !!user, isGuest, login, logout, setupCredentials, updateProfilePicture, updateBio, equipTitle, updatePrivacySetting, updateUserDataInDb, userData, loading: showLoadingScreen, isUserDataLoaded }}>
        <div className="flex items-center justify-center min-h-screen bg-black">
          <Image src="/loading.gif" alt="Loading..." width={242} height={242} unoptimized />
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isGuest, login, logout, setupCredentials, updateProfilePicture, updateBio, equipTitle, updatePrivacySetting, updateUserDataInDb, userData, loading: showLoadingScreen, isUserDataLoaded }}>
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
