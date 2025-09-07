
"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserSearch, UserPlus, Users, Mail, Check, X, Hourglass, Eye, MoreVertical, Pencil, UserX, Star, Shield, Swords, Search } from 'lucide-react';
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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { findUserByUsername } from '../../lib/user';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter as AlertDialogFooterComponent } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
            <AlertDialogFooterComponent>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirm}>
                Unfriend
            </AlertDialogAction>
            </AlertDialogFooterComponent>
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
                                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor" className="text-pink-400"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                                        {friend.relationship}
                                    </CardDescription>
                                )}
                            </div>
                        </div>
                    </Card>
                </Link>
                <div 
                    className="absolute top-2 right-2 z-10"
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                             <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-white/80 bg-black/20 hover:bg-black/40 transition-opacity">
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

const RequestsPopoverContent = ({ view }: { view: 'incoming' | 'sent' }) => {
    const { 
        incomingRequests, 
        pendingRequests, 
        acceptFriendRequest, 
        declineFriendRequest,
        cancelFriendRequest 
    } = useFriends();
    const { 
        incomingAllianceInvitations, 
        acceptAllianceInvitation, 
        declineAllianceInvitation,
        incomingAllianceChallenges,
        acceptAllianceChallenge,
        declineAllianceChallenge
    } = useAlliance();

    const renderEmptyState = (message: string) => (
        <div className="text-center text-muted-foreground py-10 px-4">
            <p>{message}</p>
        </div>
    );

    const title = view === 'incoming' ? "Incoming Requests" : "Sent Requests";
    const hasIncoming = incomingRequests.length > 0 || incomingAllianceInvitations.length > 0 || incomingAllianceChallenges.length > 0;
    const hasSent = pendingRequests.length > 0;

    return (
        <PopoverContent className="w-80 p-0" align="end">
            <div className="p-4 pb-2">
                <h4 className="font-medium leading-none">{title}</h4>
            </div>
            <ScrollArea className="h-96 pr-3 mt-2">
                <div className="p-4 pt-0">
                    {view === 'incoming' && (
                        <div className="space-y-4">
                            {!hasIncoming && renderEmptyState("No incoming requests.")}
                            {incomingRequests.map(req => (
                                <Card key={req.id}><CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3"><Avatar><AvatarImage src={getAvatarForId(req.senderId, req.senderPhotoURL)} /><AvatarFallback>{req.senderUsername.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{req.senderUsername}</p><p className="text-xs text-muted-foreground">Friend Request</p></div></div>
                                    <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={() => acceptFriendRequest(req)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineFriendRequest(req.id)}><X className="h-4 w-4"/></Button></div>
                                </CardContent></Card>
                            ))}
                            {incomingAllianceInvitations.map(inv => (
                                <Card key={inv.id}><CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3"><Shield className="h-8 w-8 text-primary" /><div><p className="font-semibold">{inv.allianceName}</p><p className="text-xs text-muted-foreground">Alliance Invite from {inv.senderUsername}</p></div></div>
                                    <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={() => acceptAllianceInvitation(inv)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineAllianceInvitation(inv.id)}><X className="h-4 w-4"/></Button></div>
                                </CardContent></Card>
                            ))}
                            {incomingAllianceChallenges.map(chal => (
                                <Card key={chal.id}><CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3"><Swords className="h-8 w-8 text-destructive" /><div><p className="font-semibold">{chal.challengerAllianceName}</p><p className="text-xs text-muted-foreground">Alliance Challenge</p></div></div>
                                    <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={() => acceptAllianceChallenge(chal)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineAllianceChallenge(chal.id)}><X className="h-4 w-4"/></Button></div>
                                </CardContent></Card>
                            ))}
                        </div>
                    )}
                    {view === 'sent' && (
                        <div className="space-y-4">
                            {!hasSent && renderEmptyState("You haven't sent any friend requests.")}
                            {pendingRequests.map(req => (
                                <Card key={req.id}><CardContent className="p-3 flex items-center justify-between">
                                    <div className="flex items-center gap-3"><Avatar><AvatarImage src={getAvatarForId(req.recipientId, req.recipientPhotoURL)} /><AvatarFallback>{req.recipientUsername.charAt(0)}</AvatarFallback></Avatar><div><p className="font-semibold">{req.recipientUsername}</p><p className="text-xs text-muted-foreground">Request Sent</p></div></div>
                                    <Button size="sm" variant="outline" onClick={() => cancelFriendRequest(req.id)}>Cancel</Button>
                                </CardContent></Card>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </PopoverContent>
    );
};

export default function FriendsPage() {
    const { user, userData } = useAuth();
    const { getUserLevelInfo } = useUserRecords();
    const {
        sendFriendRequest,
        pendingRequests,
        friends,
        unfriend,
        updateFriendNickname,
        suggestedFriends,
        incomingRequests,
    } = useFriends();
    const { incomingAllianceInvitations, incomingAllianceChallenges } = useAlliance();
    
    const [usernameQuery, setUsernameQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
    const [isPending, startTransition] = useTransition();
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);
    const { toast } = useToast();
    const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
    const [unfriendingFriend, setUnfriendingFriend] = useState<Friend | null>(null);
    const router = useRouter();

    const handleSearch = () => {
        if (!usernameQuery.trim() || (userData?.username && usernameQuery.trim().toLowerCase() === userData.username.toLowerCase())) {
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
    
    const incomingNotificationCount = incomingRequests.length + incomingAllianceInvitations.length + incomingAllianceChallenges.length;
    const sentNotificationCount = pendingRequests.length;

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
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <div className="lg:w-2/3 mx-auto">
                    <div className="flex items-center justify-between">
                        {showSearch ? (
                            <div className="relative w-full max-w-sm animate-fade-in">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="Enter username..."
                                    value={usernameQuery}
                                    onChange={(e) => setUsernameQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                    className="bg-transparent border-white/50 rounded-full h-11 pl-10 pr-4 focus-visible:ring-primary/50"
                                    autoFocus
                                    onBlur={() => {
                                        if (!usernameQuery) setShowSearch(false);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <UserSearch className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-semibold leading-none tracking-tight">Find Friends</h2>
                            </div>
                        )}

                         <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Mail className="h-6 w-6"/>
                                        {incomingNotificationCount > 0 && <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{incomingNotificationCount}</Badge>}
                                    </Button>
                                </PopoverTrigger>
                                <RequestsPopoverContent view="incoming" />
                            </Popover>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="ghost" size="icon" className="relative">
                                        <Hourglass className="h-6 w-6"/>
                                        {sentNotificationCount > 0 && <Badge className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0">{sentNotificationCount}</Badge>}
                                    </Button>
                                </PopoverTrigger>
                                <RequestsPopoverContent view="sent" />
                            </Popover>
                            {!showSearch && (
                                <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                                    <Search className="h-6 w-6" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="space-y-3 mt-4">
                        {isPending && <p className="text-sm text-muted-foreground mt-3">Searching...</p>}
                        {searchMessage && <p className="text-sm text-muted-foreground mt-3">{searchMessage}</p>}
                        {searchedUser && (
                            <Link href={`/friends/${searchedUser.uid}`} className="block">
                                <div className="mt-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 -m-4 p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <Avatar>
                                            <AvatarImage src={getAvatarForId(searchedUser.uid, searchedUser.photoURL)} />
                                            <AvatarFallback>{searchedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium">{searchedUser.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2" onClick={(e) => e.preventDefault()}>
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
                            </Link>
                        )}
                    </div>
                </div>

                <div className="space-y-8 mt-12">
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
                    </Accordion>
                    
                    {/* Suggestions Section */}
                    <Accordion type="single" collapsible className="w-full pt-4">
                         <AccordionItem value="suggestions">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold leading-none tracking-tight">Suggestions</h3>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                {suggestedFriends.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-4">No suggestions right now. Try searching!</p>
                                ) : (
                                    <div className="space-y-3 pt-2">
                                        {suggestedFriends.map((suggestion) => {
                                            const isPending = pendingRequests.some(req => req.recipientId === suggestion.uid);
                                            return (
                                                <div key={suggestion.uid} className="flex items-center justify-between p-2 hover:bg-muted/80 rounded-md -m-2 transition-colors">
                                                    <Link href={`/friends/${suggestion.uid}`} className="flex items-center gap-3 flex-grow">
                                                        <Avatar>
                                                            <AvatarImage src={getAvatarForId(suggestion.uid, suggestion.photoURL)} />
                                                            <AvatarFallback>{suggestion.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="font-medium">{suggestion.username}</span>
                                                    </Link>
                                                    <Button size="sm" onClick={() => handleSendRequest(suggestion)} disabled={isPending} className="ml-2">
                                                        {isPending ? 'Sent' : 'Add'}
                                                    </Button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </main>
        </div>
    );
}
