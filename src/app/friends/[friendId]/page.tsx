
"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, User, ListChecks, ImageIcon, BarChart2, Activity, Pencil, Heart, Send, Clock, Award, CreditCard, UserX } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, Friend, RecordEntry, TaskDefinition, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { calculateUserLevelInfo } from '@/lib/config';
import { subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay, isToday, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import PactList from '@/components/todo/PactList';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { toPng } from 'html-to-image';
import ProfileCard from '@/components/profile/ProfileCard';


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

const RelationshipDialog = ({ isOpen, onOpenChange, currentRelationship, onSave, friendName }: { isOpen: boolean; onOpenChange: (open: boolean) => void; currentRelationship: string; onSave: (name: string) => void; friendName: string; }) => {
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
                    <DialogTitle>Propose a Relationship</DialogTitle>
                    <DialogDescription>
                        This will send a proposal to {friendName}. They must accept it for the relationship to be set for both of you.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="relationship">Your Relationship</Label>
                     <Select onValueChange={setRelationship} value={relationship}>
                        <SelectTrigger id="relationship">
                            <SelectValue placeholder="Select a relationship..." />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="none">Clear Relationship</SelectItem>
                            {relationshipOptions.map(option => (
                                <SelectItem key={option} value={option}>{option}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button onClick={handleSave} disabled={!relationship || relationship === currentRelationship}>
                        <Send className="mr-2 h-4 w-4"/>
                        {relationship === 'none' ? 'Clear Relationship' : 'Send Proposal'}
                    </Button>
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
    const { friends, getFriendData, updateFriendNickname, sendRelationshipProposal, pendingRelationshipProposalForFriend, incomingRelationshipProposalFromFriend, getPublicUserData, unfriend } = useFriends();
    const currentUserRecords = useUserRecords();
    const profileCardRef = useRef<HTMLDivElement>(null);

    const [friendData, setFriendData] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
    const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);
    const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);
    const { toast } = useToast();
    
    const levelInfo = currentUserRecords.getUserLevelInfo();
    
    const friendInfo = useMemo(() => friends.find(f => f.uid === friendId), [friends, friendId]);
    const isFriend = !!friendInfo;

    const pendingProposal = useMemo(() => pendingRelationshipProposalForFriend(friendId), [pendingRelationshipProposalForFriend, friendId]);
    const incomingProposal = useMemo(() => incomingRelationshipProposalFromFriend(friendId), [incomingRelationshipProposalFromFriend, friendId]);

    const friendLevelInfo: UserLevelInfo | null = useMemo(() => {
        if (!friendData) return null;
        const totalRecordValue = friendData.records?.reduce((sum, r) => sum + r.value, 0) || 0;
        const totalExperience = totalRecordValue + (friendData.bonusPoints || 0);
        return calculateUserLevelInfo(totalExperience);
    }, [friendData]);
    
    useEffect(() => {
        const fetchFriendData = async () => {
            if (friendId) {
                try {
                    const data = isFriend ? await getFriendData(friendId) : await getPublicUserData(friendId);
                    if (data) {
                        setFriendData(data);
                    } else {
                        toast({ title: 'Error', description: 'User data not found.', variant: 'destructive' });
                        router.push('/friends');
                    }
                } catch (error) {
                    console.error("Error fetching friend data:", error);
                    toast({ title: 'Error', description: 'Could not fetch user data.', variant: 'destructive' });
                    router.push('/friends');
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fetchFriendData();
    }, [friendId, getFriendData, getPublicUserData, isFriend, router, toast]);

    const friendPacts = useMemo(() => {
        if (!friendData?.todoItems) return [];
        return friendData.todoItems.filter(pact => {
            try {
                return isToday(new Date(pact.createdAt));
            } catch {
                return false;
            }
        })
    }, [friendData?.todoItems]);
    
    const handleUpdateNickname = async (newNickname: string) => {
        if (!friendId) return;
        await updateFriendNickname(friendId, newNickname);
        toast({ title: 'Nickname Updated!', description: `The nickname has been saved.` });
    };

    const handleSendRelationshipProposal = async (newRelationship: string) => {
        if (!friendId || !friendData) return;
        try {
            await sendRelationshipProposal(friendId, friendData.username, friendData.photoURL, newRelationship);
            if (newRelationship === 'none') {
                toast({ title: 'Relationship Cleared', description: 'Your relationship status with this friend has been removed.' });
            } else {
                toast({ title: 'Proposal Sent!', description: `Your relationship proposal has been sent.` });
            }
        } catch(e) {
            toast({ title: 'Error', description: (e as Error).message, variant: 'destructive'});
        }
    };
    
      const handleDownloadProfileCard = useCallback(() => {
        if (profileCardRef.current === null) {
          return;
        }

        toPng(profileCardRef.current, { cacheBust: true, pixelRatio: 2 })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `sigil-profile-card-${friendData?.username}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            console.error('Failed to create profile card image', err);
            toast({
                title: "Download Failed",
                description: "Could not generate profile card.",
                variant: "destructive"
            });
          });
      }, [profileCardRef, toast, friendData]);
      
      const getFriendStreak = useCallback((friendRecords: RecordEntry[] | undefined, friendTasks: TaskDefinition[] | undefined, taskId: string | null = null): number => {
        if (!friendRecords || !friendTasks) return 0;
        let taskRelevantRecords = taskId ? friendRecords.filter(r => r.taskType === taskId) : friendRecords;
        const recordDates = new Set(taskRelevantRecords.map(r => r.date));
      
        const taskDef = taskId ? friendTasks.find(t => t.id === taskId) : null;
        const isDaily = !taskDef || !taskDef.frequencyType || taskDef.frequencyType === 'daily';
      
        let currentDate = startOfDay(new Date());
        let streak = 0;
      
        if (!recordDates.has(currentDate.toISOString().split('T')[0])) {
          currentDate = subDays(currentDate, 1);
        }
      
        if (isDaily) {
          while (recordDates.has(currentDate.toISOString().split('T')[0])) {
            streak++;
            currentDate = subDays(currentDate, 1);
          }
        } else {
            const freqCount = taskDef?.frequencyCount || 1;
            let consecutiveWeeks = 0;
            let continueStreak = true;
        
            while (continueStreak) {
                const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
                const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
                const recordsThisWeek = [...recordDates].filter(d => 
                isWithinInterval(parseISO(d), { start: weekStart, end: weekEnd })
                ).length;
                
                if (recordsThisWeek >= freqCount) {
                consecutiveWeeks++;
                currentDate = subDays(weekStart, 1);
                } else {
                continueStreak = false;
                }
            }
            streak = consecutiveWeeks;
        }
      
        return streak;
    }, []);

    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
    }

    if (!friendData) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load user data.
                <Button onClick={() => router.push('/friends')} className="ml-4">Back to Friends</Button>
            </div>
        );
    }
    
    const friendRecords = friendData.records || [];
    const friendTasks = friendData.taskDefinitions || [];
    
    const friendAvatar = friendData.photoURL || `/avatars/avatar${(simpleHash(friendId) % 12) + 1}.jpeg`;
    const today = new Date();
    const yesterday = subDays(today, 1);
    const displayName = friendInfo?.nickname || friendData.username;
    
    const getRelationshipContent = () => {
        if (!isFriend) return null;
        if (pendingProposal) {
            return (
                <Badge variant="secondary" className="cursor-default">
                    <Clock className="mr-2 h-3 w-3" />
                    Proposal Sent: {pendingProposal.relationship}
                </Badge>
            )
        }
        if (incomingProposal) {
             return (
                <Badge variant="secondary" className="cursor-default">
                    <Send className="mr-2 h-3 w-3" />
                    New Proposal Received!
                </Badge>
            )
        }
        return (
            <button onClick={() => setIsRelationshipDialogOpen(true)}>
                <Badge variant={friendInfo.relationship ? "secondary" : "outline"} className="cursor-pointer hover:bg-muted">
                    <Heart className="mr-2 h-3 w-3" />
                    {friendInfo.relationship || "Set Relationship"}
                </Badge>
            </button>
        )
    };


    return (
        <>
            <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
                <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
                <main className="flex-grow container mx-auto px-4 pb-4 md:p-8 animate-fade-in-up space-y-8">
                    <Button variant="outline" onClick={() => router.push('/friends')} className="hidden md:inline-flex mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Friends
                    </Button>
                    <div className="pt-6 md:p-0">
                        <div className="flex flex-col md:flex-row items-start gap-4">
                            <div className="flex items-center gap-4 md:items-start">
                                 <Avatar className="h-16 w-16 md:h-20 md:w-20 flex-shrink-0">
                                    <AvatarImage src={friendAvatar} />
                                    <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                 <div className="md:hidden">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-lg font-semibold">{displayName}</h1>
                                        {isFriend && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNicknameDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
                                        )}
                                    </div>
                                    <div className="mt-1">
                                       
                                    </div>
                                </div>
                            </div>

                            <div className="w-full">
                                <div className="hidden md:flex flex-col md:flex-row md:items-center md:justify-between w-full gap-2">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-semibold">{displayName}</h1>
                                        {isFriend && (
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsNicknameDialogOpen(true)}><Pencil className="h-4 w-4" /></Button>
                                        )}
                                    </div>
                                   <div className="hidden md:block">
                                        {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                                    </div>
                                </div>
                                 <div className="mt-1 md:hidden">
                                    {friendLevelInfo && <LevelIndicator levelInfo={friendLevelInfo} />}
                                </div>
                                <p className="text-sm text-muted-foreground italic mt-2 whitespace-pre-wrap">
                                    {friendData.bio || "No bio yet."}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mt-3">
                                   {getRelationshipContent()}
                                    <Button onClick={handleDownloadProfileCard} variant="outline" size="sm">
                                        <CreditCard className="mr-2 h-4 w-4" />
                                        Download Card
                                    </Button>
                                    {isFriend && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm">
                                                    <UserX className="mr-2 h-4 w-4" />
                                                    Unfriend
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will remove {displayName} from your friends list. This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => unfriend(friendId)}>
                                                        Unfriend
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
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
                          <TaskComparisonChart friendData={friendData} friendNickname={friendInfo?.nickname} />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="pacts" className="mt-6">
                        <PactList items={friendPacts} isEditable={false} />
                      </TabsContent>

                      <TabsContent value="activity" className="mt-6">
                         <div className="mb-8 max-w-4xl mx-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-semibold">Daily Breakdown</h2>
                                <Tabs defaultValue="today" className="w-auto">
                                    <TabsList>
                                        <TabsTrigger value="today">Today</TabsTrigger>
                                        <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                            <ScrollArea className="w-full whitespace-nowrap">
                                <Tabs defaultValue="today" className="w-full inline-block min-w-full">
                                    <TabsContent value="today" className="mt-4">
                                        <div className="w-[600px] md:w-full md:mx-auto md:transform-none transform -translate-x-1/4">
                                            <DailyTimeBreakdownChart
                                                date={today}
                                                records={friendRecords}
                                                taskDefinitions={friendTasks}
                                                hideFooter={true}
                                            />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="yesterday" className="mt-4">
                                        <div className="w-full md:mx-auto">
                                            <DailyTimeBreakdownChart
                                                date={yesterday}
                                                records={friendRecords}
                                                taskDefinitions={friendTasks}
                                                hideFooter={true}
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
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
                                onDayDoubleClick={() => {}} 
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
            {/* This div is for html-to-image to render offscreen */}
            <div className="fixed -left-[9999px] top-0">
                <div ref={profileCardRef}>
                    {friendLevelInfo && friendData && (
                        <ProfileCard 
                            levelInfo={friendLevelInfo} 
                            userData={friendData}
                            userAvatar={friendAvatar}
                            relationship={friendInfo?.relationship}
                            displayStat='currentStreak'
                            currentStreak={getFriendStreak(friendData.records, friendData.taskDefinitions)}
                        />
                    )}
                </div>
            </div>
            {isFriend && (
                <>
                    <NicknameDialog
                        isOpen={isNicknameDialogOpen}
                        onOpenChange={setIsNicknameDialogOpen}
                        currentNickname={friendInfo?.nickname || friendData.username}
                        onSave={handleUpdateNickname}
                    />
                    <RelationshipDialog
                        isOpen={isRelationshipDialogOpen}
                        onOpenChange={setIsRelationshipDialogOpen}
                        currentRelationship={friendInfo?.relationship || ''}
                        onSave={handleSendRelationshipProposal}
                        friendName={displayName}
                    />
                </>
            )}
        </>
    );
};
