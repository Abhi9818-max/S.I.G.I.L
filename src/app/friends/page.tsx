
"use client";

import React, { useState, useRef, useEffect, useTransition } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserSearch, UserPlus, Users, Mail, Check, X, Hourglass, ChevronDown, Heart, Send, Shield, ArrowRight, Eye, Swords, Search } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Updated import to use client-side search helper
import { findUserByUsername } from '@/lib/server/actions/user';

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

const FriendCard3D = ({ friend }: { friend: Friend }) => {
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
        <Link href={`/friends/${friend.uid}`} className="flex-shrink-0">
            <div 
                ref={cardRef} 
                className="card-3d w-[180px] h-[240px] md:w-[261px] md:h-[348px]"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-2xl w-full h-full card-3d-content">
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
            </div>
        </Link>
    );
};

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
        pendingRelationshipProposals,
        acceptRelationshipProposal,
        declineRelationshipProposal,
        cancelRelationshipProposal,
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
    
    const allRequestsCount = incomingRequests.length + pendingRequests.length + incomingRelationshipProposals.length + incomingAllianceInvitations.length + incomingAllianceChallenges.length;

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <UserSearch className="h-6 w-6 text-primary" />
                                <h2 className="text-2xl font-semibold leading-none tracking-tight">Find Friends</h2>
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
                        </div>

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
                                                    <FriendCard3D key={friend.uid} friend={friend} />
                                                ))}
                                            </div>
                                            <ScrollBar orientation="horizontal" className="invisible"/>
                                        </ScrollArea>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    {/* Sidebar with alliances link */}
                    <div className="space-y-8">
                        <Accordion type="single" collapsible className="w-full" defaultValue="requests-list">
                            <AccordionItem value="requests-list">
                                <AccordionTrigger>
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-6 w-6 text-primary" />
                                        <h2 className="text-2xl font-semibold leading-none tracking-tight">Requests</h2>
                                        {allRequestsCount > 0 && <Badge>{allRequestsCount}</Badge>}
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <Accordion type="multiple" className="w-full space-y-2">
                                       <AccordionItem value="item-1">
                                          <AccordionTrigger>Incoming Friend Requests</AccordionTrigger>
                                          <AccordionContent className="space-y-2">
                                            {incomingRequests.length > 0 ? incomingRequests.map(req => (
                                                <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-8 w-8"><AvatarImage src={getAvatarForId(req.senderId, req.senderPhotoURL)}/><AvatarFallback>{req.senderUsername.charAt(0)}</AvatarFallback></Avatar>
                                                        <span className="text-sm font-medium">{req.senderUsername}</span>
                                                    </div>
                                                    <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => acceptFriendRequest(req)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineFriendRequest(req.id)}><X className="h-4 w-4"/></Button></div>
                                                </div>
                                            )) : <p className="text-xs text-center text-muted-foreground p-2">No incoming friend requests.</p>}
                                          </AccordionContent>
                                        </AccordionItem>
                                       <AccordionItem value="item-2">
                                            <AccordionTrigger>Sent Friend Requests</AccordionTrigger>
                                            <AccordionContent className="space-y-2">
                                                {pendingRequests.length > 0 ? pendingRequests.map(req => (
                                                    <div key={req.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-8 w-8"><AvatarImage src={getAvatarForId(req.recipientId, req.recipientPhotoURL)}/><AvatarFallback>{req.recipientUsername.charAt(0)}</AvatarFallback></Avatar>
                                                            <span className="text-sm font-medium">{req.recipientUsername}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1"><Hourglass className="h-4 w-4 text-amber-400"/><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => cancelFriendRequest(req.id)}><X className="h-4 w-4"/></Button></div>
                                                    </div>
                                                )) : <p className="text-xs text-center text-muted-foreground p-2">No pending friend requests.</p>}
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="item-3">
                                          <AccordionTrigger>Relationship Proposals</AccordionTrigger>
                                          <AccordionContent className="space-y-2">
                                            {incomingRelationshipProposals.length > 0 ? incomingRelationshipProposals.map(prop => (
                                                <div key={prop.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                    <div className="flex items-center gap-2">
                                                        <Heart className="h-4 w-4 text-pink-400"/><span className="text-sm font-medium">{prop.senderUsername} wants to be your {prop.correspondingRelationship}.</span>
                                                    </div>
                                                    <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => acceptRelationshipProposal(prop)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineRelationshipProposal(prop.id)}><X className="h-4 w-4"/></Button></div>
                                                </div>
                                            )) : <p className="text-xs text-center text-muted-foreground p-2">No relationship proposals.</p>}
                                          </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="item-4">
                                            <AccordionTrigger>Alliance Invitations</AccordionTrigger>
                                            <AccordionContent className="space-y-2">
                                                {incomingAllianceInvitations.length > 0 ? incomingAllianceInvitations.map(invite => (
                                                    <div key={invite.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                        <div className="flex items-center gap-2">
                                                            <Shield className="h-4 w-4 text-cyan-400"/><span className="text-sm font-medium">Invite to {invite.allianceName} from {invite.senderUsername}</span>
                                                        </div>
                                                        <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => acceptAllianceInvitation(invite)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineAllianceInvitation(invite.id)}><X className="h-4 w-4"/></Button></div>
                                                    </div>
                                                )) : <p className="text-xs text-center text-muted-foreground p-2">No alliance invitations.</p>}
                                            </AccordionContent>
                                        </AccordionItem>
                                        <AccordionItem value="item-5">
                                            <AccordionTrigger>Alliance Challenges</AccordionTrigger>
                                            <AccordionContent className="space-y-2">
                                                {incomingAllianceChallenges.length > 0 ? incomingAllianceChallenges.map(challenge => (
                                                    <div key={challenge.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                                        <div className="flex items-center gap-2">
                                                            <Swords className="h-4 w-4 text-red-500"/><span className="text-sm font-medium">{challenge.challengerAllianceName} challenges you!</span>
                                                        </div>
                                                        <div className="flex gap-1"><Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-500" onClick={() => acceptAllianceChallenge(challenge)}><Check className="h-4 w-4"/></Button><Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineAllianceChallenge(challenge.id)}><X className="h-4 w-4"/></Button></div>
                                                    </div>
                                                )) : <p className="text-xs text-center text-muted-foreground p-2">No incoming alliance challenges.</p>}
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>
            </main>
        </div>
    );
}
