
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, addDoc, onSnapshot, Unsubscribe, documentId, limit, or } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { SearchedUser, FriendRequest, Friend, UserData, RelationshipProposal, Alliance, AllianceMember, AllianceInvitation, Kudo, AllianceChallenge } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { parseISO, isWithinInterval } from 'date-fns';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

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
    sendKudo: (recipientId: string, type: 'kudos' | 'nudge', message: string) => Promise<Kudo>;
    getKudos: (recipientId: string) => Promise<Kudo[]>;
    // Alliances
    createAlliance: (allianceData: Omit<Alliance, 'id' | 'creatorId' | 'members' | 'progress' | 'memberIds' | 'createdAt'>) => Promise<string>;
    userAlliances: Alliance[];
    getAllianceWithMembers: (allianceId: string) => Promise<Alliance | null>;
    leaveAlliance: (allianceId: string, memberId: string) => Promise<void>;
    disbandAlliance: (allianceId: string) => Promise<void>;
    sendAllianceInvitation: (allianceId: string, allianceName: string, recipientId: string) => Promise<void>;
    acceptAllianceInvitation: (invitation: AllianceInvitation) => Promise<void>;
    declineAllianceInvitation: (invitationId: string) => Promise<void>;
    getPendingAllianceInvitesFor: (allianceId: string) => Promise<AllianceInvitation[]>;
    incomingAllianceInvitations: AllianceInvitation[];
    setAllianceDare: (allianceId: string, dare: string) => Promise<void>;
    searchAlliances: (name: string) => Promise<Alliance[]>;
    sendAllianceChallenge: (challengerAlliance: Alliance, challengedAlliance: Alliance) => Promise<void>;
    updateAlliance: (allianceId: string, data: Partial<Pick<Alliance, 'name' | 'description' | 'target' | 'startDate' | 'endDate'>>) => Promise<void>;
}

const FriendContext = createContext<FriendContextType | undefined>(undefined);

export const FriendProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const router = useRouter();

    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRelationshipProposals, setIncomingRelationshipProposals] = useState<RelationshipProposal[]>([]);
    const [pendingRelationshipProposals, setPendingRelationshipProposals] = useState<RelationshipProposal[]>([]);
    const [userAlliances, setUserAlliances] = useState<Alliance[]>([]);
    const [incomingAllianceInvitations, setIncomingAllianceInvitations] = useState<AllianceInvitation[]>([]);

    useEffect(() => {
        if (!user) {
            setUserAlliances([]);
            return;
        };

        const alliancesQuery = query(collection(db, 'alliances'), where('memberIds', 'array-contains', user.uid));
        
        const unsubscribe = onSnapshot(alliancesQuery, (snapshot) => {
            const alliancesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alliance));
            setUserAlliances(alliancesData);
        });

        return () => unsubscribe();
    }, [user]);

    const fetchFriendsAndRequests = useCallback(async () => {
        if (!user) return;

        // Fetch incoming friend requests
        const incomingQuery = query(collection(db, 'friend_requests'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
        const incomingSnapshot = await getDocs(incomingQuery);
        setIncomingRequests(incomingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));

        // Fetch sent/pending friend requests
        const pendingQuery = query(collection(db, 'friend_requests'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const pendingSnapshot = await getDocs(pendingQuery);
        setPendingRequests(pendingSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FriendRequest)));
        
        // Fetch friends list
        const friendsQuery = collection(db, `users/${user.uid}/friends`);
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendsListPromises = friendsSnapshot.docs.map(async (friendDoc) => {
            const friendId = friendDoc.id;
            const friendDocData = friendDoc.data();
            const userDocRef = doc(db, 'users', friendId);
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
                };
            }
            return null;
        });
        setFriends((await Promise.all(friendsListPromises)).filter(Boolean) as Friend[]);
        
        // Fetch incoming relationship proposals
        const incomingRelQuery = query(collection(db, 'relationship_proposals'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
        const incomingRelSnapshot = await getDocs(incomingRelQuery);
        setIncomingRelationshipProposals(incomingRelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RelationshipProposal)));

        // Fetch sent/pending relationship proposals
        const pendingRelQuery = query(collection(db, 'relationship_proposals'), where('senderId', '==', user.uid), where('status', '==', 'pending'));
        const pendingRelSnapshot = await getDocs(pendingRelQuery);
        setPendingRelationshipProposals(pendingRelSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as RelationshipProposal)));
        
        // Fetch incoming alliance invitations
        const incomingAllianceQuery = query(collection(db, 'alliance_invitations'), where('recipientId', '==', user.uid), where('status', '==', 'pending'));
        const incomingAllianceSnapshot = await getDocs(incomingAllianceQuery);
        setIncomingAllianceInvitations(incomingAllianceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AllianceInvitation)));

    }, [user]);

    useEffect(() => {
        if (user) {
            const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
                fetchFriendsAndRequests();
            });
            return () => unsub();
        } else {
             setIncomingRequests([]);
             setPendingRequests([]);
             setFriends([]);
             setIncomingRelationshipProposals([]);
             setPendingRelationshipProposals([]);
             setIncomingAllianceInvitations([]);
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

    const sendFriendRequest = useCallback(async (recipient: SearchedUser) => {
        if (!user || !userData) throw new Error("You must be logged in to send requests.");
        if (user.uid === recipient.uid) throw new Error("You cannot send a request to yourself.");

        const requestId = `${user.uid}_${recipient.uid}`;
        const reverseRequestId = `${recipient.uid}_${user.uid}`;
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
            senderPhotoURL: userData.photoURL,
            recipientId: recipient.uid,
            recipientUsername: recipient.username,
            recipientPhotoURL: recipient.photoURL,
            status: 'pending',
            createdAt: new Date().toISOString(),
        };

        await setDoc(requestRef, newRequest);
        await fetchFriendsAndRequests();
    }, [user, userData, fetchFriendsAndRequests]);

    const acceptFriendRequest = useCallback(async (request: FriendRequest) => {
        if (!user || !userData) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }

        const batch = writeBatch(db);

        const currentUserFriendRef = doc(db, `users/${user.uid}/friends`, request.senderId);
        batch.set(currentUserFriendRef, { 
            uid: request.senderId, 
            username: request.senderUsername, 
            since: new Date().toISOString() 
        });

        const senderFriendRef = doc(db, `users/${request.senderId}/friends`, user.uid);
        batch.set(senderFriendRef, { 
            uid: user.uid, 
            username: userData.username, 
            since: new Date().toISOString() 
        });
        
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

    const getPublicUserData = useCallback(async (userId: string): Promise<UserData | null> => {
        const userDocRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userDocRef);
        
        if (docSnap.exists()) {
            return docSnap.data() as UserData;
        }
        return null;
    }, []);

    const updateFriendNickname = useCallback(async (friendId: string, nickname: string) => {
        if (!user) return;
        const friendRef = doc(db, `users/${user.uid}/friends`, friendId);
        await updateDoc(friendRef, { nickname });
        await fetchFriendsAndRequests();
    }, [user, fetchFriendsAndRequests]);

    const unfriend = useCallback(async (friendId: string) => {
        if (!user) throw new Error("You must be logged in.");

        const batch = writeBatch(db);

        // Remove friend from current user's friend list
        const currentUserFriendRef = doc(db, `users/${user.uid}/friends`, friendId);
        batch.delete(currentUserFriendRef);

        // Remove current user from friend's friend list
        const friendUserRef = doc(db, `users/${friendId}/friends`, user.uid);
        batch.delete(friendUserRef);

        try {
            await batch.commit();
            await fetchFriendsAndRequests();
            toast({ title: "Friend Removed", description: "They are no longer on your friends list." });
            router.push('/friends');
        } catch (error) {
            console.error("Failed to unfriend:", error);
            toast({ title: 'Error', description: 'Could not remove friend.', variant: 'destructive' });
        }
    }, [user, fetchFriendsAndRequests, toast, router]);

    const sendRelationshipProposal = useCallback(async (friendId: string, recipientUsername: string, recipientPhotoURL: string | null | undefined, relationship: string) => {
        if (!user || !userData) throw new Error("You must be logged in.");

        if (relationship === 'none') {
            const batch = writeBatch(db);
            const userFriendRef = doc(db, `users/${user.uid}/friends`, friendId);
            batch.update(userFriendRef, { relationship: '' });
            const friendUserRef = doc(db, `users/${friendId}/friends`, user.uid);
            batch.update(friendUserRef, { relationship: '' });
            await batch.commit();
            await fetchFriendsAndRequests();
            return;
        }

        const proposalId = `${user.uid}_${friendId}`;
        const existingProposalRef = doc(db, 'relationship_proposals', proposalId);
        const existingReverseProposalRef = doc(db, 'relationship_proposals', `${friendId}_${user.uid}`);
        
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
        await fetchFriendsAndRequests();
    }, [user, userData, fetchFriendsAndRequests]);
    
    const acceptRelationshipProposal = useCallback(async (proposal: RelationshipProposal) => {
        if (!user) return;
        const batch = writeBatch(db);

        const userFriendRef = doc(db, `users/${user.uid}/friends`, proposal.senderId);
        batch.update(userFriendRef, { relationship: proposal.correspondingRelationship });
        
        const senderFriendRef = doc(db, `users/${proposal.senderId}/friends`, user.uid);
        batch.update(senderFriendRef, { relationship: proposal.relationship });

        const proposalRef = doc(db, 'relationship_proposals', proposal.id);
        batch.delete(proposalRef);

        await batch.commit();
        await fetchFriendsAndRequests();
        toast({ title: "Relationship Updated!", description: `You are now ${proposal.correspondingRelationship} with ${proposal.senderUsername}.` });
    }, [user, fetchFriendsAndRequests, toast]);

    const declineRelationshipProposal = useCallback(async (proposalId: string) => {
        await deleteDoc(doc(db, 'relationship_proposals', proposalId));
        await fetchFriendsAndRequests();
        toast({ title: 'Proposal Declined', variant: 'destructive' });
    }, [fetchFriendsAndRequests, toast]);

    const cancelRelationshipProposal = useCallback(async (proposalId: string) => {
        await deleteDoc(doc(db, 'relationship_proposals', proposalId));
        await fetchFriendsAndRequests();
        toast({ title: 'Proposal Cancelled' });
    }, [fetchFriendsAndRequests, toast]);
    
    const pendingRelationshipProposalForFriend = useCallback((friendId: string) => {
        return pendingRelationshipProposals.find(p => p.recipientId === friendId);
    }, [pendingRelationshipProposals]);
    
    const incomingRelationshipProposalFromFriend = useCallback((friendId: string) => {
        return incomingRelationshipProposals.find(p => p.senderId === friendId);
    }, [incomingRelationshipProposals]);

    const sendKudo = useCallback(async (recipientId: string, type: 'kudos' | 'nudge', message: string): Promise<Kudo> => {
        if (!user) throw new Error("Authentication required.");

        const newKudo: Kudo = {
            id: uuidv4(),
            senderId: user.uid,
            type,
            message,
            createdAt: new Date().toISOString(),
        };

        const userDocRef = doc(db, 'users', recipientId);
        await updateDoc(userDocRef, {
            kudos: arrayUnion(newKudo)
        });

        return newKudo;
    }, [user]);

    const getKudos = useCallback(async (recipientId: string): Promise<Kudo[]> => {
        const userDocRef = doc(db, 'users', recipientId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            const data = userDocSnap.data() as UserData;
            return data.kudos || [];
        }
        return [];
    }, []);

    // Alliance Functions
    const createAlliance = useCallback(async (allianceData: Omit<Alliance, 'id' | 'creatorId' | 'members' | 'progress' | 'memberIds' | 'createdAt'>): Promise<string> => {
        if (!user || !userData) throw new Error("Authentication required.");
        
        const newAllianceData = {
            ...allianceData,
            creatorId: user.uid,
            members: [{
                uid: user.uid,
                username: userData.username,
                nickname: userData.username,
                photoURL: userData.photoURL
            }],
            memberIds: [user.uid],
            progress: 0,
            createdAt: new Date().toISOString()
        };
        
        const docRef = await addDoc(collection(db, 'alliances'), newAllianceData);
        return docRef.id;
    }, [user, userData]);

     const getAllianceWithMembers = useCallback(async (allianceId: string): Promise<Alliance | null> => {
        const allianceRef = doc(db, 'alliances', allianceId);
        const allianceSnap = await getDoc(allianceRef);

        if (!allianceSnap.exists()) return null;

        const allianceData = allianceSnap.data() as Alliance;
        const memberIds = allianceData.memberIds || [];
        
        if (memberIds.length === 0) {
            return { ...allianceData, members: [], progress: 0 };
        }

        const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', memberIds));
        const usersSnapshot = await getDocs(usersQuery);
        const membersData = usersSnapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData));

        const friendsSnapshot = user ? await getDocs(collection(db, `users/${user.uid}/friends`)) : null;
        const nicknames = new Map<string, string>();
        friendsSnapshot?.docs.forEach(doc => {
            if (doc.data().nickname) {
                nicknames.set(doc.id, doc.data().nickname);
            }
        });
        
        const startDate = parseISO(allianceData.startDate);
        const endDate = parseISO(allianceData.endDate);
        let totalProgress = 0;

        const members: AllianceMember[] = membersData.map(m => {
            const memberRecords = m.records || [];
            const relevantRecords = memberRecords.filter(r => {
                return r.taskType === allianceData.taskId && isWithinInterval(parseISO(r.date), { start: startDate, end: endDate });
            });
            const contribution = relevantRecords.reduce((sum, r) => sum + r.value, 0);
            totalProgress += contribution;

            return {
                uid: m.uid!,
                username: m.username,
                photoURL: m.photoURL,
                nickname: nicknames.get(m.uid!) || m.username,
                contribution: contribution,
            };
        });

        return { ...allianceData, members, progress: totalProgress };
    }, [user]);

    const leaveAlliance = useCallback(async (allianceId: string, memberId: string) => {
        const allianceRef = doc(db, 'alliances', allianceId);
        const allianceSnap = await getDoc(allianceRef);
        if (!allianceSnap.exists()) throw new Error("Alliance not found.");

        const batch = writeBatch(db);
        batch.update(allianceRef, {
            memberIds: arrayRemove(memberId)
        });

        // The members array update is tricky with arrayRemove for objects.
        // It's often better to read, modify, and write the whole array.
        const currentData = allianceSnap.data() as Alliance;
        const updatedMembers = currentData.members.filter(m => m.uid !== memberId);
        batch.update(allianceRef, { members: updatedMembers });

        await batch.commit();

    }, []);

    const disbandAlliance = useCallback(async (allianceId: string) => {
        const allianceRef = doc(db, 'alliances', allianceId);
        const challengesRef = collection(allianceRef, 'challenges');
        
        const challengesSnapshot = await getDocs(challengesRef);
        const batch = writeBatch(db);
        challengesSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        batch.delete(allianceRef);

        await batch.commit();
    }, []);

    const sendAllianceInvitation = useCallback(async (allianceId: string, allianceName: string, recipientId: string) => {
        if (!user || !userData) throw new Error("Authentication required.");

        const invitationId = `${user.uid}_${recipientId}_${allianceId}`;
        const inviteRef = doc(db, 'alliance_invitations', invitationId);
        const inviteSnap = await getDoc(inviteRef);

        if (inviteSnap.exists()) {
            throw new Error("Invitation already sent.");
        }

        const recipientDoc = await getDoc(doc(db, 'users', recipientId));
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
        await fetchFriendsAndRequests();

    }, [user, userData, fetchFriendsAndRequests]);

    const acceptAllianceInvitation = useCallback(async (invitation: AllianceInvitation) => {
        if (!user || !userData) throw new Error("Authentication required.");
        
        const allianceRef = doc(db, 'alliances', invitation.allianceId);
        const allianceSnap = await getDoc(allianceRef);
        if(!allianceSnap.exists()) throw new Error("Alliance no longer exists.");

        const newMember: AllianceMember = {
            uid: user.uid,
            username: userData.username,
            nickname: userData.username,
            photoURL: userData.photoURL
        };

        await updateDoc(allianceRef, {
            memberIds: arrayUnion(user.uid),
            members: arrayUnion(newMember)
        });

        await deleteDoc(doc(db, 'alliance_invitations', invitation.id));
        await fetchFriendsAndRequests();
        toast({ title: "Joined Alliance!", description: `You are now a member of ${invitation.allianceName}.` });
        router.push(`/alliances/${invitation.allianceId}`);
    }, [user, userData, fetchFriendsAndRequests, toast, router]);
    
    const declineAllianceInvitation = useCallback(async (invitationId: string) => {
        await deleteDoc(doc(db, 'alliance_invitations', invitationId));
        await fetchFriendsAndRequests();
        toast({ title: 'Invitation Declined', variant: 'destructive' });
    }, [fetchFriendsAndRequests, toast]);

    const getPendingAllianceInvitesFor = useCallback(async (allianceId: string): Promise<AllianceInvitation[]> => {
        const invitesQuery = query(
            collection(db, 'alliance_invitations'),
            where('allianceId', '==', allianceId),
            where('status', '==', 'pending')
        );
        const snapshot = await getDocs(invitesQuery);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AllianceInvitation));
    }, []);

    const setAllianceDare = useCallback(async (allianceId: string, dare: string) => {
        const allianceRef = doc(db, 'alliances', allianceId);
        await updateDoc(allianceRef, { dare });
    }, []);

    const searchAlliances = useCallback(async (name: string): Promise<Alliance[]> => {
        const alliancesRef = collection(db, 'alliances');
        // Firestore doesn't support case-insensitive or partial text search natively.
        // A common workaround is to search for >= and <= a range.
        const q = query(alliancesRef, 
            where('name', '>=', name),
            where('name', '<=', name + '\uf8ff'),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alliance));
    }, []);

    const sendAllianceChallenge = useCallback(async (challengerAlliance: Alliance, challengedAlliance: Alliance) => {
        if (!user) throw new Error("Authentication required.");

        const challengeId = `${challengerAlliance.id}_${challengedAlliance.id}`;
        const reverseChallengeId = `${challengedAlliance.id}_${challengerAlliance.id}`;
        const challengeRef = doc(db, 'alliance_challenges', challengeId);
        const reverseChallengeRef = doc(db, 'alliance_challenges', reverseChallengeId);
        
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
        // We can add listening logic for challenges later if needed
    }, [user]);

    const updateAlliance = useCallback(async (allianceId: string, data: Partial<Pick<Alliance, 'name' | 'description' | 'target' | 'startDate' | 'endDate'>>) => {
        const allianceRef = doc(db, 'alliances', allianceId);
        await updateDoc(allianceRef, data);
    }, []);

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
            sendKudo,
            getKudos,
            createAlliance,
            userAlliances,
            getAllianceWithMembers,
            leaveAlliance,
            disbandAlliance,
            sendAllianceInvitation,
            acceptAllianceInvitation,
            declineAllianceInvitation,
            getPendingAllianceInvitesFor,
            incomingAllianceInvitations,
            setAllianceDare,
            searchAlliances,
            sendAllianceChallenge,
            updateAlliance,
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
