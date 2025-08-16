'use server';
/**
 * @fileOverview Server-side utilities for fetching public user data.
 */
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { UserData } from '@/types';

/**
 * Fetches public-safe data for a given user ID from the server.
 * @param userId The ID of the user to fetch.
 * @returns A UserData object or null if not found.
 */
export async function getPublicUserData(userId: string): Promise<UserData | null> {
    if (!userId || !db) return null;
    try {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    } catch (error) {
        console.error("Error fetching public user data:", error);
        return null;
    }
};

