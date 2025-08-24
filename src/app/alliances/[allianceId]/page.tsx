// src/app/alliances/[allianceId]/page.tsx

"use client";

import React from 'react';
import type { Alliance } from '@/types';
import { calculateUserLevelInfo } from '@/lib/config';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Header from '@/components/layout/Header';
import StatsPanel from '@/components/records/StatsPanel';
import ContributionGraph from '@/components/records/ContributionGraph';
import LevelIndicator from '@/components/layout/LevelIndicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import { format, parseISO, differenceInDays } from 'date-fns';
import Link from 'next/link';

// Replace with your real data-fetching logic
async function fetchAllAllianceIds(): Promise<string[]> {
  return ['alliance1', 'alliance2', 'alliance3'];
}

export async function generateStaticParams() {
  const ids = await fetchAllAllianceIds();
  return ids.map(id => ({ allianceId: id }));
}

interface PageProps {
  params: { allianceId: string };
}

export default function AlliancePage({ params }: PageProps) {
  const { allianceId } = params;

  // Dummy alliance data - replace with real fetch
  const alliance: Alliance = {
    id: allianceId,
    name: `Alliance ${allianceId}`,
    description: 'Alliance description goes here.',
    taskName: 'Example Task',
    taskColor: '#3b82f6',
    target: 100,
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
    members: [],
    memberIds: [],
    creatorId: 'user1',
    dare: '',
    status: 'ongoing',
    opponentDetails: undefined,
    photoURL: '',
    taskId: 'task1',
    progress: 0,        // added required field
    createdAt: new Date().toISOString(), // added required field
  };

  const totalExperience = 0; // replace with real calculation
  const levelInfo = calculateUserLevelInfo(totalExperience);
  const pageTierClass = `page-tier-group-${levelInfo.tierGroup}`;
  const daysLeft = differenceInDays(parseISO(alliance.endDate), new Date());

  return (
    <div className={cn("min-h-screen flex flex-col bg-background", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={alliance.photoURL || `/avatars/avatar1.jpeg`} />
            <AvatarFallback>{alliance.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold">{alliance.name}</h1>
            <LevelIndicator levelInfo={levelInfo} />
          </div>
        </div>

        <StatsPanel friendData={{
          uid: alliance.id,
          username: alliance.name,
          records: [],
          bonusPoints: 0,
          taskDefinitions: []
        }} />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Daily Time Breakdown</h2>
          <DailyTimeBreakdownChart
            date={new Date()}
            records={[]}
            taskDefinitions={[]}
            hideFooter={true}
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Contribution Graph</h2>
          <ContributionGraph
            year={new Date().getFullYear()}
            onDayClick={() => {}}
            onDayDoubleClick={() => {}}
            selectedTaskFilterId={null}
            records={[]}
            taskDefinitions={[]}
            displayMode="full"
          />
        </div>

        <div>
          <h2 className="text-2xl font-semibold mb-4">Time Remaining</h2>
          <p>{daysLeft >= 0 ? `${daysLeft} days left` : 'Ended'}</p>
        </div>

        <div>
          <Link href="/alliances" className="text-blue-600 hover:underline">
            &larr; Back to Alliances
          </Link>
        </div>
      </main>
    </div>
  );
}
