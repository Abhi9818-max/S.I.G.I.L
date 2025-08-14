
"use client";

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Shield, Target, Calendar, Trash2, UserPlus, CreditCard, ShieldAlert, Crown, LogOut, Download, CheckCircle, XCircle, Swords, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import type { Alliance, UserData, TaskDefinition, Friend, AllianceMember, RecordEntry } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, differenceInDays, isPast, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toPng } from 'html-to-image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import AllianceCard from '@/components/alliances/AllianceCard';
import { generateAllianceDare } from '@/lib/server/alliance-dare';
import { Badge } from '@/components/ui/badge';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';


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
}

const AllianceStatusBadge = ({ status }: { status: Alliance['status'] }) => {
    const statusMap = {
        completed: {
            icon: <CheckCircle className="mr-2 h-4 w-4" />,
            label: 'Success',
            className: 'bg-green-600/20 text-green-300 border border-green-500/30'
        },
        failed: {
            icon: <XCircle className="mr-2 h-4 w-4" />,
            label: 'Failed',
            className: 'bg-red-600/20 text-red-300 border border-red-500/30'
        },
        ongoing: {
            icon: <RefreshCw className="mr-2 h-4 w-4 animate-spin" />,
            label: 'In Progress',
            className: 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
        }
    };
    
    const currentStatus = statusMap[status || 'ongoing'];

    return (
        <div className={cn("inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold", currentStatus.className)}>
            {currentStatus.icon}
            {currentStatus.label}
        </div>
    );
};


const InviteFriendsDialog = ({
    isOpen,
    onOpenChange,
    friends,
    alliance,
    onInvite,
    pendingInvites
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    friends: Friend[];
    alliance: Alliance;
    onInvite: (friendIds: string[]) => void;
    pendingInvites: string[];
}) => {
    const [selectedFriends, setSelectedFriends] = useState<string[]>([]);

    const availableFriends = friends.filter(f => !alliance.memberIds.includes(f.uid));

    const handleToggleFriend = (friendId: string) => {
        setSelectedFriends(prev =>
            prev.includes(friendId) ? prev.filter(id => id !== friendId) : [...prev, friendId]
        );
    };

    const handleSendInvites = () => {
        onInvite(selectedFriends);
        setSelectedFriends([]);
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite Friends to {alliance.name}</DialogTitle>
                    <DialogDescription>Select friends to invite to join your alliance. Only friends who have the '{alliance.taskName}' task can be invited.</DialogDescription>
                </DialogHeader>
                 <TooltipProvider>
                    <ScrollArea className="h-64">
                        <div className="space-y-2 pr-4">
                            {availableFriends.length > 0 ? (
                                availableFriends.map(friend => {
                                    const isPending = pendingInvites.includes(friend.uid);
                                    const hasRequiredTask = friend.taskDefinitions?.some(t => t.id === alliance.taskId) ?? false;
                                    const canBeInvited = !isPending && hasRequiredTask;

                                    return (
                                        <Tooltip key={friend.uid}>
                                            <TooltipTrigger asChild>
                                                <div className={cn("flex items-center space-x-3 rounded-md p-2", !canBeInvited && "opacity-50")}>
                                                    <Checkbox
                                                        id={`friend-${friend.uid}`}
                                                        onCheckedChange={() => handleToggleFriend(friend.uid)}
                                                        checked={selectedFriends.includes(friend.uid)}
                                                        disabled={!canBeInvited}
                                                    />
                                                    <Label
                                                        htmlFor={`friend-${friend.uid}`}
                                                        className="flex-grow flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                    >
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={getAvatarForId(friend.uid, friend.photoURL)} />
                                                            <AvatarFallback>{(friend.nickname || friend.username).charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        {friend.nickname || friend.username}
                                                        {isPending && <span className="text-xs text-muted-foreground">(Invited)</span>}
                                                    </Label>
                                                </div>
                                            </TooltipTrigger>
                                            {!hasRequiredTask && (
                                                <TooltipContent>
                                                    <p>This friend does not have the '{alliance.taskName}' task.</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                )})
                            ) : (
                                <p className="text-center text-muted-foreground py-8">All your friends are already in this alliance.</p>
                            )}
                        </div>
                    </ScrollArea>
                </TooltipProvider>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSendInvites} disabled={selectedFriends.length === 0}>
                        Send Invites
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export default function AllianceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const allianceId = params.allianceId as string;
    
    const { user } = useAuth();
    const { friends, getAllianceWithMembers, leaveAlliance, disbandAlliance, sendAllianceInvitation, getPendingAllianceInvitesFor, setAllianceDare } = useFriends();
    const { dashboardSettings } = useSettings();
    const { records: currentUserRecords } = useUserRecords();
    
    const [alliance, setAlliance] = useState<Alliance | null>(null);
    const [membersData, setMembersData] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [pendingInvites, setPendingInvites] = useState<string[]>([]);
    const { toast } = useToast();
    const allianceCardRef = useRef<HTMLDivElement>(null);

    const fetchAllianceData = useCallback(async () => {
        if (allianceId) {
            setIsLoading(true);
            try {
                const data = await getAllianceWithMembers(allianceId);
                if (data) {
                    const { allianceData, membersData: fetchedMembersData } = data;
                    setAlliance(allianceData);
                    setMembersData(fetchedMembersData);

                    // Check for dare logic
                    if (allianceData.status === 'failed' && !allianceData.dare) {
                        const newDare = await generateAllianceDare(allianceData.name, dashboardSettings.dareCategory);
                        await setAllianceDare(allianceData.id, newDare);
                        setAlliance(prev => prev ? {...prev, dare: newDare} : null);
                    }
                } else {
                    toast({ title: 'Error', description: 'Alliance not found.', variant: 'destructive' });
                    router.push('/alliances');
                }
            } catch (error) {
                console.error("Error fetching alliance data:", error);
                toast({ title: 'Error', description: 'Could not fetch alliance data.', variant: 'destructive' });
                router.push('/alliances');
            } finally {
                setIsLoading(false);
            }
        }
    }, [allianceId, getAllianceWithMembers, router, toast, setAllianceDare, dashboardSettings.dareCategory]);
    
    useEffect(() => {
        fetchAllianceData();
    }, [fetchAllianceData]);

    useEffect(() => {
        const fetchPendingInvites = async () => {
            if (allianceId) {
                const pending = await getPendingAllianceInvitesFor(allianceId);
                setPendingInvites(pending.map(p => p.recipientId));
            }
        };
        fetchPendingInvites();
    }, [allianceId, getPendingAllianceInvitesFor]);
    
    const enrichedMembers = useMemo((): AllianceMember[] => {
        if (!alliance || !membersData.length) return [];

        const startDate = startOfDay(parseISO(alliance.startDate));
        const endDate = endOfDay(parseISO(alliance.endDate));
        
        return alliance.members.map(member => {
            let recordsToSearch: RecordEntry[] = [];
             if (member.uid === user?.uid) {
                recordsToSearch = currentUserRecords;
            } else {
                const memberData = membersData.find(m => m.uid === member.uid);
                recordsToSearch = memberData?.records || [];
            }

            const relevantRecords = recordsToSearch.filter(r => 
                r.taskType === alliance.taskId && isWithinInterval(parseISO(r.date), { start: startDate, end: endDate })
            );
            const contribution = relevantRecords.reduce((sum, r) => sum + r.value, 0);
            return {
                ...member,
                contribution,
            };
        });
    }, [alliance, membersData, currentUserRecords, user?.uid]);

    const calculatedProgress = useMemo(() => {
        return enrichedMembers.reduce((sum, member) => sum + member.contribution, 0);
    }, [enrichedMembers]);


    const handleLeaveAlliance = async () => {
        if (!user || !alliance) return;

        if (alliance.status === 'ongoing') {
            toast({
                title: "Alliance Active",
                description: "You cannot leave until the objective is met or the alliance's time expires.",
                variant: "destructive"
            });
            return;
        }

        try {
            await leaveAlliance(alliance.id, user.uid);
            toast({ title: "You have left the alliance." });
            router.push('/alliances');
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        }
    };
    
    const handleDisbandAlliance = async () => {
        if (!user || !alliance || alliance.creatorId !== user.uid) return;

        if (alliance.status === 'ongoing') {
            toast({
                title: "Alliance Active",
                description: "You cannot disband until the objective is met or the alliance's time expires.",
                variant: "destructive"
            });
            return;
        }

        try {
            await disbandAlliance(alliance.id);
            toast({ title: "Alliance Disbanded", description: "The alliance has been removed." });
            router.push('/alliances');
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        }
    };
    
    const handleSendInvites = async (friendIds: string[]) => {
        if (!alliance) return;
        try {
            await Promise.all(friendIds.map(friendId => sendAllianceInvitation(allianceId, alliance.name, friendId)));
            toast({
                title: "Invites Sent",
                description: `Invitations have been sent to ${friendIds.length} friend(s).`
            });
            // Refresh pending invites
            const pending = await getPendingAllianceInvitesFor(allianceId);
            setPendingInvites(pending.map(p => p.recipientId));
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        }
    };

    const handleDownloadCard = useCallback(() => {
        if (allianceCardRef.current === null) {
          return;
        }

        toPng(allianceCardRef.current, { cacheBust: true, pixelRatio: 2 })
          .then((dataUrl) => {
            const link = document.createElement('a');
            link.download = `sigil-alliance-card-${alliance?.name}.png`;
            link.href = dataUrl;
            link.click();
          })
          .catch((err) => {
            console.error('Failed to create alliance card image', err);
            toast({
                title: "Download Failed",
                description: "Could not generate alliance card.",
                variant: "destructive"
            });
          });
      }, [allianceCardRef, toast, alliance]);

    const sortedMembers = useMemo(() => {
        if (!enrichedMembers) return [];
        return [...enrichedMembers].sort((a, b) => (b.contribution || 0) - (a.contribution || 0));
    }, [enrichedMembers]);

    const topContributorId = useMemo(() => {
        if (!sortedMembers || sortedMembers.length === 0) return null;
        const topMember = sortedMembers[0];
        return topMember.contribution && topMember.contribution > 0 ? topMember.uid : null;
    }, [sortedMembers]);

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading alliance details...</div>;
    }
    
    if (!alliance) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                Could not load alliance data.
            </div>
        );
    }

    const { name, description, taskName, taskColor, target, startDate, endDate, members, creatorId, dare, status, opponentDetails } = alliance;
    const isCreator = user?.uid === creatorId;
    const isMember = user ? members.some(m => m.uid === user.uid) : false;
    const progressPercentage = Math.min((calculatedProgress / target) * 100, 100);
    const opponentProgressPercentage = opponentDetails?.opponentProgress !== undefined ? Math.min((opponentDetails.opponentProgress / target) * 100, 100) : 0;
    const timeRemaining = differenceInDays(parseISO(endDate), new Date());


    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
                <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                    
                    <div className="space-y-8">
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <Shield className="h-8 w-8 text-primary" />
                                    <h1 className="text-3xl font-bold">{name}</h1>
                                     {status && <AllianceStatusBadge status={status} />}
                                </div>
                                <p className="mt-2 text-muted-foreground">{description}</p>
                            </div>
                            <div className="flex-shrink-0 flex items-center gap-2">
                                {isCreator && (
                                    <Button variant="outline" onClick={() => setIsInviteOpen(true)}>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Invite
                                    </Button>
                                )}
                                 <Button onClick={handleDownloadCard} variant="outline" size="icon">
                                    <Download className="h-4 w-4" />
                                 </Button>
                                {!isCreator && isMember && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="icon">
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure you want to leave?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    You will leave this alliance and your contributions will remain.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleLeaveAlliance}>
                                                    Leave
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                                {isCreator && status !== 'ongoing' && (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" type="button">Disband</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                            This action cannot be undone. This will permanently delete this
                                            alliance and remove all of its data.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleDisbandAlliance}>
                                                Disband
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            {opponentDetails && (
                                <div className="p-4 rounded-lg bg-red-950/50 border border-destructive/50 text-center">
                                    <div className="flex items-center justify-center gap-4 mb-2">
                                        <Swords className="h-6 w-6 text-destructive" />
                                        <h3 className="font-semibold text-xl text-destructive-foreground">VERSUS</h3>
                                        <Swords className="h-6 w-6 text-destructive" />
                                    </div>
                                    <Link href={`/alliances/${opponentDetails.allianceId}`} className="text-lg font-bold text-white hover:text-primary transition-colors">
                                        {opponentDetails.allianceName}
                                    </Link>
                                </div>
                            )}
                            {dare && (
                                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/50 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-2">
                                        <ShieldAlert className="h-5 w-5 text-destructive" />
                                        <h3 className="font-semibold text-lg text-destructive">Dare for Failure</h3>
                                    </div>
                                    <p className="text-destructive/90">{dare}</p>
                                </div>
                            )}

                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <Target className="h-5 w-5" style={{ color: taskColor }} />
                                    <h3 className="font-semibold text-lg" style={{ color: taskColor }}>Objective: {taskName}</h3>
                                </div>
                                <div className="space-y-2 mt-4">
                                    <p className="text-sm font-medium">{name} (Your Alliance)</p>
                                    <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{'--tw-bg-opacity': '1', backgroundColor: taskColor}} />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{calculatedProgress.toLocaleString()} / {target.toLocaleString()} ({progressPercentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                                {opponentDetails && (
                                <div className="space-y-2 mt-4">
                                    <p className="text-sm font-medium text-destructive">{opponentDetails.allianceName} (Opponent)</p>
                                    <Progress value={opponentProgressPercentage} indicatorClassName="transition-all duration-500 bg-destructive" />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>{(opponentDetails.opponentProgress || 0).toLocaleString()} / {target.toLocaleString()} ({opponentProgressPercentage.toFixed(1)}%)</span>
                                    </div>
                                </div>
                                )}
                                <div className="flex justify-end text-sm text-muted-foreground mt-4">
                                  <div className="flex items-center gap-1">
                                      <Calendar className="h-4 w-4" />
                                      <span>
                                          {timeRemaining >= 0 ? `${timeRemaining} days left` : 'Ended'}
                                      </span>
                                  </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Members ({members.length})</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {sortedMembers.map(member => (
                                        <Link key={member.uid} href={`/friends/${member.uid}`}>
                                            <div className={cn(
                                                "p-3 border rounded-lg flex items-center gap-3 bg-card hover:bg-muted/50 transition-all duration-300 cursor-pointer",
                                                member.uid === topContributorId && "shadow-lg shadow-yellow-400/20 border-yellow-400/50"
                                            )}>
                                                <Avatar>
                                                    <AvatarImage src={getAvatarForId(member.uid, member.photoURL)} />
                                                    <AvatarFallback>{(member.nickname || member.username).charAt(0).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-grow">
                                                    <p className="font-medium flex items-center gap-2">
                                                        {member.nickname || member.username}
                                                        {member.uid === topContributorId && (
                                                            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                                                                <Crown className="h-3 w-3" />
                                                                KING
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        Contribution: {(member.contribution || 0).toLocaleString()}
                                                        {member.uid === creatorId && <span className="ml-2">(Creator)</span>}
                                                    </p>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
             {/* This div is for html-to-image to render offscreen */}
            <div className="fixed -left-[9999px] top-0">
                <div ref={allianceCardRef}>
                    {alliance && (
                        <AllianceCard 
                            alliance={{...alliance, progress: calculatedProgress, members: enrichedMembers}}
                        />
                    )}
                </div>
            </div>
             {isCreator && (
                <InviteFriendsDialog
                    isOpen={isInviteOpen}
                    onOpenChange={setIsInviteOpen}
                    friends={friends}
                    alliance={alliance}
                    onInvite={handleSendInvites}
                    pendingInvites={pendingInvites}
                />
            )}
        </>
    );
}
