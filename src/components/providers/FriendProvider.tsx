
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, addDoc, onSnapshot, Unsubscribe, documentId, limit, or, and, runTransaction, DocumentReference, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { SearchedUser, FriendRequest, Friend, UserData, RelationshipProposal, Alliance, AllianceMember, AllianceInvitation, AllianceChallenge, AllianceStatus, MarketplaceListing, RecordEntry } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { parseISO, isWithinInterval, isPast } from 'date-fns';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { useUserRecords } from './UserRecordsProvider';
import { findUserByUsername } from '@/lib/server/actions/user';

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
    searchUser: (username: string) => Promise<SearchedUser | null>;
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
    // Alliances
    createAlliance: (allianceData: Omit<Alliance, 'id' | 'creatorId' | 'members' | 'progress' | 'memberIds' | 'createdAt' | 'status'>) => Promise<string>;
    userAlliances: Alliance[];
    getAllianceWithMembers: (allianceId: string) => Promise<{allianceData: Alliance, membersData: UserData[]} | null>;
    leaveAlliance: (allianceId: string, memberId: string) => Promise<void>;
    disbandAlliance: (allianceId: string) => Promise<void>;
    deleteAllCreatedAlliances: () => Promise<void>;
    sendAllianceInvitation: (allianceId: string, allianceName: string, recipientId: string) => Promise<void>;
    acceptAllianceInvitation: (invitation: AllianceInvitation) => Promise<void>;
    declineAllianceInvitation: (invitationId: string) => Promise<void>;
    getPendingAllianceInvitesFor: (allianceId: string) => Promise<AllianceInvitation[]>;
    incomingAllianceInvitations: AllianceInvitation[];
    incomingAllianceChallenges: AllianceChallenge[];
    setAllianceDare: (allianceId: string, dare: string) => Promise<void>;
    searchAlliances: (name: string) => Promise<Alliance[]>;
    sendAllianceChallenge: (challengerAlliance: Alliance, challengedAlliance: Alliance) => Promise<void>;
    acceptAllianceChallenge: (challenge: AllianceChallenge) => Promise<void>;
    declineAllianceChallenge: (challengeId: string) => Promise<void>;
    updateAlliance: (allianceId: string, data: Partial<Pick<Alliance, 'name' | 'description' | 'target' | 'startDate' | 'endDate'>>) => Promise<void>;
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
    const { addRecord } = useUserRecords();
    const { toast } = useToast();
    const router = useRouter();

    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRelationshipProposals, setIncomingRelationshipProposals] = useState<RelationshipProposal[]>([]);
    const [pendingRelationshipProposals, setPendingRelationshipProposals] = useState<RelationshipProposal[]>([]);
    const [userAlliances, setUserAlliances] = useState<Alliance[]>([]);
    const [incomingAllianceInvitations, setIncomingAllianceInvitations] = useState<AllianceInvitation[]>([]);
    const [incomingAllianceChallenges, setIncomingAllianceChallenges] = useState<AllianceChallenge[]>([]);
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

    // Alliance data listener
    useEffect(() => {
        if (!user || !db) {
            setUserAlliances([]);
            return;
        };

        const alliancesQuery = query(collection(db!, 'alliances'), where('memberIds', 'array-contains', user.uid));
        
        const unsubscribe = onSnapshot(alliancesQuery, (snapshot) => {
            const alliancesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alliance));
            setUserAlliances(alliancesData);
        });

        return () => unsubscribe();
    }, [user]);

    // Listener for incoming alliance challenges
    useEffect(() => {
        if (!user || !db) {
            setIncomingAllianceChallenges([]);
            return;
        }

        const challengesRef = collection(db, 'alliance_challenges');
        
        const q = query(challengesRef, where('challengedCreatorId', '==', user.uid), where('status', '==', 'pending'));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const challenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AllianceChallenge));
            setIncomingAllianceChallenges(challenges);
        }, (error) => {
            console.error("Error listening to incoming alliance challenges:", error);
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
            setPendingRequests(pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
            
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
            setFriends((await Promise.all(friendsListPromises)).filter(Boolean) as Friend[]);
            
            // Fetch incoming relationship proposals
            const incomingRelQuery = query(collection(db!, 'relationship_proposals'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
            const incomingRelSnapshot = await getDocs(incomingRelQuery);
            setIncomingRelationshipProposals(incomingRelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RelationshipProposal)));

            // Fetch sent/pending relationship proposals
            const pendingRelQuery = query(collection(db!, 'relationship_proposals'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
            const pendingRelSnapshot = await getDocs(pendingRelQuery);
            setPendingRelationshipProposals(pendingRelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RelationshipProposal)));
            
            // Fetch incoming alliance invitations
            const incomingAllianceQuery = query(collection(db!, 'alliance_invitations'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
            const incomingAllianceSnapshot = await getDocs(incomingAllianceQuery);
            setIncomingAllianceInvitations(incomingAllianceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AllianceInvitation)));
            
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

        const invitationUnsubscribe = onSnapshot(query(collection(db, 'alliance_invitations'), where('recipientId', '==', user.uid)), () => {
            fetchFriendsAndRequests();
        });

        return () => {
            requestUnsubscribe();
            friendsUnsubscribe();
            proposalUnsubscribe();
            invitationUnsubscribe();
        };
    }, [user, fetchFriendsAndRequests]);

    const searchUser = useCallback(async (username: string): Promise<SearchedUser | null> => {
        return await findUserByUsername(username);
    }, []);

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
    
    // Alliance Functions
    const createAlliance = useCallback(async (allianceData: Omit<Alliance, 'id' | 'creatorId' | 'members' | 'progress' | 'memberIds' | 'createdAt' | 'status'>): Promise<string> => {
        if (!user || !userData || !db) throw new Error("Authentication required.");
        
        const newAllianceData: Omit<Alliance, 'id' | 'members'> = {
            ...allianceData,
            creatorId: user.uid,
            memberIds: [user.uid],
            progress: 0,
            createdAt: new Date().toISOString(),
            status: 'ongoing',
        };
        
        const docRef = await addDoc(collection(db!, 'alliances'), newAllianceData);
        
        // Add the creator's full member object separately
        const memberData: AllianceMember = {
            uid: user.uid,
            username: userData.username,
            nickname: userData.username,
            photoURL: userData.photoURL,
            contribution: 0
        };
        await updateDoc(docRef, { members: arrayUnion(memberData) });

        return docRef.id;
    }, [user, userData]);

    const getAllianceWithMembers = useCallback(async (allianceId: string): Promise<{allianceData: Alliance, membersData: UserData[]} | null> => {
        if (!db) return null;
        const allianceRef = doc(db!, 'alliances', allianceId);
        const allianceSnap = await getDoc(allianceRef);

        if (!allianceSnap.exists()) return null;

        const allianceData = { id: allianceSnap.id, ...allianceSnap.data() } as Alliance;

        const memberIds = allianceData.memberIds || [];
        let membersData: UserData[] = [];
        if (memberIds.length > 0) {
            const usersQuery = query(collection(db!, 'users'), where(documentId(), 'in', memberIds));
            const usersSnapshot = await getDocs(usersQuery);
            membersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));
        }
        
        return { allianceData, membersData };
    }, []);

    const leaveAlliance = useCallback(async (allianceId: string, memberId: string) => {
        if (!db) return;
        const allianceRef = doc(db!, 'alliances', allianceId);
        const allianceSnap = await getDoc(allianceRef);
        if (!allianceSnap.exists()) throw new Error("Alliance not found.");

        const batch = writeBatch(db!);
        batch.update(allianceRef, {
            memberIds: arrayRemove(memberId)
        });

        const currentData = allianceSnap.data() as Alliance;
        const updatedMembers = currentData.members.filter(m => m.uid !== memberId);
        batch.update(allianceRef, { members: updatedMembers });

        await batch.commit();

    }, []);

    const disbandAlliance = useCallback(async (allianceId: string) => {
        if (!db) return;
        const allianceRef = doc(db!, 'alliances', allianceId);
        await deleteDoc(allianceRef);
    }, []);

    const deleteAllCreatedAlliances = useCallback(async () => {
        if (!user || !db) throw new Error("Authentication required.");

        const alliancesRef = collection(db!, 'alliances');
        const q = query(alliancesRef, where('creatorId', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            toast({ title: "No Alliances Found", description: "You have not created any alliances to delete." });
            return;
        }

        const batch = writeBatch(db!);
        querySnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
    }, [user, toast]);

    const sendAllianceInvitation = useCallback(async (allianceId: string, allianceName: string, recipientId: string) => {
        if (!user || !userData || !db) throw new Error("Authentication required.");

        const invitationId = `${user.uid}_${recipientId}_${allianceId}`;
        const inviteRef = doc(db!, 'alliance_invitations', invitationId);
        const inviteSnap = await getDoc(inviteRef);

        if (inviteSnap.exists()) {
            throw new Error("Invitation already sent.");
        }

        const recipientDoc = await getDoc(doc(db!, 'users', recipientId));
        if (!recipientDoc.exists()) throw new Error("Recipient not found.");
        const recipientData = recipientDoc.data() as UserData;
        
        const newInvite: Omit<AllianceInvitation, 'id'> = {
            allianceId,
            allianceName,
            senderId: user.uid,
            senderUsername: userData.username,
            recipientId,
            recipientUsername: recipientData.username,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        await setDoc(inviteRef, newInvite);

    }, [user, userData]);

    const acceptAllianceInvitation = useCallback(async (invitation: AllianceInvitation) => {
        if (!user || !userData || !db) throw new Error("Authentication required.");
        
        const allianceRef = doc(db!, 'alliances', invitation.allianceId);
        const allianceSnap = await getDoc(allianceRef);
        if(!allianceSnap.exists()) throw new Error("Alliance no longer exists.");

        const newMember: AllianceMember = {
            uid: user.uid,
            username: userData.username,
            nickname: userData.username,
            photoURL: userData.photoURL,
            contribution: 0
        };

        await updateDoc(allianceRef, {
            memberIds: arrayUnion(user.uid),
            members: arrayUnion(newMember)
        });

        await deleteDoc(doc(db!, 'alliance_invitations', invitation.id));
        toast({ title: "Joined Alliance!", description: `You are now a member of ${invitation.allianceName}.` });
        router.push(`/alliances/${invitation.allianceId}`);
    }, [user, userData, toast, router]);
    
    const declineAllianceInvitation = useCallback(async (invitationId: string) => {
        if (!db) return;
        await deleteDoc(doc(db!, 'alliance_invitations', invitationId));
        toast({ title: 'Invitation Declined', variant: 'destructive' });
    }, [toast]);

    const getPendingAllianceInvitesFor = useCallback(async (allianceId: string): Promise<AllianceInvitation[]> => {
        if (!db) return [];
        const invitesQuery = query(
            collection(db!, 'alliance_invitations'),
            where('allianceId', '==', allianceId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(invitesQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AllianceInvitation));
    }, []);

    const setAllianceDare = useCallback(async (allianceId: string, dare: string) => {
        if (!db) return;
        const allianceRef = doc(db!, 'alliances', allianceId);
        await updateDoc(allianceRef, { dare });
    }, []);

    const searchAlliances = useCallback(async (name: string): Promise<Alliance[]> => {
        if (!db) return [];
        const alliancesRef = collection(db!, 'alliances');
        const q = query(alliancesRef, 
            where('name', '>=', name),
            where('name', '<=', name + '\uf8ff'),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alliance));
    }, []);

    const sendAllianceChallenge = useCallback(async (challengerAlliance: Alliance, challengedAlliance: Alliance) => {
        if (!user || !db) throw new Error("Authentication required.");

        const challengeId = `${challengerAlliance.id}_${challengedAlliance.id}`;
        const reverseChallengeId = `${challengedAlliance.id}_${challengerAlliance.id}`;
        const challengeRef = doc(db!, 'alliance_challenges', challengeId);
        const reverseChallengeRef = doc(db!, 'alliance_challenges', reverseChallengeId);
        
        const challengeSnap = await getDoc(challengeRef);
        const reverseChallengeSnap = await getDoc(reverseChallengeRef);

        if (challengeSnap.exists() || reverseChallengeSnap.exists()) {
            throw new Error("A challenge already exists between these two alliances.");
        }
        
        const newChallenge: Omit<AllianceChallenge, 'id'> = {
            challengerAllianceId: challengerAlliance.id,
            challengerAllianceName: challengerAlliance.name,
            challengerCreatorId: challengerAlliance.creatorId,
            challengedAllianceId: challengedAlliance.id,
            challengedAllianceName: challengedAlliance.name,
            challengedCreatorId: challengedAlliance.creatorId,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await setDoc(challengeRef, newChallenge);
    }, [user]);

    const acceptAllianceChallenge = useCallback(async (challenge: AllianceChallenge) => {
        if (!db) return;
        const batch = writeBatch(db!);
        
        const challengeRef = doc(db!, 'alliance_challenges', challenge.id);
        batch.update(challengeRef, { status: 'active' });

        const challengerAllianceRef = doc(db!, 'alliances', challenge.challengerAllianceId);
        batch.update(challengerAllianceRef, {
            activeChallengeId: challenge.id,
            opponentDetails: {
                allianceId: challenge.challengedAllianceId,
                allianceName: challenge.challengedAllianceName,
            }
        });

        const challengedAllianceRef = doc(db!, 'alliances', challenge.challengedAllianceId);
        batch.update(challengedAllianceRef, {
            activeChallengeId: challenge.id,
            opponentDetails: {
                allianceId: challenge.challengerAllianceId,
                allianceName: challenge.challengerAllianceName,
            }
        });

        await batch.commit();
        toast({ title: "Challenge Accepted!", description: `The battle with ${challenge.challengerAllianceName} begins.` });
    }, [toast]);

    const declineAllianceChallenge = useCallback(async (challengeId: string) => {
        if (!db) return;
        const challengeRef = doc(db!, 'alliance_challenges', challengeId);
        await updateDoc(challengeRef, { status: 'declined' });
        toast({ title: 'Challenge Declined', variant: 'destructive' });
    }, [toast]);

    const updateAlliance = useCallback(async (allianceId: string, data: Partial<Pick<Alliance, 'name' | 'description' | 'target' | 'startDate' | 'endDate'>>) => {
        if (!db) return;
        const allianceRef = doc(db!, 'alliances', allianceId);
        await updateDoc(allianceRef, data);
    }, []);

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
            searchUser, 
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
            createAlliance,
            userAlliances,
            getAllianceWithMembers,
            leaveAlliance,
            disbandAlliance,
            deleteAllCreatedAlliances,
            sendAllianceInvitation,
            acceptAllianceInvitation,
declineAllianceInvitation,
            getPendingAllianceInvitesFor,
            incomingAllianceInvitations,
            incomingAllianceChallenges,
            setAllianceDare,
            searchAlliances,
            sendAllianceChallenge,
            acceptAllianceChallenge,
            declineAllianceChallenge,
            updateAlliance,
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
