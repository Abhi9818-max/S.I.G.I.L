
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, addDoc, onSnapshot, Unsubscribe, documentId, limit, or, and, runTransaction, DocumentReference, orderBy, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { SearchedUser, FriendRequest, Friend, UserData, RelationshipProposal, Alliance, AllianceMember, AllianceInvitation, AllianceChallenge, AllianceStatus, MarketplaceListing, RecordEntry } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { ACHIEVEMENTS } from '@/lib/achievements';

const RELATIONSHIP_MAP: Record<string, string> = {
    "Boyfriend": "Girlfriend",
    "Girlfriend": "Boyfriend",
    "Best Friend": "Best Friend",
    "Ex-Boyfriend": "Ex-Girlfriend",
    "Ex-Girlfriend": "Ex-Boyfriend",
    "Sugar Daddy": "Obedient Girl",
    "Obedient Girl": "Sugar Daddy",
    "Sugar Mommy": "Obedient Kid",
    "Obedient Kid": "Sugar Mommy",
    "Fuck Buddy": "Fuck Buddy",
};

interface FriendContextType {
    sendFriendRequest: (recipient: SearchedUser) => Promise<void>;
    acceptFriendRequest: (request: FriendRequest) => Promise<void>;
    declineFriendRequest: (requestId: string) => Promise<void>;
    cancelFriendRequest: (requestId: string) => Promise<void>;
    getFriendData: (friendId: string) => Promise<UserData | null>;
    updateFriendNickname: (friendId: string, nickname: string) => Promise<void>;
    sendRelationshipProposal: (friendId: string, recipientUsername: string, recipientPhotoURL: string | null | undefined, relationship: string) => Promise<void>;
    acceptRelationshipProposal: (proposal: RelationshipProposal) => Promise<void>;
    declineRelationshipProposal: (proposalId: string) => Promise<void>;
    cancelRelationshipProposal: (proposalId: string) => Promise<void>;
    incomingRequests: FriendRequest[];
    pendingRequests: FriendRequest[];
    friends: Friend[];
    incomingRelationshipProposals: RelationshipProposal[];
    pendingRelationshipProposals: RelationshipProposal[];
    pendingRelationshipProposalForFriend: (friendId: string) => RelationshipProposal | undefined;
    incomingRelationshipProposalFromFriend: (friendId: string) => RelationshipProposal | undefined;
    getPublicUserData: (userId: string) => Promise<UserData | null>;
    unfriend: (friendId: string) => Promise<void>;
    suggestedFriends: SearchedUser[];
    // Marketplace
    globalListings: MarketplaceListing[];
    userListings: MarketplaceListing[];
    listTitleForSale: (titleId: string, price: number) => Promise<void>;
    purchaseTitle: (listing: MarketplaceListing) => Promise<void>;
    cancelListing: (listingId: string) => Promise<void>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [suggestedFriends, setSuggestedFriends] = useState<SearchedUser[]>([]);
    const [incomingRelationshipProposals, setIncomingRelationshipProposals] = useState<RelationshipProposal[]>([]);
    const [pendingRelationshipProposals, setPendingRelationshipProposals] = useState<RelationshipProposal[]>([]);
    const [globalListings, setGlobalListings] = useState<MarketplaceListing[]>([]);
    const [userListings, setUserListings] = useState<MarketplaceListing[]>([]);

    // Marketplace listeners
    useEffect(() => {
        if (!user || !db) return;
        const q = query(collection(db!, 'marketplace_listings'), where('sellerId', '!=', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setGlobalListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceListing)));
        });
        return () => unsubscribe();
    }, [user]);

    useEffect(() => {
        if (!user || !db) {
            setUserListings([]);
            return;
        }
        const q = query(collection(db!, 'marketplace_listings'), where('sellerId', '==', user.uid));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setUserListings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MarketplaceListing)));
        });
        return () => unsubscribe();
    }, [user]);

    const fetchFriendsAndRequests = useCallback(async () => {
        if (!user || !db) return;

        try {
            // Fetch incoming friend requests
            const incomingQuery = query(collection(db!, 'friend_requests'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
            const incomingSnapshot = await getDocs(incomingQuery);
            setIncomingRequests(incomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));

            // Fetch sent/pending friend requests
            const pendingQuery = query(collection(db!, 'friend_requests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
            const pendingSnapshot = await getDocs(pendingQuery);
            const pendingRequestsData = pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest));
            setPendingRequests(pendingRequestsData);
            
            // Fetch friends list
            const friendsQuery = collection(db!, `users/${user.uid}/friends`);
            const friendsSnapshot = await getDocs(friendsQuery);
            const friendsListPromises = friendsSnapshot.docs.map(async (friendDoc) => {
                const friendId = friendDoc.id;
                const friendDocData = friendDoc.data();
                const userDocRef = doc(db!, 'users', friendId);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const friendUserData = userDocSnap.data() as UserData;
                    return {
                        uid: friendId,
                        username: friendUserData.username,
                        photoURL: friendUserData.photoURL,
                        since: friendDocData.since,
                        nickname: friendDocData.nickname,
                        relationship: friendDocData.relationship,
                        taskDefinitions: friendUserData.taskDefinitions, // Include tasks
                    };
                }
                return null;
            });
            const friendsData = (await Promise.all(friendsListPromises)).filter(Boolean) as Friend[];
            setFriends(friendsData);
            
            // Fetch incoming relationship proposals
            const incomingRelQuery = query(collection(db!, 'relationship_proposals'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
            const incomingRelSnapshot = await getDocs(incomingRelQuery);
            setIncomingRelationshipProposals(incomingRelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RelationshipProposal)));

            // Fetch sent/pending relationship proposals
            const pendingRelQuery = query(collection(db!, 'relationship_proposals'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
            const pendingRelSnapshot = await getDocs(pendingRelQuery);
            setPendingRelationshipProposals(pendingRelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RelationshipProposal)));
            
             // Fetch Friend Suggestions
            const friendIds = friendsData.map(f => f.uid);
            const pendingIds = pendingRequestsData.map(p => p.recipientId);
            const incomingIds = incomingRequests.docs.map(d => d.data().senderId);
            const allExcludedIds = [...new Set([user.uid, ...friendIds, ...pendingIds, ...incomingIds])];
            
            // This is a simplified suggestion logic. In a real app, this would be more complex.
            // We fetch a few users who are not in the excluded list.
            if (allExcludedIds.length > 0) {
              const suggestionsQuery = query(
                collection(db!, 'users'),
                where(documentId(), 'not-in', allExcludedIds.slice(0, 10)), // Firestore 'not-in' has a limit of 10
                limit(5)
              );
              const suggestionsSnapshot = await getDocs(suggestionsQuery);
              const suggestions = suggestionsSnapshot.docs.map(doc => {
                  const data = doc.data();
                  return {
                      uid: doc.id,
                      username: data.username,
                      photoURL: data.photoURL,
                  };
              });
              setSuggestedFriends(suggestions);
            }

        } catch (error) {
            console.error("Error fetching friends and requests:", error);
        }
    }, [user]);

    // Listener for friends and requests
    useEffect(() => {
        if (!user || !db) return;

        const requestUnsubscribe = onSnapshot(query(collection(db, 'friend_requests'), or(where('recipientId', '==', user.uid), where('senderId', '==', user.uid))), () => {
            fetchFriendsAndRequests();
        });
        
        const friendsUnsubscribe = onSnapshot(collection(db, 'users', user.uid, 'friends'), () => {
            fetchFriendsAndRequests();
        });
        
        const proposalUnsubscribe = onSnapshot(query(collection(db, 'relationship_proposals'), or(where('recipientId', '==', user.uid), where('senderId', '==', user.uid))), () => {
             fetchFriendsAndRequests();
        });

        return () => {
            requestUnsubscribe();
            friendsUnsubscribe();
            proposalUnsubscribe();
        };
    }, [user, fetchFriendsAndRequests]);

    const sendFriendRequest = useCallback(async (recipient: SearchedUser) => {
        if (!user || !userData || !db) throw new Error("You must be logged in to send requests.");
        if (user.uid === recipient.uid) throw new Error("You cannot send a request to yourself.");

        const requestId = `${user.uid}_${recipient.uid}`;
        const reverseRequestId = `${recipient.uid}_${user.uid}`;
        const requestRef = doc(db!, 'friend_requests', requestId);
        const reverseRequestRef = doc(db!, 'friend_requests', reverseRequestId);
        
        const requestSnap = await getDoc(requestRef);
        const reverseRequestSnap = await getDoc(reverseRequestRef);

        if (requestSnap.exists() || reverseRequestSnap.exists()) {
            throw new Error("Friend request already sent or exists.");
        }

        const newRequest: Omit<FriendRequest, 'id'> = {
            senderId: user.uid,
            senderUsername: userData.username,
            senderPhotoURL: userData.photoURL,
            recipientId: recipient.uid,
            recipientUsername: recipient.username,
            recipientPhotoURL: recipient.photoURL,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await setDoc(requestRef, newRequest);
    }, [user, userData]);

    const acceptFriendRequest = useCallback(async (request: FriendRequest) => {
        if (!user || !userData || !db) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }

        const batch = writeBatch(db!);

        const currentUserFriendRef = doc(db!, `users/${user.uid}/friends`, request.senderId);
        batch.set(currentUserFriendRef, { 
            uid: request.senderId, 
            username: request.senderUsername, 
            since: new Date().toISOString() 
        });

        const senderFriendRef = doc(db!, `users/${request.senderId}/friends`, user.uid);
        batch.set(senderFriendRef, { 
            uid: user.uid, 
            username: userData.username, 
            since: new Date().toISOString() 
        });
        
        const requestRef = doc(db!, 'friend_requests', request.id);
        batch.delete(requestRef);

        try {
            await batch.commit();
            toast({ title: 'Friend Added', description: `You are now friends with ${request.senderUsername}.` });
        } catch (error) {
            console.error("Failed to accept friend request:", error);
            toast({ title: 'Error', description: 'Could not accept the friend request.', variant: 'destructive' });
        }

    }, [user, userData, toast]);

    const declineFriendRequest = useCallback(async (requestId: string) => {
        if (!db) return;
        const requestRef = doc(db!, 'friend_requests', requestId);
        await deleteDoc(requestRef);
        toast({ title: 'Request Declined', variant: 'destructive' });
    }, [toast]);
    
    const cancelFriendRequest = useCallback(async (requestId: string) => {
        if (!db) return;
        const requestRef = doc(db!, 'friend_requests', requestId);
        await deleteDoc(requestRef);
        toast({ title: 'Request Cancelled' });
    }, [toast]);
    
    const getFriendData = useCallback(async (friendId: string): Promise<UserData | null> => {
        if (!user || !db) return null;
        
        const friendRef = doc(db!, `users/${user.uid}/friends`, friendId);
        const friendSnap = await getDoc(friendRef);
        if (!friendSnap.exists()) {
            console.error("Not a friend.");
            return null;
        }

        const userDocRef = doc(db!, 'users', friendId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    }, [user]);

    const getPublicUserData = useCallback(async (userId: string): Promise<UserData | null> => {
        if (!db) return null;
        const userDocRef = doc(db!, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    }, []);

    const updateFriendNickname = useCallback(async (friendId: string, nickname: string) => {
        if (!user || !db) return;
        const friendRef = doc(db!, `users/${user.uid}/friends`, friendId);
        await updateDoc(friendRef, { nickname });
    }, [user]);

    const unfriend = useCallback(async (friendId: string) => {
        if (!user || !db) throw new Error("You must be logged in.");

        const batch = writeBatch(db!);

        // Remove friend from current user's friend list
        const currentUserFriendRef = doc(db!, `users/${user.uid}/friends`, friendId);
        batch.delete(currentUserFriendRef);

        // Remove current user from friend's friend list
        const friendUserRef = doc(db!, `users/${friendId}/friends`, user.uid);
        batch.delete(friendUserRef);

        try {
            await batch.commit();
            toast({ title: "Friend Removed", description: "They are no longer on your friends list." });
            router.push('/friends');
        } catch (error) {
            console.error("Failed to unfriend:", error);
            toast({ title: 'Error', description: 'Could not remove friend.', variant: 'destructive' });
        }
    }, [user, toast, router]);

    const sendRelationshipProposal = useCallback(async (friendId: string, recipientUsername: string, recipientPhotoURL: string | null | undefined, relationship: string) => {
        if (!user || !userData || !db) throw new Error("You must be logged in.");

        if (relationship === 'none') {
            const batch = writeBatch(db!);
            const userFriendRef = doc(db!, `users/${user.uid}/friends`, friendId);
            batch.update(userFriendRef, { relationship: '' });
            const friendUserRef = doc(db!, `users/${friendId}/friends`, user.uid);
            batch.update(friendUserRef, { relationship: '' });
            await batch.commit();
            return;
        }

        const proposalId = `${user.uid}_${friendId}`;
        const existingProposalRef = doc(db!, 'relationship_proposals', proposalId);
        const existingReverseProposalRef = doc(db!, 'relationship_proposals', `${friendId}_${user.uid}`);
        
        const existingSnap = await getDoc(existingProposalRef);
        const existingReverseSnap = await getDoc(existingReverseProposalRef);

        if (existingSnap.exists() || existingReverseSnap.exists()) {
            throw new Error("A relationship proposal already exists with this user.");
        }
        
        const correspondingRelationship = RELATIONSHIP_MAP[relationship] || relationship;

        const proposalData: Omit<RelationshipProposal, 'id'> = {
            senderId: user.uid,
            senderUsername: userData.username,
            senderPhotoURL: userData.photoURL,
            recipientId: friendId,
            recipientUsername: recipientUsername,
            recipientPhotoURL: recipientPhotoURL,
            status: 'pending',
            createdAt: new Date().toISOString(),
            relationship: relationship,
            correspondingRelationship: correspondingRelationship,
        };

        await setDoc(existingProposalRef, proposalData);
    }, [user, userData]);
    
    const acceptRelationshipProposal = useCallback(async (proposal: RelationshipProposal) => {
        if (!user || !db) return;
        const batch = writeBatch(db!);

        const userFriendRef = doc(db!, `users/${user.uid}/friends`, proposal.senderId);
        batch.update(userFriendRef, { relationship: proposal.correspondingRelationship });
        
        const senderFriendRef = doc(db!, `users/${proposal.senderId}/friends`, user.uid);
        batch.update(senderFriendRef, { relationship: proposal.relationship });

        const proposalRef = doc(db!, 'relationship_proposals', proposal.id);
        batch.delete(proposalRef);

        await batch.commit();
        toast({ title: "Relationship Updated!", description: `You are now ${proposal.correspondingRelationship} with ${proposal.senderUsername}.` });
    }, [user, toast]);

    const declineRelationshipProposal = useCallback(async (proposalId: string) => {
        if (!db) return;
        await deleteDoc(doc(db!, 'relationship_proposals', proposalId));
        toast({ title: 'Proposal Declined', variant: 'destructive' });
    }, [toast]);

    const cancelRelationshipProposal = useCallback(async (proposalId: string) => {
        if (!db) return;
        await deleteDoc(doc(db!, 'relationship_proposals', proposalId));
        toast({ title: 'Proposal Cancelled' });
    }, [toast]);
    
    const pendingRelationshipProposalForFriend = useCallback((friendId: string) => {
        return pendingRelationshipProposals.find(p => p.recipientId === friendId);
    }, [pendingRelationshipProposals]);
    
    const incomingRelationshipProposalFromFriend = useCallback((friendId: string) => {
        return incomingRelationshipProposals.find(p => p.senderId === friendId);
    }, [incomingRelationshipProposals]);
    
    // Marketplace Logic
    const listTitleForSale = useCallback(async (titleId: string, price: number) => {
        if (!user || !userData || !db) throw new Error("Authentication required.");

        const title = ACHIEVEMENTS.find(a => a.id === titleId && a.isTitle);
        if (!title) throw new Error("Invalid title selected.");
        
        await runTransaction(db!, async (transaction) => {
            const userRef = doc(db!, 'users', user.uid);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists()) {
                throw new Error("User document not found.");
            }

            const currentData = userDoc.data() as UserData;
            if (!(currentData.unlockedAchievements || []).includes(titleId)) {
                throw new Error("You do not own this title.");
            }

            transaction.update(userRef, {
                unlockedAchievements: arrayRemove(titleId)
            });

            const listingRef = doc(collection(db!, 'marketplace_listings'));
            const newListing: MarketplaceListing = {
                id: listingRef.id,
                itemId: titleId,
                itemName: title.name,
                itemDescription: title.description,
                itemType: 'title',
                sellerId: user.uid,
                sellerUsername: currentData.username,
                price,
                createdAt: new Date().toISOString(),
            };
            transaction.set(listingRef, newListing);
        });

    }, [user, userData]);

    const purchaseTitle = useCallback(async (listing: MarketplaceListing) => {
        if (!user || !userData || !db) throw new Error("Authentication required.");
        if (user.uid === listing.sellerId) throw new Error("You cannot buy your own item.");
        if ((userData.aetherShards || 0) < listing.price) throw new Error("Not enough Aether Shards.");

        await runTransaction(db!, async (transaction) => {
            const buyerRef = doc(db!, 'users', user.uid);
            const sellerRef = doc(db!, 'users', listing.sellerId);
            const listingRef = doc(db!, 'marketplace_listings', listing.id);

            const sellerDoc = await transaction.get(sellerRef);
            if (!sellerDoc.exists()) throw new Error("Seller not found.");
            
            transaction.update(buyerRef, { 
                aetherShards: (userData.aetherShards || 0) - listing.price,
                unlockedAchievements: arrayUnion(listing.itemId)
            });

            transaction.update(sellerRef, {
                aetherShards: (sellerDoc.data().aetherShards || 0) + listing.price
            });

            transaction.delete(listingRef);
        });

    }, [user, userData]);

    const cancelListing = useCallback(async (listingId: string) => {
        if (!user || !db) throw new Error("Authentication required.");
        
        const listingRef = doc(db!, 'marketplace_listings', listingId);
        const listingSnap = await getDoc(listingRef);

        if (!listingSnap.exists() || listingSnap.data().sellerId !== user.uid) {
            throw new Error("Listing not found or you are not the seller.");
        }

        const itemId = listingSnap.data().itemId;

        const batch = writeBatch(db!);
        
        const userRef = doc(db!, 'users', user.uid);
        batch.update(userRef, { unlockedAchievements: arrayUnion(itemId) });
        
        batch.delete(listingRef);

        await batch.commit();
    }, [user]);

    return (
        <FriendContext.Provider value={{ 
            sendFriendRequest,
            acceptFriendRequest,
            declineFriendRequest,
            cancelFriendRequest,
            getFriendData,
            updateFriendNickname,
            sendRelationshipProposal,
            acceptRelationshipProposal,
            declineRelationshipProposal,
            cancelRelationshipProposal,
            incomingRequests, 
            pendingRequests, 
            friends,
            incomingRelationshipProposals,
            pendingRelationshipProposals,
            pendingRelationshipProposalForFriend,
            incomingRelationshipProposalFromFriend,
            getPublicUserData,
            unfriend,
            suggestedFriends,
            globalListings,
            userListings,
            listTitleForSale,
            purchaseTitle,
            cancelListing,
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
