
"use client";

import React, { useMemo, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { subDays, parseISO, formatDistanceToNowStrict, startOfDay, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns';
import PerformanceCircle from './PerformanceCircle';
import { Flame, Snowflake, TrendingUp, ShieldCheck, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { RecordEntry, TaskDefinition, HighGoal, UserData } from '@/types';

interface StatsPanelProps {
  selectedTaskFilterId?: string | null;
  friendData?: UserData; // If this is provided, we are in "friend view"
}

const StatsPanel: React.FC<StatsPanelProps> = ({ 
  selectedTaskFilterId,
  friendData
}) => {
  const userRecordsContext = useUserRecords();
  const { dashboardSettings } = useSettings();

  const isFriendProfile = !!friendData;

  // Use friend's data if provided, otherwise fall back to context for the current user
  const records = useMemo(() => friendData?.records ?? userRecordsContext.records, [friendData, userRecordsContext.records]);
  const taskDefinitions = useMemo(() => friendData?.taskDefinitions ?? userRecordsContext.taskDefinitions, [friendData, userRecordsContext.taskDefinitions]);
  const highGoals = useMemo(() => friendData?.highGoals ?? userRecordsContext.highGoals, [friendData, userRecordsContext.highGoals]);
  const freezeCrystals = useMemo(() => friendData?.freezeCrystals ?? userRecordsContext.freezeCrystals, [friendData, userRecordsContext.freezeCrystals]);

  const getTaskDefinitionById = useCallback((taskId: string): TaskDefinition | undefined => {
    return taskDefinitions.find(task => task.id === taskId);
  }, [taskDefinitions]);

  const getRecordsForDateRange = useCallback((startDate: Date, endDate: Date): RecordEntry[] => {
    const start = startOfDay(startDate);
    const end = startOfDay(endDate);

    return records.filter(r => {
      try {
        const recordDate = startOfDay(parseISO(r.date));
        return recordDate >= start && recordDate <= end;
      } catch (e) {
        return false;
      }
    });
  }, [records]);

  const getAggregateSum = useCallback((startDate: Date, endDate: Date, taskId?: string | null): number => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    return relevantRecords.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  }, [getRecordsForDateRange]);

  const getCurrentStreak = useCallback((taskId: string | null = null): number => {
    if (!records) return 0;
    let taskRelevantRecords = taskId ? records.filter(r => r.taskType === taskId) : records;
    const recordDates = new Set(taskRelevantRecords.map(r => r.date));
  
    const taskDef = taskId ? getTaskDefinitionById(taskId) : null;
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
  }, [records, getTaskDefinitionById]);
  
  const aggregate = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, dashboardSettings.totalDays - 1);
    return getAggregateSum(startDate, today, selectedTaskFilterId);
  }, [selectedTaskFilterId, getAggregateSum, dashboardSettings.totalDays]);

  const consistency = useMemo(() => {
    const days = dashboardSettings.consistencyDays;
    const today = startOfDay(new Date());
    const startDate = startOfDay(subDays(today, days - 1));
  
    let relevantRecords = getRecordsForDateRange(startDate, today);
    if (selectedTaskFilterId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === selectedTaskFilterId);
    }
    const activeDays = new Set(relevantRecords.map(r => r.date)).size;
    return Math.round((activeDays / days) * 100);
  }, [selectedTaskFilterId, getRecordsForDateRange, dashboardSettings.consistencyDays]);

  const currentStreak = useMemo(() => {
    return getCurrentStreak(selectedTaskFilterId);
  }, [selectedTaskFilterId, getCurrentStreak]);

  const { task, isDarkStreakSelected, unitLabel } = useMemo(() => {
    if (!selectedTaskFilterId) return { task: null, isDarkStreakSelected: false, unitLabel: '' };
    const task = getTaskDefinitionById(selectedTaskFilterId);
    let unitLabel = '';
    
    if (task?.unit) {
      if (task.unit === 'custom' && task.customUnitName) unitLabel = task.customUnitName;
      else if (task.unit !== 'count' && task.unit !== 'generic' && task.unit !== 'custom') unitLabel = task.unit;
    }

    return { task, isDarkStreakSelected: task?.darkStreakEnabled === true, unitLabel };
  }, [selectedTaskFilterId, getTaskDefinitionById]);

  const activeHighGoal = useMemo(() => {
    const now = new Date();
    if (!selectedTaskFilterId || !highGoals) return null;
    const relevantGoals = [...highGoals]
        .filter(g => g.taskId === selectedTaskFilterId && parseISO(g.endDate) >= now);
    
    if (relevantGoals.length === 0) return null;
    
    return relevantGoals.sort((a, b) => parseISO(a.endDate).getTime() - parseISO(b.endDate).getTime())[0];
  }, [highGoals, selectedTaskFilterId]);

  const visibleCards = [
    isFriendProfile || dashboardSettings.showTotalLast30Days,
    isFriendProfile || dashboardSettings.showCurrentStreak,
    isFriendProfile || dashboardSettings.showDailyConsistency,
    isFriendProfile ? !!activeHighGoal : dashboardSettings.showHighGoalStat && !!activeHighGoal,
  ].filter(Boolean).length;

  if (visibleCards === 0 && !isFriendProfile) {
    return null;
  }
  
  const getHighGoalProgress = (goal: HighGoal) => {
    return getAggregateSum(parseISO(goal.startDate), parseISO(goal.endDate), goal.taskId);
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {(isFriendProfile || dashboardSettings.showTotalLast30Days) && (
            <Card className="shadow-lg animate-fade-in-up">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Last {dashboardSettings.totalDays} Days
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-foreground">
                    {aggregate.toLocaleString()}
                    {unitLabel && <span className="text-lg text-muted-foreground ml-2">{unitLabel}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">in selected task(s)</p>
                </CardContent>
            </Card>
        )}

        {(isFriendProfile || dashboardSettings.showCurrentStreak) && (
            <Card
            className={cn(
                "shadow-lg animate-fade-in-up transition-all relative",
                isDarkStreakSelected && "bg-orange-950/70 border-orange-400/50"
            )}
            style={{ animationDelay: `100ms` }}
            >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                {isDarkStreakSelected ? "Dark Streak" : "Current Streak"}
                </CardTitle>
                <div className="flex items-center gap-3">
                <Flame
                    className={cn(
                    "h-4 w-4 text-orange-400",
                    isDarkStreakSelected &&
                        "text-yellow-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.8)]"
                    )}
                />
                <Tooltip>
                    <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                        <Snowflake className="h-4 w-4 text-blue-300" />
                        <span className="text-sm font-bold">{freezeCrystals}</span>
                    </div>
                    </TooltipTrigger>
                    <TooltipContent>
                    <p>Freeze Crystals can save a streak.</p>
                    </TooltipContent>
                </Tooltip>
                </div>
            </CardHeader>
            <CardContent>
                <div
                className={cn(
                    "text-2xl font-bold text-foreground",
                    isDarkStreakSelected && "text-yellow-400"
                )}
                >
                {currentStreak} Day{currentStreak !== 1 ? "s" : ""}
                </div>
                <p className="text-xs text-muted-foreground">in selected task(s)</p>
            </CardContent>
            </Card>
        )}

        {(isFriendProfile || dashboardSettings.showDailyConsistency) && (
            <Card className="shadow-lg animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Daily Consistency
                    </CardTitle>
                    <Repeat className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex flex-col">
                            <p className="text-xs text-muted-foreground">Active days</p>
                            <p className="text-xs text-muted-foreground">last {dashboardSettings.consistencyDays} days</p>
                        </div>
                        <PerformanceCircle percentage={consistency} size={60} strokeWidth={6} />
                    </div>
                </CardContent>
            </Card>
        )}
        
        {(isFriendProfile || dashboardSettings.showHighGoalStat) && activeHighGoal && (
          <Link href="/high-goals">
              <Card className="shadow-lg animate-fade-in-up h-full hover:bg-muted/50 transition-colors" style={{ animationDelay: `300ms` }}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground truncate" title={activeHighGoal.name}>
                          High Goal: {activeHighGoal.name}
                      </CardTitle>
                      <ShieldCheck className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                      {(() => {
                          const goalTask = getTaskDefinitionById(activeHighGoal.taskId);
                          const progress = getHighGoalProgress(activeHighGoal);
                          const percentage = Math.min((progress / activeHighGoal.targetValue) * 100, 100);
                          const timeRemaining = formatDistanceToNowStrict(parseISO(activeHighGoal.endDate), { addSuffix: true });
                          return (
                              <div className="flex items-center justify-between gap-4">
                                  <div className="flex flex-col">
                                      <p className="text-xs font-semibold text-foreground">{progress.toLocaleString()} / {activeHighGoal.targetValue.toLocaleString()}</p>
                                      <p className="text-xs text-muted-foreground">Due {timeRemaining}</p>
                                  </div>
                                  <PerformanceCircle percentage={percentage} size={60} strokeWidth={6} progressColor={goalTask?.color} />
                              </div>
                          )
                      })()}
                  </CardContent>
              </Card>
          </Link>
        )}
      </div>
  );
};

export default StatsPanel;
