
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserSearch, UserPlus, Users, Mail, Check, X, Hourglass, ChevronDown, Heart, Send, Shield, ArrowRight, Eye } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { SearchedUser, FriendRequest, RelationshipProposal, AllianceInvitation } from '@/types';
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
} from "@/components/ui/accordion"
import Image from 'next/image';


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

export default function FriendsPage() {
    const { user, userData } = useAuth();
    const { getUserLevelInfo } = useUserRecords();
    const {
        searchUser,
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
        incomingAllianceInvitations,
        acceptAllianceInvitation,
        declineAllianceInvitation,
    } = useFriends();

    const [usernameQuery, setUsernameQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!usernameQuery.trim() || usernameQuery.trim() === userData?.username) {
            setSearchMessage("Please enter a valid username other than your own.");
            setSearchedUser(null);
            return;
        }
        setIsLoadingSearch(true);
        setSearchMessage(null);
        setSearchedUser(null);
        try {
            const foundUser = await searchUser(usernameQuery);
            if (foundUser) {
                setSearchedUser(foundUser);
            } else {
                setSearchMessage("User not found.");
            }
        } catch (error) {
            console.error("Error searching user:", error);
            setSearchMessage("An error occurred while searching.");
        } finally {
            setIsLoadingSearch(false);
        }
    };

    const handleSendRequest = async (recipient: SearchedUser) => {
        try {
            await sendFriendRequest(recipient);
            toast({ title: "Request Sent", description: `Friend request sent to ${recipient.username}.` });
            setSearchedUser(null); // Clear search result after sending request
        } catch (error) {
            toast({ title: "Error", description: (error as Error).message, variant: "destructive" });
        }
    };

    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    const requestAlreadySent = searchedUser && pendingRequests.some(req => req.recipientId === searchedUser.uid);
    const isAlreadyFriend = searchedUser && friends.some(friend => friend.uid === searchedUser.uid);
    const hasIncomingRequest = searchedUser && incomingRequests.some(req => req.senderId === searchedUser.uid);
    
    const getAvatarForId = (id: string, url?: string | null) => {
        if (url) return url;
        const avatarNumber = (simpleHash(id) % 12) + 1;
        return `/avatars/avatar${avatarNumber}.jpeg`;
    }

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
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <Input
                                        placeholder="Enter username..."
                                        value={usernameQuery}
                                        onChange={(e) => setUsernameQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} disabled={isLoadingSearch} className="w-full sm:w-auto">
                                        {isLoadingSearch ? "Searching..." : "Search"}
                                    </Button>
                                </div>
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
                                        <ScrollArea className="w-full whitespace-nowrap">
                                            <div className="flex space-x-4 pb-4">
                                                {friends.map((friend) => (
                                                     <Link href={`/friends/${friend.uid}`} key={friend.uid} className="flex-shrink-0">
                                                        <Card className="overflow-hidden group transition-all duration-300 ease-in-out hover:shadow-2xl hover:-translate-y-1 w-[180px] h-[240px]">
                                                            <div className="relative w-full h-full">
                                                                <Image 
                                                                    src={getAvatarForId(friend.uid, friend.photoURL)} 
                                                                    alt={friend.username} 
                                                                    fill 
                                                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                                                />
                                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
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
                                                ))}
                                            </div>
                                            <ScrollBar orientation="horizontal" />
                                        </ScrollArea>
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>

                    <div className="space-y-8">
                         <Accordion type="single" collapsible className="w-full" defaultValue="requests-list">
                            <AccordionItem value="requests-list">
                                <AccordionTrigger>
                                    <h2 className="text-xl font-semibold leading-none tracking-tight">Requests</h2>
                                </AccordionTrigger>
                                <AccordionContent>
                                   <p className="text-sm text-muted-foreground pt-4 pb-4">
                                        Manage your friend and relationship requests.
                                   </p>
                                   <div className="flex justify-around items-center pt-2">
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button variant="outline" className="relative">
                                                  <Mail className="h-5 w-5" />
                                                  {(incomingRequests.length + incomingRelationshipProposals.length + incomingAllianceInvitations.length) > 0 && (
                                                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{incomingRequests.length + incomingRelationshipProposals.length + incomingAllianceInvitations.length}</Badge>
                                                  )}
                                              </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                              <div className="grid gap-4">
                                                  <div className="space-y-2">
                                                      <h4 className="font-medium leading-none">Incoming Requests</h4>
                                                      <p className="text-sm text-muted-foreground">Accept or decline requests.</p>
                                                  </div>
                                                  <ScrollArea className="h-[200px]">
                                                      {(incomingRequests.length + incomingRelationshipProposals.length + incomingAllianceInvitations.length) === 0 ? (
                                                          <p className="text-center text-sm text-muted-foreground py-4">No incoming requests.</p>
                                                      ) : (
                                                        <>
                                                            <h5 className="text-xs text-muted-foreground font-semibold my-2">Friend Requests</h5>
                                                            {incomingRequests.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">None</p>}
                                                            <div className="space-y-3 pr-3">
                                                                {incomingRequests.map(req => (
                                                                    <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarImage src={getAvatarForId(req.senderId, req.senderPhotoURL)} />
                                                                                <AvatarFallback>{req.senderUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="font-medium text-xs">{req.senderUsername}</span>
                                                                        </div>
                                                                        <div className="flex gap-1">
                                                                            <Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={() => acceptFriendRequest(req)}><Check className="h-4 w-4" /></Button>
                                                                            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineFriendRequest(req.id)}><X className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <h5 className="text-xs text-muted-foreground font-semibold my-2">Relationship Proposals</h5>
                                                            {incomingRelationshipProposals.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">None</p>}
                                                             <div className="space-y-3 pr-3">
                                                                {incomingRelationshipProposals.map(req => (
                                                                    <div key={req.id} className="p-2 border rounded-lg flex flex-col items-start gap-2 bg-card">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarImage src={getAvatarForId(req.senderId, req.senderPhotoURL)} />
                                                                                <AvatarFallback>{req.senderUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                            <p className="text-xs"><span className="font-medium">{req.senderUsername}</span> wants to be your <span className="font-bold text-primary">{req.relationship}</span>.</p>
                                                                        </div>
                                                                        <div className="flex gap-1 self-end">
                                                                            <Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={() => acceptRelationshipProposal(req)}><Check className="h-4 w-4" /></Button>
                                                                            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineRelationshipProposal(req.id)}><X className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <h5 className="text-xs text-muted-foreground font-semibold my-2">Alliance Invitations</h5>
                                                            {incomingAllianceInvitations.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">None</p>}
                                                             <div className="space-y-3 pr-3">
                                                                {incomingAllianceInvitations.map(req => (
                                                                    <div key={req.id} className="p-2 border rounded-lg flex flex-col items-start gap-2 bg-card">
                                                                        <div className="flex items-center gap-2">
                                                                             <div className="p-2 rounded-lg bg-muted">
                                                                                <Shield className="h-4 w-4 text-primary" />
                                                                             </div>
                                                                            <p className="text-xs"><span className="font-medium">{req.senderUsername}</span> invited you to join <span className="font-bold text-primary">{req.allianceName}</span>.</p>
                                                                        </div>
                                                                        <div className="flex gap-1 self-end">
                                                                            <Button size="icon" className="h-7 w-7 bg-green-500 hover:bg-green-600" onClick={() => acceptAllianceInvitation(req)}><Check className="h-4 w-4" /></Button>
                                                                            <Button size="icon" variant="destructive" className="h-7 w-7" onClick={() => declineAllianceInvitation(req.id)}><X className="h-4 w-4" /></Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                      )}
                                                  </ScrollArea>
                                              </div>
                                          </PopoverContent>
                                      </Popover>
                                      
                                      <Popover>
                                          <PopoverTrigger asChild>
                                              <Button variant="outline" className="relative">
                                                  <Send className="h-5 w-5" />
                                                  {(pendingRequests.length + pendingRelationshipProposals.length) > 0 && (
                                                      <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{pendingRequests.length + pendingRelationshipProposals.length}</Badge>
                                                  )}
                                              </Button>
                                          </PopoverTrigger>
                                          <PopoverContent className="w-80">
                                              <div className="grid gap-4">
                                                  <div className="space-y-2">
                                                      <h4 className="font-medium leading-none">Sent Requests</h4>
                                                      <p className="text-sm text-muted-foreground">Requests you've sent.</p>
                                                  </div>
                                                  <ScrollArea className="h-[200px]">
                                                       {(pendingRequests.length + pendingRelationshipProposals.length) === 0 ? (
                                                          <p className="text-center text-sm text-muted-foreground py-4">No pending requests.</p>
                                                      ) : (
                                                        <>
                                                            <h5 className="text-xs text-muted-foreground font-semibold my-2">Friend Requests</h5>
                                                            {pendingRequests.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">None</p>}
                                                            <div className="space-y-3 pr-3">
                                                                {pendingRequests.map(req => (
                                                                    <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarImage src={getAvatarForId(req.recipientId, req.recipientPhotoURL)} />
                                                                                <AvatarFallback>{req.recipientUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className="font-medium text-xs">{req.recipientUsername}</span>
                                                                        </div>
                                                                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => cancelFriendRequest(req.id)}>Cancel</Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <h5 className="text-xs text-muted-foreground font-semibold my-2">Relationship Proposals</h5>
                                                             {pendingRelationshipProposals.length === 0 && <p className="text-xs text-muted-foreground text-center py-2">None</p>}
                                                            <div className="space-y-3 pr-3">
                                                                {pendingRelationshipProposals.map(req => (
                                                                    <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-8 w-8">
                                                                                <AvatarImage src={getAvatarForId(req.recipientId, req.recipientPhotoURL)} />
                                                                                <AvatarFallback>{req.recipientUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                                            </Avatar>
                                                                            <p className="text-xs">To <span className="font-medium">{req.recipientUsername}</span> as <span className="font-bold text-primary">{req.relationship}</span></p>
                                                                        </div>
                                                                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => cancelRelationshipProposal(req.id)}>Cancel</Button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </>
                                                      )}
                                                  </ScrollArea>
                                              </div>
                                          </PopoverContent>
                                      </Popover>
                                   </div>
                                </AccordionContent>
                            </AccordionItem>
                         </Accordion>
                    </div>
                </div>
            </main>
        </div>
    );
};
