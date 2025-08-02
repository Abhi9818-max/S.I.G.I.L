
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const AchievementCard = ({ achievement, isUnlocked }: { achievement: typeof ACHIEVEMENTS[0], isUnlocked: boolean }) => {
  const Icon = achievement.icon;
  const showDetails = isUnlocked || !achievement.isSecret;

  return (
    <Card className={cn(
      "transition-all duration-300",
      isUnlocked ? 'bg-primary/10 border-primary/50' : 'bg-card'
    )}>
      <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
        <div className={cn(
          "p-2 rounded-lg",
          isUnlocked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        )}>
          {isUnlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
        </div>
        <div>
          <CardTitle className={cn("text-md", !showDetails && "italic text-muted-foreground")}>
            {showDetails ? achievement.name : "Secret Achievement"}
          </CardTitle>
          <CardDescription className={cn(
              "text-xs",
              isUnlocked ? "text-primary/80" : "text-muted-foreground"
            )}
          >
            {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {showDetails ? achievement.description : "Unlock this achievement to reveal its details."}
        </p>
      </CardContent>
    </Card>
  );
};

export default function AchievementsPage() {
  const { getUserLevelInfo, unlockedAchievements } = useUserRecords();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const totalAchievements = ACHIEVEMENTS.length;
  const unlockedCount = unlockedAchievements.length;
  const progress = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Achievements</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Milestones that mark your journey. Unlocking achievements grants permanent recognition of your efforts.
            </p>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Unlocked: {unlockedCount} / {totalAchievements}</p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
          <div className="p-6 pt-0">
            <TooltipProvider>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ACHIEVEMENTS.map(ach => (
                  <AchievementCard
                    key={ach.id}
                    achievement={ach}
                    isUnlocked={unlockedAchievements.includes(ach.id)}
                  />
                ))}
              </div>
            </TooltipProvider>
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Achievements &copy; {currentYear}
      </footer>
    </div>
  );
}
