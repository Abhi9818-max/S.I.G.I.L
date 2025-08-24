"use client";

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Pencil, Heart, Send, Clock, CreditCard, UserX, Lock } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import type { UserData, RecordEntry, TaskDefinition, UserLevelInfo } from '@/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ContributionGraph from '@/components/records/ContributionGraph';
import StatsPanel from '@/components/records/StatsPanel';
import TaskComparisonChart from '@/components/friends/TaskComparisonChart';
import { subDays, startOfWeek, endOfWeek, isWithinInterval, startOfDay, isToday, parseISO } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import PactList from '@/components/todo/PactList';
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
import { calculateUserLevelInfo, getContributionLevel } from '@/lib/config';
import { XP_CONFIG } from '@/lib/xp-config';

type Props = {
  friendId: string;
};

// Include here your helper functions, dialogs, and full UI code adapted to use friendId prop instead of useParams.

export default function ClientFriendProfilePage({ friendId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { friends, getFriendData, updateFriendNickname, sendRelationshipProposal, 
          pendingRelationshipProposalForFriend, incomingRelationshipProposalFromFriend,
          getPublicUserData, unfriend } = useFriends();
  const currentUserRecords = useUserRecords();
  const profileCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [friendData, setFriendData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
  const [isNicknameDialogOpen, setIsNicknameDialogOpen] = useState(false);
  const [isRelationshipDialogOpen, setIsRelationshipDialogOpen] = useState(false);

  const levelInfo = currentUserRecords.getUserLevelInfo();

  const friendInfo = useMemo(() => friends.find(f => f.uid === friendId), [friends, friendId]);
  const isFriend = !!friendInfo;

  const pendingProposal = useMemo(() => pendingRelationshipProposalForFriend(friendId), [pendingRelationshipProposalForFriend, friendId]);
  const incomingProposal = useMemo(() => incomingRelationshipProposalFromFriend(friendId), [incomingRelationshipProposalFromFriend, friendId]);

  // ... (include all your callbacks, memoized values, effects, helper functions, helper components, etc. exactly as in your provided code but using friendId prop)

  // The entire JSX structure of your FriendProfilePage goes here,
  // replacing useParams-based friendId with the friendId prop.

  return (
    <>
      {/* Your full React JSX code for the FriendProfilePage, no changes except using friendId prop */}
    </>
  );
}
