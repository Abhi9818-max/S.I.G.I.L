"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Star, Award, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/AuthProvider';
import { FACTIONS, REPUTATION_LEVELS } from '@/lib/config';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getReputationLevelInfo = (reputation: number) => {
  const currentLevelInfo = [...REPUTATION_LEVELS].reverse().find(level => reputation >= level.minRep);
  if (!currentLevelInfo) return REPUTATION_LEVELS[0];

  const nextLevelIndex = REPUTATION_LEVELS.findIndex(level => level.level === currentLevelInfo.level + 1);
  const nextLevelInfo = nextLevelIndex !== -1 ? REPUTATION_LEVELS[nextLevelIndex] : null;

  const repInCurrentLevel = reputation - currentLevelInfo.minRep;
  const repForNextLevel = nextLevelInfo ? nextLevelInfo.minRep - currentLevelInfo.minRep : 0;
  const progressPercentage = nextLevelInfo ? (repInCurrentLevel / repForNextLevel) * 100 : 100;

  return {
    ...currentLevelInfo,
    nextLevelInfo,
    repInCurrentLevel,
    repForNextLevel,
    progressPercentage,
  };
};

export default function ReputationPage() {
  const { getUserLevelInfo } = useUserRecords();
  const { userData } = useAuth();
  
  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  const userReputation = userData?.reputation ?? {};

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6 md:p-0">
            <div className="flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Factions & Reputation</h1>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <TooltipProvider>
              {FACTIONS.map(faction => {
                const currentRep = userReputation[faction.id] ?? 0;
                const repLevelInfo = getReputationLevelInfo(currentRep);
                const FactionIcon = faction.icon;

                return (
                  <Card key={faction.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <FactionIcon className="h-8 w-8" style={{color: faction.color}} />
                        <div>
                            <CardTitle>{faction.name}</CardTitle>
                            <CardDescription>{faction.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between items-baseline">
                          <p className="font-semibold">{repLevelInfo.name}</p>
                          <p className="text-sm text-muted-foreground">{currentRep.toLocaleString()} Rep</p>
                        </div>
                        <Tooltip>
                            <TooltipTrigger className="w-full">
                                <Progress value={repLevelInfo.progressPercentage} indicatorClassName="transition-all duration-500" style={{'--tw-bg-opacity': '1', backgroundColor: faction.color}} />
                            </TooltipTrigger>
                            <TooltipContent>
                                {repLevelInfo.nextLevelInfo ? (
                                    <p>{repLevelInfo.repInCurrentLevel.toLocaleString()} / {repLevelInfo.repForNextLevel.toLocaleString()} to {repLevelInfo.nextLevelInfo.name}</p>
                                ) : (
                                    <p>Max Level Reached</p>
                                )}
                            </TooltipContent>
                        </Tooltip>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </main>
    </div>
  );
}
