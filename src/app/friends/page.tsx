
"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserSearch, UserPlus, Users, Mail, Check, X, Hourglass, ChevronDown, Heart, Send, Shield, ArrowRight, Eye, Swords, Search, MoreVertical, Pencil, UserX, Star } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { useAlliance } from '@/components/providers/AllianceProvider';
import type { SearchedUser, FriendRequest, RelationshipProposal, AllianceInvitation, Friend, Alliance, AllianceChallenge } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { findUserByUsername } from '@/lib/server/actions/user';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

// Simple hash function to get a number from a string
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return Math.abs(hash);
};

const getAvatarForId = (id: string, url?: string | null) => {
    if (url) return url;
    const avatarNumber = (simpleHash(id) % 41) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
};

const NicknameDialog = ({ isOpen, onOpenChange, currentNickname, onSave }: { isOpen: boolean; onOpenChange: (open: boolean) => void; currentNickname: string; onSave: (name: string) => void }) => {
  const [nickname, setNickname] = useState(currentNickname);

  useEffect(() => {
    setNickname(currentNickname);
  }, [currentNickname, isOpen]);

  const handleSave = () => {
    onSave(nickname);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set Nickname</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="nickname">Friend's Nickname</Label>
          <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} />
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UnfriendDialog = ({ isOpen, onOpenChange, friendName, onConfirm }: { isOpen: boolean; onOpenChange: (open: boolean) => void; friendName: string; onConfirm: () => void; }) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will remove {friendName} from your friends list. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
                Unfriend
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
  );
};

const FriendCard3D = ({ friend, onEdit, onUnfriend, router }: { friend: Friend, onEdit: () => void, onUnfriend: () => void, router: ReturnType<typeof useRouter> }) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!cardRef.current) return;
        const { left, top, width, height } = cardRef.current.getBoundingClientRect();
        const x = e.clientX - left;
        const y = e.clientY - top;
        const rotateX = (y / height - 0.5) * -10;
        const rotateY = (x / width - 0.5) * 10;
        cardRef.current.style.setProperty('--rotate-x', `${rotateX}deg`);
        cardRef.current.style.setProperty('--rotate-y', `${rotateY}deg`);
    };

    const handleMouseLeave = () => {
        if (!cardRef.current) return;
        cardRef.current.style.setProperty('--rotate-x', '0deg');
        cardRef.current.style.setProperty('--rotate-y', '0deg');
    };
    
    const handleInteractionStart = (e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        const dropdownTrigger = e.currentTarget.querySelector('[data-radix-dropdown-menu-trigger]') as HTMLElement;
        dropdownTrigger?.click();
    };


    return (
        <div 
            ref={cardRef} 
            className="card-3d w-[180px] h-[240px] md:w-[261px] md:h-[348px] flex-shrink-0"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <div className="relative w-full h-full group">
                <Link href={`/friends/${friend.uid}`} className="block w-full h-full">
                    <Card className="overflow-hidden group-hover:shadow-2xl w-full h-full card-3d-content">
                        <div className="relative w-full h-full">
                            <Image 
                                src={getAvatarForId(friend.uid, friend.photoURL)} 
                                alt={friend.username} 
                                fill 
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent/20" />
                            <div className="absolute bottom-0 left-0 p-3 text-white">
                                <CardTitle className="text-md text-shadow">{friend.nickname || friend.username}</CardTitle>
                                {friend.relationship && (
                                    <CardDescription className="text-xs flex items-center gap-1 mt-1 text-white/80 text-shadow">
                                        <Heart className="h-3 w-3" />
                                        {friend.relationship}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                    </Card>
                </Link>
                <div 
                    className="absolute top-2 right-2 z-10 md:hidden"
                    onContextMenu={handleInteractionStart}
                >
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">
                                <MoreVertical className="h-4 w-4"/>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => router.push(`/friends/${friend.uid}`)}>
                                <Eye className="mr-2 h-4 w-4" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onEdit}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit Nickname
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={onUnfriend} className="text-destructive">
                                <UserX className="mr-2 h-4 w-4" /> Unfriend
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </div>
    );
};

const RequestsPopover = ({
    incomingRequests,
    incomingRelationshipProposals,
    incomingAllianceInvitations,
    incomingAllianceChallenges,
    onAcceptFriend,
    onDeclineFriend,
    onAcceptRelationship,
    onDeclineRelationship,
    onAcceptAllianceInvite,
    onDeclineAllianceInvite,
    onAcceptAllianceChallenge,
    onDeclineAllianceChallenge,
}: any) => (
    <PopoverContent className="w-80">
        <ScrollArea className="h-96">
        <div className="p-4 space-y-4">
            <h4 className="font-medium leading-none">Incoming Requests</h4>
            <Separator />
             {incomingRequests.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Friend Requests</h5>
                    {incomingRequests.map((req: FriendRequest) => (
                         <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                             <div className="flex items-center gap-2">
                                 <Avatar className="h-8 w-8"><AvatarImage src={getAvatarForId(req.senderId, req.senderPhotoURL)}/><AvatarFallback>{req.senderUsername.charAt(0)}</AvatarFallback></Avatar>
                                 <span className="text-sm font-medium">{req.senderUsername}</span>
                             </div>
                             <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptFriend(req)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineFriend(req.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
             )}
              {incomingRelationshipProposals.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Relationship Proposals</h5>
                    {incomingRelationshipProposals.map((prop: RelationshipProposal) => (
                         <div key={prop.id} className="flex flex-col p-2 rounded-md bg-muted/50">
                             <div className="flex items-center gap-2">
                                 <Heart className="h-4 w-4 text-pink-400"/><span className="text-sm font-medium">{prop.senderUsername} wants to be your {prop.correspondingRelationship}.</span>
                             </div>
                             <div className="flex gap-1 self-end mt-2"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptRelationship(prop)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineRelationship(prop.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
              )}
              {incomingAllianceInvitations.length > 0 && (
                 <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Alliance Invitations</h5>
                     {incomingAllianceInvitations.map((invite: AllianceInvitation) => (
                         <div key={invite.id} className="flex flex-col p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                 <Shield className="h-4 w-4 text-cyan-400"/><span className="text-sm font-medium">Invite to {invite.allianceName} from {invite.senderUsername}</span>
                            </div>
                            <div className="flex gap-1 self-end mt-2"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptAllianceInvite(invite)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineAllianceInvite(invite.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
              )}
              {incomingAllianceChallenges.length > 0 && (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Alliance Challenges</h5>
                    {incomingAllianceChallenges.map((challenge: AllianceChallenge) => (
                         <div key={challenge.id} className="flex flex-col p-2 rounded-md bg-muted/50">
                            <div className="flex items-center gap-2">
                                <Swords className="h-4 w-4 text-red-500"/><span className="text-sm font-medium">{challenge.challengerAllianceName} challenges you!</span>
                            </div>
                            <div className="flex gap-1 self-end mt-2"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => onAcceptAllianceChallenge(challenge)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onDeclineAllianceChallenge(challenge.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                    ))}
                </div>
              )}
              {incomingRequests.length === 0 && incomingRelationshipProposals.length === 0 && incomingAllianceInvitations.length === 0 && incomingAllianceChallenges.length === 0 && (
                <p className="text-xs text-center text-muted-foreground p-2">No incoming requests.</p>
              )}
        </div>
        </ScrollArea>
    </PopoverContent>
);

const PendingPopover = ({
    pendingRequests,
    onCancelFriend,
}: any) => (
    <PopoverContent className="w-80">
        <ScrollArea className="h-96">
        <div className="p-4 space-y-4">
            <h4 className="font-medium leading-none">Sent Requests</h4>
            <Separator />
            {pendingRequests.length > 0 ? (
                <div className="space-y-2">
                    <h5 className="text-sm font-semibold">Friend Requests</h5>
                     {pendingRequests.map((req: FriendRequest) => (
                         <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                             <div className="flex items-center gap-2">
                                 <Avatar className="h-8 w-8"><AvatarImage src={getAvatarForId(req.recipientId, req.recipientPhotoURL)}/><AvatarFallback>{req.recipientUsername.charAt(0)}</AvatarFallback></Avatar>
                                 <span className="text-sm font-medium">{req.recipientUsername}</span>
                             </div>
                             <div className="flex items-center gap-1"><Hourglass className="h-4 w-4 text-amber-400"/><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => onCancelFriend(req.id)}><X className="h-4 w-4"/></Button></div>
                         </div>
                     ))}
                </div>
            ) : (
                <p className="text-xs text-center text-muted-foreground p-2">No pending friend requests.</p>
            )}
        </div>
        </ScrollArea>
    </PopoverContent>
);


export default function FriendsPage() {
    const { user, userData } = useAuth();
    const { getUserLevelInfo } = useUserRecords();
    const {
        sendFriendRequest,
        incomingRequests,
        pendingRequests,
        friends,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest,
        incomingRelationshipProposals,
        acceptRelationshipProposal,
        declineRelationshipProposal,
        unfriend,
        updateFriendNickname,
        suggestedFriends,
    } = useFriends();
    const {
        incomingAllianceInvitations,
        acceptAllianceInvitation,
        declineAllianceInvitation,
        incomingAllianceChallenges,
        acceptAllianceChallenge,
        declineAllianceChallenge,
    } = useAlliance();

    const [usernameQuery, setUsernameQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
    const [isPending, startTransition] = useTransition();
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const { toast } = useToast();
    const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
    const [unfriendingFriend, setUnfriendingFriend] = useState<Friend | null>(null);
    const router = useRouter();

    const handleSearch = async () => {
        if (!usernameQuery.trim() || usernameQuery.trim().toLowerCase() === userData?.username.toLowerCase()) {
            setSearchMessage("Please enter a valid username other than your own.");
            setSearchedUser(null);
            return;
        }
        setSearchMessage(null);
        setSearchedUser(null);
        startTransition(async () => {
            try {
                const foundUser = await findUserByUsername(usernameQuery);
                if (foundUser) {
                    setSearchedUser(foundUser);
                } else {
                    setSearchMessage("User not found.");
                }
            } catch (error) {
                console.error("Error searching user:", error);
                setSearchMessage("An error occurred while searching.");
            }
        });
    };

    const handleSendRequest = async (recipient: SearchedUser) => {
        try {
            await sendFriendRequest(recipient);
            toast({ title: "Request Sent", description: `Friend request sent to ${recipient.username}.` });
            setSearchedUser(null);
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    const requestAlreadySent = searchedUser && pendingRequests.some(req => req.recipientId === searchedUser.uid);
    const isAlreadyFriend = searchedUser && friends.some(friend => friend.uid === searchedUser.uid);
    const hasIncomingRequest = searchedUser && incomingRequests.some(req => req.senderId === searchedUser.uid);
    
    const allRequestsCount = incomingRequests.length + incomingRelationshipProposals.length + incomingAllianceInvitations.length + incomingAllianceChallenges.length;

    const handleUpdateNickname = async (newNickname: string) => {
      if (!editingFriend) return;
      await updateFriendNickname(editingFriend.uid, newNickname);
      toast({ title: 'Nickname Updated!', description: `The nickname for ${editingFriend.username} has been saved.` });
      setEditingFriend(null);
    };

    const handleUnfriend = async () => {
      if (!unfriendingFriend) return;
      await unfriend(unfriendingFriend.uid);
      setUnfriendingFriend(null);
    }
    
    const renderSuggestion = (suggestion: SearchedUser) => {
      const isPending = pendingRequests.some(req => req.recipientId === suggestion.uid);
      return (
        <div key={suggestion.uid} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
            <div className="flex items-center gap-3">
                <Avatar>
                    <AvatarImage src={getAvatarForId(suggestion.uid, suggestion.photoURL)} />
                    <AvatarFallback>{suggestion.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium">{suggestion.username}</span>
            </div>
            <Button size="sm" onClick={() => handleSendRequest(suggestion)} disabled={isPending}>
                {isPending ? 'Sent' : 'Add Friend'}
            </Button>
        </div>
      )
    };

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <NicknameDialog 
                isOpen={!!editingFriend}
                onOpenChange={(open) => !open && setEditingFriend(null)}
                currentNickname={editingFriend?.nickname || editingFriend?.username || ''}
                onSave={handleUpdateNickname}
            />
            <UnfriendDialog
                isOpen={!!unfriendingFriend}
                onOpenChange={(open) => !open && setUnfriendingFriend(null)}
                friendName={unfriendingFriend?.nickname || unfriendingFriend?.username || ''}
                onConfirm={handleUnfriend}
            />
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <div className="flex flex-col lg:flex-row lg:gap-8">
                    <div className="lg:w-1/3 space-y-4 order-1 lg:order-2 mb-8 lg:mb-0">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <UserSearch className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-semibold leading-none tracking-tight">Find Friends</h2>
                            </div>
                             <div className="flex items-center gap-2">
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <Mail className="h-6 w-6"/>
                                            {allRequestsCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{allRequestsCount}</Badge>}
                                        </Button>
                                    </PopoverTrigger>
                                    <RequestsPopover 
                                        incomingRequests={incomingRequests}
                                        incomingRelationshipProposals={incomingRelationshipProposals}
                                        incomingAllianceInvitations={incomingAllianceInvitations}
                                        incomingAllianceChallenges={incomingAllianceChallenges}
                                        onAcceptFriend={acceptFriendRequest}
                                        onDeclineFriend={declineFriendRequest}
                                        onAcceptRelationship={acceptRelationshipProposal}
                                        onDeclineRelationship={declineRelationshipProposal}
                                        onAcceptAllianceInvite={acceptAllianceInvitation}
                                        onDeclineAllianceInvite={declineAllianceInvitation}
                                        onAcceptAllianceChallenge={acceptAllianceChallenge}
                                        onDeclineAllianceChallenge={declineAllianceChallenge}
                                    />
                                </Popover>
                                 <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="ghost" size="icon" className="relative">
                                            <Hourglass className="h-6 w-6"/>
                                            {pendingRequests.length > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{pendingRequests.length}</Badge>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PendingPopover
                                        pendingRequests={pendingRequests}
                                        onCancelFriend={cancelFriendRequest}
                                    />
                                </Popover>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="relative w-full max-w-sm">
                                <Input
                                    placeholder="Enter username..."
                                    value={usernameQuery}
                                    onChange={(e) => setUsernameQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                        }
                                    }}
                                    className="bg-transparent border-white/50 rounded-full h-11 pl-4 pr-10 focus-visible:ring-primary/50"
                                />
                                <button 
                                    onClick={handleSearch} 
                                    disabled={isPending}
                                    className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <Search className="h-5 w-5" />
                                </button>
                            </div>

                            {isPending && <p className="text-sm text-muted-foreground mt-3">Searching...</p>}
                            {searchMessage && <p className="text-sm text-muted-foreground mt-3">{searchMessage}</p>}
                            {searchedUser && (
                                <div className="mt-4 p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/50">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={getAvatarForId(searchedUser.uid, searchedUser.photoURL)} />
                                            <AvatarFallback>{searchedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{searchedUser.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button asChild variant="outline" size="sm">
                                            <Link href={`/friends/${searchedUser.uid}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View Profile
                                            </Link>
                                        </Button>
                                        {isAlreadyFriend ? (
                                            <Badge variant="secondary">Already Friends</Badge>
                                        ) : hasIncomingRequest ? (
                                            <Badge variant="outline">Check incoming</Badge>
                                        ) : requestAlreadySent ? (
                                            <Badge variant="outline">Request Sent</Badge>
                                        ) : (
                                            <Button size="sm" onClick={() => handleSendRequest(searchedUser)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <Card className="hover:shadow-xl transition-shadow">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5 text-primary"/>Alliances</CardTitle>
                                <CardDescription>Team up with friends to achieve greatness.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Button asChild className="w-full">
                                    <Link href="/alliances">
                                        View Alliances <ArrowRight className="ml-2 h-4 w-4"/>
                                    </Link>
                                </Button>
                            </CardContent>
                         </Card>
                    </div>
                     <div className="flex-1 space-y-8 order-2 lg:order-1">
                        {/* Friends Carousel */}
                        <Accordion type="single" collapsible className="w-full" defaultValue="friends-list">
                            <AccordionItem value="friends-list">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-6 w-6 text-primary" />
                                        <h2 className="text-2xl font-semibold leading-none tracking-tight">Your Friends</h2>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {friends.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">You have no friends yet.</p>
                                    ) : (
                                        <ScrollArea className="w-full whitespace-nowrap friends-scroller-container">
                                            <div className="flex space-x-4 pb-4">
                                                {friends.map((friend) => (
                                                    <FriendCard3D 
                                                      key={friend.uid} 
                                                      friend={friend} 
                                                      onEdit={() => setEditingFriend(friend)}
                                                      onUnfriend={() => setUnfriendingFriend(friend)}
                                                      router={router}
                                                    />
                                                ))}
                                            </div>
                                            <ScrollBar orientation="horizontal" className="invisible"/>
                                        </ScrollArea>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                            <AccordionItem value="suggestions">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Star className="h-6 w-6 text-primary" />
                                        <h2 className="text-2xl font-semibold leading-none tracking-tight">Suggestions</h2>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {suggestedFriends.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">No suggestions right now. Try searching!</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {suggestedFriends.map(renderSuggestion)}
                                        </div>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </main>
        </div>
    );
}
