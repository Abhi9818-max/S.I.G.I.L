
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { SearchedUser, FriendRequest, Friend, UserData } from '@/types';
import { useToast } from "@/hooks/use-toast";

interface FriendContextType {
    searchUser: (username: string) => Promise<SearchedUser | null>;
    sendFriendRequest: (recipientId: string, recipientUsername: string) => Promise<void>;
    acceptFriendRequest: (request: FriendRequest) => Promise<void>;
    declineFriendRequest: (requestId: string) => Promise<void>;
    cancelFriendRequest: (requestId: string) => Promise<void>;
    getFriendData: (friendId: string) => Promise<UserData | null>;
    incomingRequests: FriendRequest[];
    pendingRequests: FriendRequest[];
    friends: Friend[];
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);

    const fetchFriendsAndRequests = useCallback(async () => {
        if (!user) return;

        // Fetch incoming friend requests
        const incomingQuery = query(collection(db, 'friend_requests'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
        const incomingSnapshot = await getDocs(incomingQuery);
        const incoming = incomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        setIncomingRequests(incoming);

        // Fetch sent/pending friend requests
        const pendingQuery = query(collection(db, 'friend_requests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const pendingSnapshot = await getDocs(pendingQuery);
        const pending = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
        setPendingRequests(pending);
        
        // Fetch friends list
        const friendsQuery = collection(db, `users/${user.uid}/friends`);
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendsListPromises = friendsSnapshot.docs.map(async (friendDoc) => {
            const friendId = friendDoc.id;
            const userDocRef = doc(db, 'users', friendId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                const friendUserData = userDocSnap.data() as UserData;
                return {
                    uid: friendId,
                    username: friendUserData.username,
                    photoURL: friendUserData.photoURL,
                    since: friendDoc.data().since,
                };
            }
            return null;
        });
        const friendsList = (await Promise.all(friendsListPromises)).filter(Boolean) as Friend[];
        setFriends(friendsList);
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchFriendsAndRequests();
        }
    }, [user, fetchFriendsAndRequests]);

    const searchUser = useCallback(async (username: string): Promise<SearchedUser | null> => {
        const usersRef = collection(db, 'users');
        const searchTerm = username.toLowerCase();
        const q = query(usersRef, where('username_lowercase', '==', searchTerm));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const userDoc = querySnapshot.docs[0];
        const foundUserData = userDoc.data();
        return {
            uid: userDoc.id,
            username: foundUserData.username,
            photoURL: foundUserData.photoURL,
        };
    }, []);

    const sendFriendRequest = useCallback(async (recipientId: string, recipientUsername: string) => {
        if (!user || !userData) throw new Error("You must be logged in to send requests.");
        if (user.uid === recipientId) throw new Error("You cannot send a request to yourself.");

        const requestId = `${user.uid}_${recipientId}`;
        const reverseRequestId = `${recipientId}_${user.uid}`;
        const requestRef = doc(db, 'friend_requests', requestId);
        const reverseRequestRef = doc(db, 'friend_requests', reverseRequestId);
        
        const requestSnap = await getDoc(requestRef);
        const reverseRequestSnap = await getDoc(reverseRequestRef);

        if (requestSnap.exists() || reverseRequestSnap.exists()) {
            throw new Error("Friend request already sent or exists.");
        }

        const newRequest: Omit<FriendRequest, 'id'> = {
            senderId: user.uid,
            senderUsername: userData.username,
            recipientId: recipientId,
            recipientUsername: recipientUsername,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await setDoc(requestRef, newRequest);
        await fetchFriendsAndRequests(); // Re-fetch to update pending list
    }, [user, userData, fetchFriendsAndRequests]);

    const acceptFriendRequest = useCallback(async (request: FriendRequest) => {
        if (!user || !userData) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        const batch = writeBatch(db);
        
        const senderDataDoc = await getDoc(doc(db, 'users', request.senderId));
        if (!senderDataDoc.exists()) {
            toast({ title: 'Error', description: 'Could not find the user who sent the request.', variant: 'destructive' });
            return;
        }
        const senderData = senderDataDoc.data() as UserData;
        const currentUserData = userData;

        // Add sender to current user's friend list
        const currentUserFriendRef = doc(db, `users/${user.uid}/friends`, request.senderId);
        batch.set(currentUserFriendRef, { 
            uid: request.senderId, 
            username: senderData.username, 
            photoURL: senderData.photoURL || null,
            since: new Date().toISOString() 
        });

        // Add current user to sender's friend list
        const senderFriendRef = doc(db, `users/${request.senderId}/friends`, user.uid);
        batch.set(senderFriendRef, { 
            uid: user.uid, 
            username: currentUserData.username, 
            photoURL: currentUserData.photoURL || null,
            since: new Date().toISOString() 
        });
        
        // Delete the original request
        const requestRef = doc(db, 'friend_requests', request.id);
        batch.delete(requestRef);

        try {
            await batch.commit();
            await fetchFriendsAndRequests();
            toast({ title: 'Friend Added', description: `You are now friends with ${request.senderUsername}.` });
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            toast({ title: 'Error', description: 'Could not accept the friend request.', variant: 'destructive' });
        }

    }, [user, userData, toast, fetchFriendsAndRequests]);

    const declineFriendRequest = useCallback(async (requestId: string) => {
        const requestRef = doc(db, 'friend_requests', requestId);
        await deleteDoc(requestRef);
        await fetchFriendsAndRequests();
        toast({ title: 'Request Declined', variant: 'destructive' });
    }, [toast, fetchFriendsAndRequests]);
    
    const cancelFriendRequest = useCallback(async (requestId: string) => {
        const requestRef = doc(db, 'friend_requests', requestId);
        await deleteDoc(requestRef);
        await fetchFriendsAndRequests();
        toast({ title: 'Request Cancelled' });
    }, [toast, fetchFriendsAndRequests]);
    
    const getFriendData = useCallback(async (friendId: string): Promise<UserData | null> => {
        if (!user) return null;
        
        const friendRef = doc(db, `users/${user.uid}/friends`, friendId);
        const friendSnap = await getDoc(friendRef);
        if (!friendSnap.exists()) {
            console.error("Not a friend.");
            return null;
        }

        const userDocRef = doc(db, 'users', friendId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    }, [user]);

    return (
        <FriendContext.Provider value={{ 
            searchUser, 
            sendFriendRequest,
            acceptFriendRequest,
            declineFriendRequest,
            cancelFriendRequest,
            getFriendData,
            incomingRequests, 
            pendingRequests, 
            friends 
        }}>
            {children}
        </FriendContext.Provider>
    );
};

export const useFriends = (): FriendContextType => {
    const context = useContext(FriendContext);
    if (context === undefined) {
        throw new Error('useFriends must be used within a FriendProvider');
    }
    return context;
};
