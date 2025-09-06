
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/alert-dialog';
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
    
    const [usernameQuery, setUsernameQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
    const [isPending, startTransition] = useTransition();
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const [showSearch, setShowSearch] = useState(false);
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
            <Link href={`/friends/${suggestion.uid}`} className="flex items-center gap-3 hover:bg-muted/80 rounded-md p-1 -m-1 transition-colors flex-grow">
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
                                {!showSearch && (
                                    <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)}>
                                        <Search className="h-6 w-6" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-3">
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
