
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { UserSearch, UserPlus, Users, Mail, Check, X, Hourglass, ChevronDown } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { FriendProvider, useFriends } from '@/components/providers/FriendProvider';
import type { SearchedUser, FriendRequest } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"


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

const FriendsContent = () => {
    const { user } = useAuth();
    const { getUserLevelInfo } = useUserRecords();
    const {
        searchUser,
        sendFriendRequest,
        incomingRequests,
        pendingRequests,
        friends,
        acceptFriendRequest,
        declineFriendRequest,
        cancelFriendRequest
    } = useFriends();

    const [usernameQuery, setUsernameQuery] = useState('');
    const [searchedUser, setSearchedUser] = useState<SearchedUser | null>(null);
    const [isLoadingSearch, setIsLoadingSearch] = useState(false);
    const [searchMessage, setSearchMessage] = useState<string | null>(null);
    const { toast } = useToast();

    const handleSearch = async () => {
        if (!usernameQuery.trim() || usernameQuery.trim() === user?.displayName) {
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

    const handleSendRequest = async (recipientId: string, recipientUsername: string) => {
        try {
            await sendFriendRequest(recipientId, recipientUsername);
            toast({ title: "Request Sent", description: `Friend request sent to ${recipientUsername}.` });
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
    
    const getAvatarForId = (id: string) => {
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
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Enter username..."
                                        value={usernameQuery}
                                        onChange={(e) => setUsernameQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Button onClick={handleSearch} disabled={isLoadingSearch}>
                                        {isLoadingSearch ? "Searching..." : "Search"}
                                    </Button>
                                </div>
                                {searchMessage && <p className="text-sm text-muted-foreground mt-3">{searchMessage}</p>}
                                {searchedUser && (
                                    <div className="mt-4 p-4 border rounded-lg flex items-center justify-between bg-muted/50">
                                        <div className="flex items-center gap-3">
                                            <Avatar>
                                                <AvatarImage src={searchedUser.photoURL || getAvatarForId(searchedUser.uid)} />
                                                <AvatarFallback>{searchedUser.username.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-medium">{searchedUser.username}</span>
                                        </div>
                                        {isAlreadyFriend ? (
                                            <p className="text-sm text-green-500">Already Friends</p>
                                        ) : hasIncomingRequest ? (
                                             <p className="text-sm text-blue-500">Check incoming requests</p>
                                        ) : requestAlreadySent ? (
                                            <p className="text-sm text-muted-foreground">Request Sent</p>
                                        ) : (
                                            <Button size="sm" onClick={() => handleSendRequest(searchedUser.uid, searchedUser.username)}>
                                                <UserPlus className="h-4 w-4 mr-2" /> Add Friend
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-4">
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
                                            <div className="space-y-3 pt-4">
                                                {friends.map(friend => (
                                                    <Link href={`/friends/${friend.uid}`} key={friend.uid}>
                                                        <div className="p-3 border rounded-lg flex items-center justify-between bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar>
                                                                    <AvatarImage src={friend.photoURL || getAvatarForId(friend.uid)} />
                                                                    <AvatarFallback>{friend.username.charAt(0).toUpperCase()}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="font-medium">{friend.username}</span>
                                                            </div>
                                                        </div>
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </AccordionContent>
                                </AccordionItem>
                             </Accordion>
                        </div>
                    </div>

                    <div className="space-y-8">
                         <div className="p-4 border rounded-lg">
                             <Accordion type="single" collapsible className="w-full" defaultValue="item-1">
                                <AccordionItem value="item-1" className="border-b-0">
                                   <div className="p-0">
                                        <AccordionTrigger className="p-2 -m-2">
                                            <h2 className="text-xl font-semibold leading-none tracking-tight">Requests</h2>
                                        </AccordionTrigger>
                                   </div>
                                   <AccordionContent>
                                       <p className="text-sm text-muted-foreground pt-4 pb-4">
                                            Manage your friend requests.
                                       </p>
                                       <div className="flex justify-around items-center pt-2">
                                          <Popover>
                                              <PopoverTrigger asChild>
                                                  <Button variant="outline" className="relative">
                                                      <Mail className="h-5 w-5" />
                                                      {incomingRequests.length > 0 && (
                                                          <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{incomingRequests.length}</Badge>
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
                                                          {incomingRequests.length === 0 ? (
                                                              <p className="text-center text-sm text-muted-foreground py-4">No incoming requests.</p>
                                                          ) : (
                                                              <div className="space-y-3 pr-3">
                                                                  {incomingRequests.map(req => (
                                                                      <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card">
                                                                          <div className="flex items-center gap-2">
                                                                              <Avatar className="h-8 w-8">
                                                                                  <AvatarImage src={getAvatarForId(req.senderId)} />
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
                                                          )}
                                                      </ScrollArea>
                                                  </div>
                                              </PopoverContent>
                                          </Popover>
                                          
                                          <Popover>
                                              <PopoverTrigger asChild>
                                                  <Button variant="outline" className="relative">
                                                      <Hourglass className="h-5 w-5" />
                                                      {pendingRequests.length > 0 && (
                                                          <Badge variant="secondary" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center">{pendingRequests.length}</Badge>
                                                      )}
                                                  </Button>
                                              </PopoverTrigger>
                                              <PopoverContent className="w-80">
                                                  <div className="grid gap-4">
                                                      <div className="space-y-2">
                                                          <h4 className="font-medium leading-none">Pending Requests</h4>
                                                          <p className="text-sm text-muted-foreground">Requests you've sent.</p>
                                                      </div>
                                                      <ScrollArea className="h-[200px]">
                                                          {pendingRequests.length === 0 ? (
                                                              <p className="text-center text-sm text-muted-foreground py-4">No pending requests.</p>
                                                          ) : (
                                                              <div className="space-y-3 pr-3">
                                                                  {pendingRequests.map(req => (
                                                                      <div key={req.id} className="p-2 border rounded-lg flex items-center justify-between bg-card">
                                                                          <div className="flex items-center gap-2">
                                                                              <Avatar className="h-8 w-8">
                                                                                  <AvatarImage src={getAvatarForId(req.recipientId)} />
                                                                                  <AvatarFallback>{req.recipientUsername.charAt(0).toUpperCase()}</AvatarFallback>
                                                                              </Avatar>
                                                                              <span className="font-medium text-xs">{req.recipientUsername}</span>
                                                                          </div>
                                                                          <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => cancelFriendRequest(req.id)}>Cancel</Button>
                                                                      </div>
                                                                  ))}
                                                              </div>
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
                </div>
            </main>
        </div>
    );
};

export default function FriendsPage() {
    return (
        <FriendProvider>
            <FriendsContent />
        </FriendProvider>
    )
}
