
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ListChecks, ImageIcon, BarChart2, Activity, Pencil, Heart } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, Friend, RecordEntry, TaskDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LevelIndicator from '@/components/layout/LevelIndicator';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import { subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import PactList from '@/components/todo/PactList';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


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

const relationshipOptions = [
    "Best Friend", "Boyfriend", "Girlfriend", "Ex-Boyfriend", "Ex-Girlfriend", "Sugar Daddy", "Sugar Mommy", "Fuck Buddy"
];

const RelationshipDialog = ({ isOpen, onOpenChange, currentRelationship, onSave }: { isOpen: boolean; onOpenChange: (open: boolean) => void; currentRelationship: string; onSave: (name: string) => void }) => {
    const [relationship, setRelationship] = useState(currentRelationship);

    useEffect(() => {
        setRelationship(currentRelationship);
    }, [currentRelationship, isOpen]);

    const handleSave = () => {
        onSave(relationship);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Select Relationship</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="relationship">Your Relationship</Label>
                     <Select onValueChange={setRelationship} value={relationship}>
                        <SelectTrigger id="relationship">
                            <SelectValue placeholder="Select a relationship..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="">Clear Relationship</SelectItem>
                            {relationshipOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function FriendProfilePage() {
    const params = useParams();
    const router = useRouter();
    const friendId = params.friendId as string;
    
    const { user } = useAuth();
    const { friends, getFriendData, updateFriendNickname, updateFriendRelationship } = useFriends();
    const [friendData, setFriendData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
    const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);
    const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
    const { toast } = useToast();

    const currentUserRecords = useUserRecords();
    const levelInfo = currentUserRecords.getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    const friendInfo = useMemo(() => friends.find(f => f.uid === friendId), [friends, friendId]);

    useEffect(() => {
        const fetchFriendData = async () => {
            if (friendId) {
                try {
                    const data = await getFriendData(friendId);
                    if (data) {
                        setFriendData(data);
                    } else {
                        router.push('/friends'); // Friend not found or not a friend
                    }
                } catch (error) {
                    console.error("Error fetching friend data:", error);
                    router.push('/friends');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchFriendData();
    }, [friendId, getFriendData, router]);
    
    const handleUpdateNickname = async (newNickname: string) => {
        if (!friendId) return;
        await updateFriendNickname(friendId, newNickname);
        toast({ title: 'Nickname Updated!', description: `The nickname has been saved.` });
    };

    const handleUpdateRelationship = async (newRelationship: string) => {
        if (!friendId) return;
        await updateFriendRelationship(friendId, newRelationship);
        toast({ title: 'Relationship Updated!', description: `Your relationship has been set.` });
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading friend's profile...</div>;
    }

    if (!friendData || !friendInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load friend data.
                <Button onClick={() => router.push('/friends')} className="ml-4">Back to Friends</Button>
            </div>
        );
    }
    
    const friendRecords = friendData.records || [];
    const friendTasks = friendData.taskDefinitions || [];
    const friendBonusPoints = friendData.bonusPoints || 0;
    const totalExperience = friendRecords.reduce((sum, r) => sum + r.value, 0) + friendBonusPoints;
    const friendLevelInfo = calculateUserLevelInfo(totalExperience);
    const friendPacts = friendData.todoItems || [];

    const avatarNumber = (simpleHash(friendId) % 12) + 1;
    const friendAvatar = friendData.photoURL || `/avatars/avatar${avatarNumber}.jpeg`;

    const today = new Date();
    const yesterday = subDays(today, 1);
    
    const displayName = friendInfo.nickname || friendData.username;

    return (
        <>
            <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
                <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
                <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                    <Button variant="outline" onClick={() => router.push('/friends')} className="hidden md:inline-flex mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Friends
                    </Button>
                    <div className="p-6 md:p-0">
                        <div className="flex flex-col md:flex-row items-start gap-4">
                            <div className="flex items-center gap-4 md:items-start">
                                 <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                    <AvatarImage src={friendAvatar} />
                                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                 <div className="md:hidden">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-semibold">{displayName}</h1>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNicknameDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
                                    </div>
                                    <div className="mt-1">
                                       
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-semibold">{displayName}</h1>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNicknameDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
                                    </div>
                                   <div className="hidden md:block">
                                       
                                    </div>
                                </div>
                                 <div className="mt-1 md:hidden">
                                </div>
                                <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                    {friendData.bio || "No bio yet."}
                                </p>
                                <div className="mt-3">
                                    <button onClick={() => setIsRelationshipDialogOpen(true)}>
                                        <Badge variant={friendInfo.relationship ? "secondary" : "outline"} className="cursor-pointer hover:bg-muted">
                                            <Heart className="mr-2 h-3 w-3" />
                                            {friendInfo.relationship || "Set Relationship"}
                                        </Badge>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <Tabs defaultValue="stats" className="w-full">
                      <TabsList>
                        <TabsTrigger value="stats"><BarChart2 className="mr-2 h-4 w-4" />Stats</TabsTrigger>
                        <TabsTrigger value="pacts"><ListChecks className="mr-2 h-4 w-4" />Pacts</TabsTrigger>
                        <TabsTrigger value="activity"><Activity className="mr-2 h-4 w-4" />Activity</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="stats" className="mt-6">
                        <StatsPanel friendData={friendData} />
                        <div className="mt-8">
                          <TaskComparisonChart friendData={friendData} friendNickname={friendInfo.nickname} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pacts" className="mt-6">
                        <PactList items={friendPacts} isEditable={false} />
                      </TabsContent>

                      <TabsContent value="activity" className="mt-6">
                         <div className="p-4 rounded-lg bg-muted/40 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Daily Breakdown</h2>
                                <Tabs defaultValue="today" className="w-auto">
                                    <TabsList>
                                        <TabsTrigger value="today">Today</TabsTrigger>
                                        <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="today" className="mt-4">
                                        <DailyTimeBreakdownChart
                                            date={today}
                                            records={friendRecords}
                                            taskDefinitions={friendTasks}
                                            hideFooter={true}
                                            hideDescription={true}
                                            hideTitle={true}
                                        />
                                    </TabsContent>
                                    <TabsContent value="yesterday" className="mt-4">
                                        <DailyTimeBreakdownChart
                                            date={yesterday}
                                            records={friendRecords}
                                            taskDefinitions={friendTasks}
                                            hideFooter={true}
                                            hideDescription={true}
                                            hideTitle={true}
                                        />
                                    </TabsContent>
                                </Tabs>
                            </div>
                        </div>
                         <div>
                            <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
                            <TaskFilterBar
                                taskDefinitions={friendTasks}
                                selectedTaskId={selectedTaskFilterId}
                                onSelectTask={setSelectedTaskFilterId}
                            />
                            <ContributionGraph 
                                year={new Date().getFullYear()}
                                onDayClick={() => {}} 
                                selectedTaskFilterId={selectedTaskFilterId}
                                records={friendRecords} 
                                taskDefinitions={friendTasks}
                                displayMode="full"
                            />
                        </div>
                      </TabsContent>
                      
                    </Tabs>
                </main>
            </div>
            <NicknameDialog
                isOpen={isNicknameDialogOpen}
                onOpenChange={setIsNicknameDialogOpen}
                currentNickname={friendInfo.nickname || friendData.username}
                onSave={handleUpdateNickname}
            />
            <RelationshipDialog
                isOpen={isRelationshipDialogOpen}
                onOpenChange={setIsRelationshipDialogOpen}
                currentRelationship={friendInfo.relationship || ''}
                onSave={handleUpdateRelationship}
            />
        </>
    );
};
