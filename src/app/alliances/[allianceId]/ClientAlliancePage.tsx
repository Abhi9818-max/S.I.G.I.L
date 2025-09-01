
"use client";

import React, { useState, useEffect } from 'react';
import { calculateUserLevelInfo } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientHeader from '@/components/ClientHeader';
import { differenceInDays, parseISO, formatDistanceToNowStrict } from 'date-fns';
import Link from 'next/link';
import { doc, getDoc, collection, query, where, documentId, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Alliance, UserData, SearchedUser, AllianceInvitation, Friend } from '@/types';
import { Target, Users, Calendar, UserPlus, Eye, Send, UserCheck, ShieldPlus } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import Image from 'next/image';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

// Simple hash function to get a number from a string
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
};

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

type MemberWithStatus = UserData & {
    isFriend: boolean;
    isPending: boolean;
    isIncoming: boolean;
};

const InviteFriendsDialog = ({
    isOpen,
    onOpenChange,
    alliance,
    friends,
    pendingInvites,
    onInvite,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    alliance: Alliance;
    friends: Friend[];
    pendingInvites: AllianceInvitation[];
    onInvite: (friend: Friend) => Promise<void>;
}) => {
    const eligibleFriends = friends.filter(
        (f) => !alliance.memberIds.includes(f.uid)
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Friends to {alliance.name}</DialogTitle>
                    <DialogDescription>
                        Select friends to invite to join your alliance.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-3">
                        {eligibleFriends.length > 0 ? (
                            eligibleFriends.map((friend) => {
                                const isInvitePending = pendingInvites.some(
                                    (invite) => invite.recipientId === friend.uid
                                );
                                return (
                                    <div
                                        key={friend.uid}
                                        className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage
                                                    src={getAvatarForId(friend.uid, friend.photoURL)}
                                                />
                                                <AvatarFallback>
                                                    {friend.username.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>{friend.nickname || friend.username}</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => onInvite(friend)}
                                            disabled={isInvitePending}
                                        >
                                            {isInvitePending ? (
                                                <>
                                                    <UserCheck className="mr-2 h-4 w-4" /> Invited
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="mr-2 h-4 w-4" /> Invite
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                );
                            })
                        ) : (
                            <p className="text-center text-muted-foreground p-4">
                                All of your friends are already in this alliance.
                            </p>
                        )}
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default function ClientAlliancePage({ allianceId }: { allianceId: string }) {
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<AllianceInvitation[]>([]);

  const { user } = useAuth();
  const { friends, pendingRequests, incomingRequests, sendFriendRequest, sendAllianceInvitation, getPendingAllianceInvitesFor } = useFriends();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchAllianceData() {
      if (!db || !allianceId) return;
      
      try {
        const allianceRef = doc(db, 'alliances', allianceId as string);
        const allianceSnap = await getDoc(allianceRef);

        if (allianceSnap.exists()) {
          const allianceData = { id: allianceSnap.id, ...allianceSnap.data() } as Alliance;
          setAlliance(allianceData);
          
          const memberIds = allianceData.memberIds;
          if (memberIds && memberIds.length > 0) {
            const chunks = [];
            for (let i = 0; i < memberIds.length; i += 30) {
              chunks.push(memberIds.slice(i, i + 30));
            }

            const memberPromises = chunks.map(chunk => {
              const usersQuery = query(collection(db, 'users'), where(documentId(), 'in', chunk));
              return getDocs(usersQuery);
            });
            
            const snapshots = await Promise.all(memberPromises);
            const membersData = snapshots.flatMap(snapshot => 
              snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserData))
            );

            const membersWithStatus = membersData.map(member => ({
              ...member,
              isFriend: friends.some(f => f.uid === member.uid),
              isPending: pendingRequests.some(req => req.recipientId === member.uid),
              isIncoming: incomingRequests.some(req => req.senderId === member.uid)
            }));
            setMembers(membersWithStatus);
          }
        } else {
          setAlliance(null);
        }
      } catch (error) {
        console.error("Error fetching alliance data:", error);
        setAlliance(null);
      } finally {
        setLoading(false);
      }
    }

    fetchAllianceData();
  }, [allianceId, friends, pendingRequests, incomingRequests]);
  
  const handleAddFriend = async (member: UserData) => {
    if (!member.uid || !member.username) {
        toast({ title: "Error", description: "Cannot add this user.", variant: "destructive" });
        return;
    }
    const recipient: SearchedUser = {
        uid: member.uid,
        username: member.username,
        photoURL: member.photoURL
    };
    try {
        await sendFriendRequest(recipient);
        toast({ title: "Friend Request Sent", description: `Your request has been sent to ${member.username}.` });
    } catch (e) {
        toast({ title: "Error", description: (e as Error).message, variant: "destructive" });
    }
  }

  const handleOpenInviteDialog = async () => {
    if (!alliance) return;
    try {
        const invites = await getPendingAllianceInvitesFor(alliance.id);
        setPendingInvites(invites);
        setIsInviteDialogOpen(true);
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Could not fetch pending invitations.',
            variant: 'destructive',
        });
    }
  };
  
  const handleInviteFriend = async (friend: Friend) => {
    if (!alliance) return;
    try {
        await sendAllianceInvitation(alliance.id, alliance.name, friend.uid);
        toast({
            title: 'Invitation Sent',
            description: `Invitation sent to ${friend.nickname || friend.username}.`,
        });
        // Refresh pending invites list
        const invites = await getPendingAllianceInvitesFor(alliance.id);
        setPendingInvites(invites);
    } catch (error) {
        toast({
            title: 'Error',
            description: (error as Error).message,
            variant: 'destructive',
        });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ClientHeader />
        <main className="text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Loading Alliance...</h1>
          <Skeleton className="w-64 h-8 mx-auto" />
        </main>
      </div>
    );
  }

  if (!alliance) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <ClientHeader />
        <main className="text-center p-4">
          <h1 className="text-2xl font-bold mb-4">Alliance Not Found</h1>
          <p className="text-muted-foreground">The alliance you are looking for does not exist or could not be loaded.</p>
          <Link href="/alliances" className="mt-4 inline-block text-blue-500 hover:underline">
            &larr; Back to Alliances
          </Link>
        </main>
      </div>
    );
  }
  
  const totalExperience = 0; // Alliances don't have XP, this is a placeholder
  const levelInfo = calculateUserLevelInfo(totalExperience);
  const pageTierClass = `page-tier-group-${levelInfo.tierGroup}`;
  const daysLeft = differenceInDays(parseISO(alliance.endDate), new Date());
  const progressPercentage = Math.min(100, (alliance.progress / alliance.target) * 100);
  const isCreator = user?.uid === alliance.creatorId;

  return (
    <>
    <div className={cn('min-h-screen flex flex-col bg-background', pageTierClass)}>
      <ClientHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Image src={alliance.photoURL} alt={alliance.name} width={96} height={96} className="rounded-lg border-2 border-primary/20 object-cover" />
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">{alliance.name}</h1>
            <p className="text-muted-foreground mt-1">{alliance.description}</p>
          </div>
        </div>

        <div>
            <div className="flex items-center gap-2 mb-2">
                <Target className="h-5 w-5" style={{ color: alliance.taskColor }} />
                <h2 className="text-xl font-semibold">Objective: {alliance.taskName}</h2>
            </div>
            <div className="space-y-2">
                 <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{ backgroundColor: alliance.taskColor }} />
                 <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{alliance.progress.toLocaleString()} / {alliance.target.toLocaleString()} ({progressPercentage.toFixed(1)}%)</span>
                    <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        <span>
                            {daysLeft >= 0 ? `${formatDistanceToNowStrict(parseISO(alliance.endDate))} remaining` : 'Ended'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <div>
            <div className="flex items-center justify-between gap-2 mb-4">
                 <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Members ({members.length})</h2>
                </div>
                {isCreator && (
                    <Button variant="outline" size="sm" onClick={handleOpenInviteDialog}>
                        <ShieldPlus className="mr-2 h-4 w-4" />
                        Invite Friends
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-4">
                {members.map(member => (
                    <Popover key={member.uid}>
                        <PopoverTrigger asChild>
                            <button aria-label={`View options for ${member.username}`}>
                                <Avatar className="h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all hover:scale-105">
                                    <AvatarImage src={getAvatarForId(member.uid!, member.photoURL)} />
                                    <AvatarFallback>{member.username?.charAt(0) || '?'}</AvatarFallback>
                                </Avatar>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="flex flex-col gap-2 items-center text-center">
                                <p className="font-semibold">{member.username}</p>
                                {member.uid === user?.uid ? (
                                    <Badge variant="secondary">This is you</Badge>
                                ) : member.isFriend ? (
                                    <Button asChild size="sm">
                                      <Link href={`/friends/${member.uid}`}>
                                        <Eye className="mr-2 h-4 w-4" /> View Profile
                                      </Link>
                                    </Button>
                                ) : member.isPending ? (
                                    <Badge variant="outline">Request Sent</Badge>
                                ) : member.isIncoming ? (
                                    <Badge variant="secondary">Check Requests</Badge>
                                ) : (
                                    <Button size="sm" variant="outline" onClick={() => handleAddFriend(member)}>
                                        <UserPlus className="mr-2 h-4 w-4"/>
                                        Add Friend
                                    </Button>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                ))}
            </div>
        </div>

        <div className="text-center">
          <Link href="/alliances" className="text-blue-500 hover:underline">
            &larr; Back to Alliances
          </Link>
        </div>
      </main>
    </div>
    {alliance && (
        <InviteFriendsDialog
            isOpen={isInviteDialogOpen}
            onOpenChange={setIsInviteDialogOpen}
            alliance={alliance}
            friends={friends}
            pendingInvites={pendingInvites}
            onInvite={handleInviteFriend}
        />
    )}
    </>
  );
}
