
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { collection, query, where, getDocs, doc, setDoc, writeBatch, getDoc, deleteDoc, updateDoc, arrayUnion, arrayRemove, addDoc, onSnapshot, Unsubscribe, documentId, limit, or, and, runTransaction, DocumentReference, orderBy, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import type { Alliance, AllianceMember, AllianceInvitation, AllianceChallenge, AllianceStatus } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from 'next/navigation';
import { useUserRecords } from './UserRecordsProvider';
import { useFriends } from './FriendProvider';

interface AllianceContextType {
    createAlliance: (allianceData: Omit<Alliance, 'id' | 'creatorId' | 'members' | 'progress' | 'memberIds' | 'createdAt' | 'status'>) => Promise<string>;
    userAlliances: Alliance[];
    getAllianceWithMembers: (allianceId: string) => Promise<{allianceData: Alliance, membersData: AllianceMember[]} | null>;
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
    updateAlliancePhoto: (allianceId: string, photoURL: string) => Promise<void>;
    updateAllianceProgress: (allianceId: string, value: number) => Promise<void>;
    updateMemberContribution: (allianceId: string, memberId: string, xpValue: number) => Promise<void>;
    togglePinAlliance: (allianceId: string) => Promise<void>;
}

const AllianceContext = createContext<AllianceContextType | undefined>(undefined);

export const AllianceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { user, userData, updateUserDataInDb } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const { createNotification } = useFriends();

    const [userAlliances, setUserAlliances] = useState<Alliance[]>([]);
    const [incomingAllianceInvitations, setIncomingAllianceInvitations] = useState<AllianceInvitation[]>([]);
    const [incomingAllianceChallenges, setIncomingAllianceChallenges] = useState<AllianceChallenge[]>([]);
    
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

    // Listener for incoming invitations
    useEffect(() => {
        if (!user || !db) return;
        const invitationUnsubscribe = onSnapshot(query(collection(db, 'alliance_invitations'), where('recipientId', '==', user.uid)), (snapshot) => {
             const invites = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AllianceInvitation));
             setIncomingAllianceInvitations(invites);
        });
        return () => invitationUnsubscribe();
    }, [user]);

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

    const getAllianceWithMembers = useCallback(async (allianceId: string): Promise<{allianceData: Alliance, membersData: AllianceMember[]} | null> => {
        if (!db) return null;
        const allianceRef = doc(db!, 'alliances', allianceId);
        const allianceSnap = await getDoc(allianceRef);

        if (!allianceSnap.exists()) return null;

        const allianceData = { id: allianceSnap.id, ...allianceSnap.data() } as Alliance;
        return { allianceData, membersData: allianceData.members };
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
    
        for (const docSnap of querySnapshot.docs) {
            const allianceData = docSnap.data() as Alliance;
    
            // Handle active challenges
            if (allianceData.activeChallengeId && allianceData.opponentDetails?.allianceId) {
                const opponentAllianceRef = doc(db!, 'alliances', allianceData.opponentDetails.allianceId);
                // Opponent wins by forfeit. Set their view of opponent's progress to 0 and clear challenge.
                batch.update(opponentAllianceRef, {
                    'opponentDetails.opponentProgress': 0,
                    'activeChallengeId': null
                });
            }
    
            // Delete the alliance itself
            batch.delete(docSnap.ref);
        }
    
        await batch.commit();
        toast({ title: "Alliances Deleted", description: "All alliances created by you have been removed." });
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
        const recipientData = recipientDoc.data() as any;
        
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
        await createNotification(recipientId, 'alliance_invite', `invited you to join the alliance "${allianceName}".`, `/alliances`, { ...newInvite, id: invitationId });

    }, [user, userData, createNotification]);

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
        await createNotification(invitation.senderId, 'friend_activity', `accepted your invitation to join ${invitation.allianceName}!`, `/alliances/${invitation.allianceId}`);
        toast({ title: "Joined Alliance!", description: `You are now a member of ${invitation.allianceName}.` });
        router.push(`/alliances/${invitation.allianceId}`);
    }, [user, userData, toast, router, createNotification]);
    
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
        const q = query(
            alliancesRef, 
            where('status', '==', 'ongoing'),
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
        await createNotification(challengedAlliance.creatorId, 'alliance_challenge', `has challenged your alliance "${challengedAlliance.name}" to a duel!`, `/alliances`, { ...newChallenge, id: challengeId });
    }, [user, createNotification]);

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
                opponentProgress: 0,
            }
        });

        const challengedAllianceRef = doc(db!, 'alliances', challenge.challengedAllianceId);
        batch.update(challengedAllianceRef, {
            activeChallengeId: challenge.id,
            opponentDetails: {
                allianceId: challenge.challengerAllianceId,
                allianceName: challenge.challengerAllianceName,
                opponentProgress: 0,
            }
        });

        await batch.commit();
        await createNotification(challenge.challengerCreatorId, 'friend_activity', `accepted your challenge! The battle between your alliances has begun.`, `/alliances/${challenge.challengerAllianceId}`);
        toast({ title: "Challenge Accepted!", description: `The battle with ${challenge.challengerAllianceName} begins.` });
    }, [toast, createNotification]);

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

    const updateAlliancePhoto = useCallback(async (allianceId: string, photoURL: string) => {
        if (!db) return;
        const allianceRef = doc(db, 'alliances', allianceId);
        await updateDoc(allianceRef, { photoURL });
    }, []);

    const updateAllianceProgress = useCallback(async (allianceId: string, value: number) => {
        if (!user || !db) throw new Error("Authentication required.");
        
        try {
            await runTransaction(db, async (transaction) => {
                const allianceRef = doc(db, 'alliances', allianceId);
                const allianceDoc = await transaction.get(allianceRef);
                if (!allianceDoc.exists()) {
                    throw new Error("Alliance does not exist!");
                }
                
                const allianceData = allianceDoc.data() as Alliance;
                const newProgress = (allianceData.progress || 0) + value;
                transaction.update(allianceRef, { progress: newProgress });

                // If in a challenge, update opponent's view of my progress
                if (allianceData.activeChallengeId && allianceData.opponentDetails?.allianceId) {
                    const opponentAllianceRef = doc(db, 'alliances', allianceData.opponentDetails.allianceId);
                    // This update doesn't need to be in the transaction if it's just for display
                    // and not critical for consistency, but it's safer this way.
                    transaction.update(opponentAllianceRef, { 
                        'opponentDetails.opponentProgress': newProgress
                    });
                }
            });
        } catch (error) {
            console.error("Error updating alliance progress:", error);
            // Optionally re-throw or handle the error
        }
    }, [user]);

    const updateMemberContribution = useCallback(async (allianceId: string, memberId: string, xpValue: number) => {
        if (!db) return;
        const allianceRef = doc(db, 'alliances', allianceId);
        
        try {
            await runTransaction(db, async (transaction) => {
                const allianceDoc = await transaction.get(allianceRef);
                if (!allianceDoc.exists()) {
                    throw new Error("Alliance does not exist!");
                }
                const allianceData = allianceDoc.data() as Alliance;
                const updatedMembers = allianceData.members.map(member => {
                    if (member.uid === memberId) {
                        return { ...member, contribution: (member.contribution || 0) + xpValue };
                    }
                    return member;
                });
                transaction.update(allianceRef, { members: updatedMembers });
            });
        } catch (error) {
            console.error("Error updating member contribution:", error);
        }
    }, []);

    const togglePinAlliance = useCallback(async (allianceId: string) => {
        if (!user || !userData) return;
        const currentPins = userData.pinnedAllianceIds || [];
        const isPinned = currentPins.includes(allianceId);
        const newPins = isPinned
            ? currentPins.filter(id => id !== allianceId)
            : [...currentPins, allianceId];
        
        await updateUserDataInDb({ pinnedAllianceIds: newPins });
        toast({
            title: isPinned ? 'Alliance Unpinned' : 'Alliance Pinned',
            description: `The alliance has been ${isPinned ? 'unpinned' : 'pinned'}.`,
        });
    }, [user, userData, updateUserDataInDb, toast]);
    
    return (
        <AllianceContext.Provider value={{
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
            updateAlliancePhoto,
            updateAllianceProgress,
            updateMemberContribution,
            togglePinAlliance,
        }}>
            {children}
        </AllianceContext.Provider>
    );
};

export const useAlliance = (): AllianceContextType => {
    const context = useContext(AllianceContext);
    if (context === undefined) {
        throw new Error('useAlliance must be used within an AllianceProvider');
    }
    return context;
};
