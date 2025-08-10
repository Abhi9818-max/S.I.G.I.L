
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Shield, Target, Calendar, Trash2 } from 'lucide-react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { Alliance, UserData, TaskDefinition } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, differenceInDays } from 'date-fns';
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
import Link from 'next/link';

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
    const avatarNumber = (simpleHash(id) % 12) + 1;
    return `/avatars/avatar${avatarNumber}.jpeg`;
}


export default function AllianceDetailPage() {
    const params = useParams();
    const router = useRouter();
    const allianceId = params.allianceId as string;
    
    const { user, userData } = useAuth();
    const { getAllianceWithMembers, leaveAlliance, disbandAlliance } = useFriends();
    const [alliance, setAlliance] = useState<Alliance | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchAllianceData = async () => {
            if (allianceId) {
                try {
                    const data = await getAllianceWithMembers(allianceId);
                    if (data) {
                        setAlliance(data);
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
        };

        fetchAllianceData();
    }, [allianceId, getAllianceWithMembers, router, toast]);

    const handleLeaveAlliance = async () => {
        if (!user || !alliance) return;
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
        try {
            await disbandAlliance(alliance.id);
            toast({ title: "Alliance Disbanded", description: "The alliance has been removed." });
            router.push('/alliances');
        } catch (error) {
            toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
        }
    };


    if (isLoading || !alliance) {
        return <div className="flex items-center justify-center min-h-screen">Loading alliance details...</div>;
    }

    const { name, description, taskName, taskColor, target, startDate, endDate, members, progress, creatorId } = alliance;
    const isCreator = user?.uid === creatorId;
    const isMember = user ? members.some(m => m.uid === user.uid) : false;
    const progressPercentage = Math.min((progress / target) * 100, 100);
    const timeRemaining = differenceInDays(parseISO(endDate), new Date());


    return (
        <div className="min-h-screen flex flex-col">
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
                <Button variant="outline" onClick={() => router.push('/alliances')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Alliances
                </Button>

                <Card className="shadow-xl">
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <Shield className="h-8 w-8 text-primary" />
                                    <CardTitle className="text-3xl">{name}</CardTitle>
                                </div>
                                <CardDescription className="mt-2">{description}</CardDescription>
                            </div>
                            <div className="flex-shrink-0">
                                {isCreator ? (
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" />Disband</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>This will permanently delete the alliance for everyone. This action cannot be undone.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleDisbandAlliance}>Disband Alliance</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                ) : isMember && (
                                     <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="outline">Leave Alliance</Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Leave this alliance?</AlertDialogTitle>
                                                <AlertDialogDescription>You can rejoin later if you change your mind, provided the alliance is still active.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={handleLeaveAlliance}>Leave</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2 mb-2">
                                <Target className="h-5 w-5" style={{ color: taskColor }} />
                                <h3 className="font-semibold text-lg" style={{ color: taskColor }}>Objective: {taskName}</h3>
                            </div>
                             <div className="space-y-2 mt-4">
                                <Progress value={progressPercentage} indicatorClassName="transition-all duration-500" style={{'--tw-bg-opacity': '1', backgroundColor: taskColor}} />
                                <div className="flex justify-between text-sm text-muted-foreground">
                                    <span>{progress.toLocaleString()} / {target.toLocaleString()} ({progressPercentage.toFixed(1)}%)</span>
                                     <div className="flex items-center gap-1">
                                        <Calendar className="h-4 w-4" />
                                        <span>
                                            {timeRemaining >= 0 ? `${timeRemaining} days left` : 'Ended'}
                                        </span>
                                    </div>
                                </div>
                             </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Members ({members.length})</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {members.map(member => (
                                    <Link key={member.uid} href={`/friends/${member.uid}`}>
                                        <div className="p-3 border rounded-lg flex items-center gap-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                            <Avatar>
                                                <AvatarImage src={getAvatarForId(member.uid, member.photoURL)} />
                                                <AvatarFallback>{(member.nickname || member.username).charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{member.nickname || member.username}</p>
                                                {member.uid === creatorId && <p className="text-xs text-muted-foreground">Creator</p>}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
