
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Lock, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ACHIEVEMENTS } from '@/lib/achievements';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

const AchievementCard = ({ achievement, isUnlocked, newlyUnlocked }: { achievement: typeof ACHIEVEMENTS[0], isUnlocked: boolean, newlyUnlocked: boolean }) => {
  const Icon = achievement.icon;
  const showDetails = isUnlocked || !achievement.isSecret;

  const glowClass = isUnlocked 
    ? "from-primary/50 via-primary/20 to-transparent" 
    : "from-muted/50 via-muted/20 to-transparent";

  return (
    <div className={cn(
      "relative perspective-1000 rounded-2xl p-px transition-all duration-300",
      isUnlocked ? "hover:shadow-xl hover:shadow-primary/20" : "hover:shadow-xl hover:shadow-muted/20",
      newlyUnlocked && 'animate-flip-in'
    )}>
      {/* Gradient Glow Background */}
      <div className={cn("absolute inset-0 rounded-2xl bg-gradient-to-b", glowClass)} />

      <div className={cn(
        "relative w-full h-full transform-style-3d rounded-[15px] bg-black/50 p-6 text-center backdrop-blur-lg",
      )}>
        <div className="flex justify-center mb-4">
          <div className={cn(
            "p-3 rounded-full",
            isUnlocked ? "bg-primary/20 text-primary" : "bg-muted/50 text-muted-foreground"
          )}>
            {isUnlocked ? <Icon className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
          </div>
        </div>
        
        <h3 className={cn("text-lg font-semibold", !showDetails && "italic text-muted-foreground")}>
          {showDetails ? achievement.name : "Secret Achievement"}
        </h3>
        
        <p className="text-sm text-muted-foreground mt-2 min-h-[60px]">
          {showDetails ? achievement.description : "Unlock this achievement to reveal its details."}
        </p>

        <p className={cn(
          "mt-4 text-xs font-medium",
          isUnlocked ? "text-primary/80" : "text-muted-foreground/80"
          )}
        >
          {achievement.category.charAt(0).toUpperCase() + achievement.category.slice(1)}
        </p>
      </div>
    </div>
  );
};

export default function AchievementsPage() {
  const { getUserLevelInfo, unlockedAchievements, newlyUnlockedAchievements, clearNewlyUnlockedAchievements } = useUserRecords();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
    // Clear the newly unlocked list after animations have had a chance to play
    const timer = setTimeout(() => {
        clearNewlyUnlockedAchievements();
    }, 2000); // 2 seconds delay
    return () => clearTimeout(timer);
  }, []);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const standardAchievements = useMemo(() => ACHIEVEMENTS.filter(a => !a.isTitle), []);
  const titleAchievements = useMemo(() => ACHIEVEMENTS.filter(a => a.isTitle), []);

  const totalAchievements = standardAchievements.length;
  const unlockedCount = unlockedAchievements.filter(id => standardAchievements.some(a => a.id === id)).length;
  const progress = totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

  const renderAchievementList = (achievements: typeof ACHIEVEMENTS) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {achievements.map((ach, index) => (
        <div
          key={ach.id}
          className="animate-fade-in-up"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <AchievementCard
            achievement={ach}
            isUnlocked={unlockedAchievements.includes(ach.id)}
            newlyUnlocked={newlyUnlockedAchievements.includes(ach.id)}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-5xl mx-auto">
          <div className="p-6 md:p-0">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Achievements</h1>
            </div>
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">Unlocked: {unlockedCount} / {totalAchievements}</p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-1">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          </div>
          <div className="p-6 md:p-0 pt-12">
            <TooltipProvider>
                {renderAchievementList(standardAchievements)}
            </TooltipProvider>
          </div>

          {titleAchievements.length > 0 && (
            <>
              <Separator className="my-8" />
              <div className="p-6 md:p-0">
                <div className="flex items-center gap-2">
                  <Award className="h-6 w-6 text-yellow-400" />
                  <h1 className="text-2xl font-semibold leading-none tracking-tight">Titles</h1>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Special accolades earned for significant accomplishments. Your most recently earned title is displayed on your profile.
                </p>
              </div>
               <div className="p-6 md:p-0 pt-6">
                <TooltipProvider>
                    {renderAchievementList(titleAchievements)}
                </TooltipProvider>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Achievements &copy; {currentYear}
      </footer>
    </div>
  );
}
