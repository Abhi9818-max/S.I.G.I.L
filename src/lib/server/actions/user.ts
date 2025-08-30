
'use server';

import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SearchedUser } from '@/types';

export async function findUserByUsername(username: string): Promise<SearchedUser | null> {
    if (!db) {
        console.error("Firestore is not initialized.");
        return null;
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef, 
            where('username_lowercase', '==', username.toLowerCase()),
            limit(1)
        );

        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        return {
            uid: userDoc.id,
            username: userData.username,
            photoURL: userData.photoURL || null,
        };
    } catch (error) {
        console.error("Error searching for user by username:", error);
        // It's better to throw the error to be handled by the caller,
        // so they know the operation failed.
        throw new Error("An error occurred while searching for the user.");
    }
}
