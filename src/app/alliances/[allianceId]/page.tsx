
"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { calculateUserLevelInfo } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ClientHeader from '@/components/ClientHeader';
import { differenceInDays, parseISO, formatDistanceToNowStrict, isPast } from 'date-fns';
import Link from 'next/link';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Alliance, UserData, SearchedUser, AllianceInvitation, Friend, AllianceMember } from '@/types';
import { Target, Users, Calendar, UserPlus, Eye, Send, UserCheck, ShieldPlus, Crown, Swords, Pin, PinOff, Download, Pencil, Trophy } from 'lucide-react';
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
import { useAlliance } from '@/components/providers/AllianceProvider';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toPng } from 'html-to-image';
import AllianceCard from '@/components/alliances/AllianceCard';
import AllianceImageSelectionDialog from '@/components/alliances/AllianceImageSelectionDialog';

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

type MemberWithStatus = AllianceMember & {
    isFriend: boolean;
    isPending: boolean;
    isIncoming: boolean;
    isTopContributor: boolean;
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

type AlliancePageProps = {
  params: { allianceId: string };
};

export default function AlliancePage({ params }: AlliancePageProps) {
  const { allianceId } = params;
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [members, setMembers] = useState<MemberWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<AllianceInvitation[]>([]);
  const [allianceToDownload, setAllianceToDownload] = useState<Alliance | null>(null);
  const [isImageSelectionOpen, setIsImageSelectionOpen] = useState(false);
  const allianceCardRef = useRef<HTMLDivElement>(null);

  const { user, userData } = useAuth();
  const { friends, pendingRequests, incomingRequests, sendFriendRequest } = useFriends();
  const { sendAllianceInvitation, getPendingAllianceInvitesFor, togglePinAlliance, updateAlliancePhoto } = useAlliance();
  const { toast } = useToast();

  useEffect(() => {
    if (!db || !allianceId) return;

    const allianceRef = doc(db, 'alliances', allianceId);
    const unsubscribe = onSnapshot(allianceRef, (docSnap) => {
        if (docSnap.exists()) {
            const allianceData = { id: docSnap.id, ...docSnap.data() } as Alliance;
            setAlliance(allianceData);
            
            const membersData = [...(allianceData.members || [])].sort((a, b) => b.contribution - a.contribution);
            
            let topContributorId = '';
            
            const allianceHasEnded = isPast(parseISO(allianceData.endDate));
            if (!allianceHasEnded && membersData.length > 0) {
              topContributorId = membersData[0].uid; // The first member is the top contributor after sorting
            }

            const membersWithStatus = membersData.map(member => ({
                ...member,
                isFriend: friends.some(f => f.uid === member.uid),
                isPending: pendingRequests.some(req => req.recipientId === member.uid),
                isIncoming: incomingRequests.some(req => req.senderId === member.uid),
                isTopContributor: member.uid === topContributorId && member.contribution > 0
            }));
            setMembers(membersWithStatus);
        } else {
            setAlliance(null);
        }
        setLoading(false);
    }, (error) => {
        console.error("Error fetching alliance data:", error);
        setAlliance(null);
        setLoading(false);
    });

    return () => unsubscribe();
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

  const handleDownloadRequest = (alliance: Alliance) => {
    setAllianceToDownload(alliance);
  };
  
  useEffect(() => {
    if (allianceToDownload && allianceCardRef.current) {
        toPng(allianceCardRef.current, { cacheBust: true, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `sigil-alliance-${allianceToDownload.name.replace(/\s+/g, '-').toLowerCase()}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error("Could not generate alliance card image", err);
                toast({
                    title: "Download Failed",
                    description: "Could not generate the alliance card image.",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setAllianceToDownload(null);
            });
    }
  }, [allianceToDownload, toast]);

  const isCreator = user?.uid === alliance?.creatorId;

  const handleImageDoubleClick = () => {
    if (isCreator) {
        setIsImageSelectionOpen(true);
    }
  };
  
  const handleImageSelect = async (newUrl: string) => {
    if (alliance) {
      await updateAlliancePhoto(alliance.id, newUrl);
      toast({
        title: "Emblem Updated",
        description: "The alliance emblem has been changed.",
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
        </main>
      </div>
    );
  }
  
  const totalExperience = 0; // Alliances don't have XP, this is a placeholder
  const levelInfo = calculateUserLevelInfo(totalExperience);
  const pageTierClass = `page-tier-group-${levelInfo.tierGroup}`;
  const daysLeft = differenceInDays(parseISO(alliance.endDate), new Date());
  const progressPercentage = Math.min(100, (alliance.progress / alliance.target) * 100);
  const opponentProgressPercentage = alliance.opponentDetails?.opponentProgress 
    ? Math.min(100, (alliance.opponentDetails.opponentProgress / alliance.target) * 100)
    : 0;
  const isPinned = (userData?.pinnedAllianceIds || []).includes(alliance.id);
  const isAllianceEnded = isPast(parseISO(alliance.endDate));

  const ChallengeResult = () => {
    if (!isAllianceEnded || !alliance.opponentDetails) return null;
  
    const myProgress = alliance.progress;
    const opponentProgress = alliance.opponentDetails.opponentProgress || 0;
    let winnerName = "";
  
    if (myProgress > opponentProgress) {
      winnerName = alliance.name;
    } else if (opponentProgress > myProgress) {
      winnerName = alliance.opponentDetails.allianceName;
    }
  
    return (
      <Card className="border-green-400/50 bg-green-400/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-400">
            <Trophy className="h-5 w-5" />
            Challenge Concluded
          </CardTitle>
        </CardHeader>
        <CardContent>
          {winnerName ? (
            <p className="text-center text-lg">
              Victor: <span className="font-bold">{winnerName}</span>
            </p>
          ) : (
            <p className="text-center text-lg font-bold">The challenge ended in a draw!</p>
          )}
           <div className="space-y-3 mt-4">
               <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{alliance.name}</p>
                  <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{ backgroundColor: alliance.taskColor }} />
                  <p className="text-xs text-right mt-1">{alliance.progress.toLocaleString()} / {alliance.target.toLocaleString()}</p>
               </div>
               <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{alliance.opponentDetails.allianceName}</p>
                  <Progress value={opponentProgressPercentage} indicatorClassName="transition-all duration-500 bg-destructive" />
                  <p className="text-xs text-right mt-1">{alliance.opponentDetails.opponentProgress?.toLocaleString() ?? 0} / {alliance.target.toLocaleString()}</p>
               </div>
            </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
    <div className={cn('min-h-screen flex flex-col bg-background', pageTierClass)}>
      <ClientHeader />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div
                  className="relative group"
                  onClick={isCreator ? () => setIsImageSelectionOpen(true) : undefined}
                >
                  <div className="relative h-24 w-24">
                      <Image 
                          src={alliance.photoURL} 
                          alt={alliance.name} 
                          fill 
                          className="rounded-full border-2 border-primary/20 object-cover" 
                      />
                  </div>
                  {isCreator && (
                      <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Pencil className="h-6 w-6 text-white" />
                      </div>
                  )}
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-3xl font-bold">{alliance.name}</h1>
                <p className="text-muted-foreground mt-1">{alliance.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
                 <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => togglePinAlliance(alliance.id)}
                    aria-label={isPinned ? 'Unpin alliance' : 'Pin alliance'}
                >
                    {isPinned ? <PinOff className="h-5 w-5 text-primary" /> : <Pin className="h-5 w-5" />}
                </Button>
                <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => handleDownloadRequest(alliance)}
                    aria-label="Download alliance card"
                >
                    <Download className="h-5 w-5" />
                </Button>
            </div>
        </div>

        <div className="p-4 rounded-lg bg-card/50">
            <div className="flex items-center gap-3 mb-3">
                <Target className="h-6 w-6" style={{ color: alliance.taskColor }} />
                <h3 className="font-semibold text-lg" style={{ color: alliance.taskColor }}>
                    Objective: {alliance.taskName}
                </h3>
            </div>
            <div className="space-y-2">
              <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{ backgroundColor: alliance.taskColor }} />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span className="font-mono">{alliance.progress.toLocaleString()} / {alliance.target.toLocaleString()}</span>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {daysLeft >= 0 ? `${formatDistanceToNowStrict(parseISO(alliance.endDate))} remaining` : 'Ended'}
                  </span>
                </div>
              </div>
            </div>
        </div>
        
        {alliance.activeChallengeId && alliance.opponentDetails && (
            isAllianceEnded ? <ChallengeResult /> : (
              <Card className="border-destructive/50 bg-destructive/10 animate-fade-in-up">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Swords className="h-5 w-5" />
                    Active Challenge
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">
                    Versus: <span className="font-bold">{alliance.opponentDetails.allianceName}</span>
                  </p>
                  <div className="space-y-3">
                     <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{alliance.name}</p>
                        <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{ backgroundColor: alliance.taskColor }} />
                        <p className="text-xs text-right mt-1">{alliance.progress.toLocaleString()} / {alliance.target.toLocaleString()}</p>
                     </div>
                     <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{alliance.opponentDetails.allianceName}</p>
                        <Progress value={opponentProgressPercentage} indicatorClassName="transition-all duration-500 bg-destructive" />
                        <p className="text-xs text-right mt-1">{alliance.opponentDetails.opponentProgress?.toLocaleString() ?? 0} / {alliance.target.toLocaleString()}</p>
                     </div>
                  </div>
                </CardContent>
              </Card>
            )
        )}

        <div>
            <div className="flex items-center justify-between gap-2 mb-4">
                 <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <h2 className="text-xl font-semibold">Members ({members.length})</h2>
                </div>
                {isCreator && (
                    <Button variant="ghost" size="icon" onClick={handleOpenInviteDialog}>
                        <ShieldPlus className="h-6 w-6" />
                        <span className="sr-only">Invite Friends</span>
                    </Button>
                )}
            </div>
            <div className="flex flex-wrap gap-4">
                {members.map(member => (
                    <Popover key={member.uid}>
                        <PopoverTrigger asChild>
                            <button aria-label={`View options for ${member.username}`}>
                                <div className="relative">
                                    <Avatar className={cn("h-12 w-12 cursor-pointer hover:ring-2 hover:ring-primary transition-all hover:scale-105", member.isTopContributor && "animate-crown-glow")}>
                                        <AvatarImage src={getAvatarForId(member.uid!, member.photoURL)} />
                                        <AvatarFallback>{member.username?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    {member.isTopContributor && (
                                        <div className="absolute -top-1.5 -right-1.5 bg-yellow-400 p-1 rounded-full border-2 border-background animate-crown-glow">
                                            <Crown className="h-3 w-3 text-black" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-2">
                            <div className="flex flex-col gap-2 items-center text-center">
                                <p className="font-semibold">{member.username}</p>
                                {member.isTopContributor && <Badge variant="success">KING</Badge>}
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
     {/* Offscreen card for image generation */}
    <div className="fixed -left-[9999px] top-0">
        <div ref={allianceCardRef}>
            {allianceToDownload && <AllianceCard alliance={allianceToDownload} />}
        </div>
    </div>
    {alliance && isCreator && (
      <AllianceImageSelectionDialog
        isOpen={isImageSelectionOpen}
        onOpenChange={setIsImageSelectionOpen}
        onSelect={handleImageSelect}
        currentPhotoURL={alliance.photoURL}
      />
    )}
    </>
  );
}

    