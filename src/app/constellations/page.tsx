
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Lock, Unlock, Sparkles, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SkillNode } from '@/types';
import { useToast } from "@/hooks/use-toast";


interface SkillCardProps {
  skill: SkillNode;
  taskColor: string;
  availablePoints: number;
  isUnlocked: boolean;
  onUnlock: () => void;
}

const SkillCard: React.FC<SkillCardProps> = ({ skill, taskColor, availablePoints, isUnlocked, onUnlock }) => {
  const canAfford = availablePoints >= skill.cost;

  return (
    <div className={cn(
        "p-4 border rounded-lg flex flex-col justify-between transition-all", 
        isUnlocked ? 'border-primary/60 bg-primary/10' : 'bg-card',
        !isUnlocked && !canAfford ? 'opacity-50' : ''
      )}>
      <div>
        <h4 className="font-semibold text-md mb-1">{skill.name}</h4>
        <p className="text-sm text-muted-foreground mb-3">{skill.description}</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <div className="text-xs font-mono p-1 px-2 rounded-md bg-muted">
            Cost: <span className="font-bold" style={{color: taskColor}}>{skill.cost} SP</span>
        </div>
        <Button
          onClick={onUnlock}
          disabled={isUnlocked || !canAfford}
          className="w-full mt-2"
          variant={isUnlocked ? 'secondary' : 'default'}
        >
          {isUnlocked ? (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" /> Unlocked
            </>
          ) : canAfford ? (
            <>
              <Unlock className="mr-2 h-4 w-4" /> Unlock
            </>
          ) : (
             <>
              <Lock className="mr-2 h-4 w-4" /> Unlock
            </>
          )}
        </Button>
      </div>
    </div>
  );
};


export default function ConstellationsPage() {
  const { 
    constellations, 
    getAvailableSkillPoints, 
    unlockSkill, 
    isSkillUnlocked,
    getUserLevelInfo 
  } = useUserRecords();
  const { toast } = useToast();
  const [currentYear, setCurrentYear] = useState<number | null>(null);

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleUnlockSkill = (skillId: string, taskId: string, cost: number, skillName: string) => {
    const success = unlockSkill(skillId, taskId, cost);
    if (success) {
      toast({
        title: "✨ Skill Unlocked!",
        description: `You have successfully unlocked "${skillName}".`,
      });
    } else {
      toast({
        title: "Unlock Failed",
        description: "Not enough Skill Points or skill is already unlocked.",
        variant: "destructive"
      });
    }
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const defaultTab = constellations.length > 0 ? constellations[0].taskId : "";

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6 md:p-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Constellations of Skill</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Spend Skill Points (SP) earned from tasks to unlock permanent nodes. Currently, unlocking skills is foundational; passive bonuses will be activated in a future update.</p>
          </div>
          <div className="p-6 md:p-0 pt-6">
            {constellations.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                <p>No constellations available.</p>
                <p className="text-sm">Skill trees are linked to default tasks.</p>
              </div>
            ) : (
                <Tabs defaultValue={defaultTab} className="w-full">
                  <TabsList className="mb-4">
                    {constellations.map((constellation) => (
                      <TabsTrigger key={constellation.taskId} value={constellation.taskId}>
                        {constellation.taskName}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {constellations.map((constellation) => {
                     const availablePoints = getAvailableSkillPoints(constellation.taskId);
                     return (
                      <TabsContent key={constellation.taskId} value={constellation.taskId}>
                        <div className="text-center mb-6 p-3 rounded-lg bg-muted/50">
                            <p className="text-muted-foreground">Available Skill Points for <span className="font-bold" style={{color: constellation.taskColor}}>{constellation.taskName}</span></p>
                            <p className="text-2xl font-bold" style={{color: constellation.taskColor}}>{availablePoints.toLocaleString()} SP</p>
                        </div>
                        <ScrollArea className="h-[60vh] md:h-[calc(100vh-450px)] pr-4">
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {constellation.nodes.map(skill => (
                                <SkillCard 
                                    key={skill.id}
                                    skill={skill}
                                    taskColor={constellation.taskColor}
                                    availablePoints={availablePoints}
                                    isUnlocked={isSkillUnlocked(skill.id)}
                                    onUnlock={() => handleUnlockSkill(skill.id, constellation.taskId, skill.cost, skill.name)}
                                />
                            ))}
                           </div>
                        </ScrollArea>
                      </TabsContent>
                     )
                  })}
                </Tabs>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Constellations &copy; {currentYear}
      </footer>
    </div>
  );
}
