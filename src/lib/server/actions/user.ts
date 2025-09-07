import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SearchedUser } from '@/types';

export async function findUserByUsername(username: string): Promise<SearchedUser | null> {
    if (!db) {
        console.error("Firestore is not initialized.");
        throw new Error("Database service is unavailable.");
    }
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
        return null;
    }

    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef, 
            where('username_lowercase', '==', username.toLowerCase().trim()),
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
        throw new Error("An error occurred while searching for the user.");
    }
}
