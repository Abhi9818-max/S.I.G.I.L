

"use client";

import type { RecordEntry, TaskDefinition, WeeklyProgressStats, AggregatedTimeDataPoint, UserLevelInfo, Constellation, TaskDistributionData, ProductivityByDayData, HighGoal, DailyTimeBreakdownData, UserData, ProgressChartTimeRange, TaskStatus, TaskMastery, TaskMasteryInfo, LevelXPConfig, Note } from '@/types';
import React, { useEffect, useState, useCallback, useMemo, useContext } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import {
  TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS,
  calculateUserLevelInfo,
  STREAK_MILESTONES_FOR_CRYSTALS,
  calculateMasteryLevelInfo,
  REP_PER_XP,
  FACTIONS,
  getContributionLevel
} from '@/lib/config';
import { XP_CONFIG } from '@/lib/xp-config';
import { CONSTELLATIONS } from '@/lib/constellations';
import { ACHIEVEMENTS } from '@/lib/achievements';
import {
  format,
  parseISO,
  subDays,
  startOfYear,
  endOfYear,
  startOfDay,
  endOfDay,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  subWeeks,
  isSameDay,
  getDay,
  isWithinInterval,
  addDays,
  subMonths,
  eachWeekOfInterval,
  eachMonthOfInterval,
  Interval,
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";
import { useAlliance } from './AllianceProvider';


// Helper function to recursively remove undefined values from an object
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return undefined; // Return undefined to be filtered out
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(v => v !== undefined);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined) {
          const sanitizedValue = removeUndefinedValues(value);
          if (sanitizedValue !== undefined) {
            newObj[key] = sanitizedValue;
          }
        }
      }
    }
    // Return undefined if the object becomes empty after cleaning
    return Object.keys(newObj).length > 0 ? newObj : undefined;
  }
  return obj;
};

interface UserRecordsContextType {
  records: RecordEntry[];
  addRecord: (entry: Omit<RecordEntry, 'id'>) => void;
  updateRecord: (entry: RecordEntry) => void;
  deleteRecord: (recordId: string) => void;
  getRecordsByDate: (date: string) => RecordEntry[];
  getRecordsForDateRange: (startDate: Date, endDate: Date) => RecordEntry[];
  getAggregateSum: (startDate: Date, endDate: Date, taskId?: string | null) => number;
  getYearlySum: (year: number, taskId?: string | null) => number;
  getAllRecordsStringified: () => string;
  getDailyConsistency: (days: number, taskId?: string | null) => number;
  getCurrentStreak: (taskId?: string | null) => number;
  taskDefinitions: TaskDefinition[];
  addTaskDefinition: (taskData: Omit<TaskDefinition, 'id' | 'status'>) => string;
  updateTaskDefinition: (task: TaskDefinition) => void;
  deleteTaskDefinition: (taskId: string) => void;
  getTaskDefinitionById: (taskId: string) => TaskDefinition | undefined;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  getStatsForCompletedWeek: (weekOffset: number, taskId?: string | null) => WeeklyProgressStats | null;
  getAggregatesForChart: (timeRange: ProgressChartTimeRange, taskId: string | null) => AggregatedTimeDataPoint[];
  getUserLevelInfo: () => UserLevelInfo | null;
  totalBonusPoints: number;
  awardTierEntryBonus: (bonusAmount: number) => void;
  awardBonusPoints: (bonusAmount: number, isMasterBonus?: boolean) => void;
  deductBonusPoints: (penalty: number) => void;
  resetUserProgress: () => void;
  updateUserDataInDb: (dataToUpdate: Partial<UserData>) => Promise<void>;
  userData: UserData | null;
  isUserDataLoaded: boolean;
  // Constellations
  getAvailableSkillPoints: (taskId: string) => number;
  unlockSkill: (skillId: string, taskId: string, cost: number) => boolean;
  isSkillUnlocked: (skillId: string) => boolean;
  constellations: Constellation[];
  // Insights
  getTaskDistribution: (startDate: Date, endDate: Date, taskId?: string | null) => TaskDistributionData[];
  getProductivityByDay: (startDate: Date, endDate: Date, taskId?: string | null) => ProductivityByDayData[];
  getDailyTimeBreakdown: (date?: Date) => DailyTimeBreakdownData[];
  // Freeze Crystals
  freezeCrystals: number;
  useFreezeCrystal: () => void;
  // Achievements
  unlockedAchievements: string[];
  claimableAchievements: string[];
  claimAchievement: (achievementId: string) => void;
  // High Goals
  highGoals: HighGoal[];
  addHighGoal: (goal: Omit<HighGoal, 'id'>) => void;
  updateHighGoal: (goal: HighGoal) => void;
  deleteHighGoal: (goalId: string) => void;
  getHighGoalProgress: (goal: HighGoal) => number;
  masterBonusAwarded: boolean;
  getTaskMasteryInfo: (taskId: string) => TaskMasteryInfo | null;
  // Economy
  convertXpToShards: (xpAmount: number) => void;
  // Notes
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  deleteNote: (noteId: string) => void;
}

const UserRecordsContext = React.createContext<UserRecordsContextType | undefined>(undefined);

export const UserRecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, userData: authUserData, isUserDataLoaded, isGuest } = useAuth();
  const [userData, setUserData] = useState<UserData | null>(null);
  const { toast } = useToast();
  const { userAlliances, updateAllianceProgress, updateMemberContribution } = useAlliance();

  useEffect(() => {
    if (isUserDataLoaded && authUserData) {
      // Data migration for tasks without a status
      const needsMigration = authUserData.taskDefinitions?.some(task => !task.status);
      if (needsMigration && authUserData.taskDefinitions) {
        const migratedTasks = authUserData.taskDefinitions.map(task => 
          task.status ? task : { ...task, status: 'active' as TaskStatus }
        );
        const migratedUserData = { ...authUserData, taskDefinitions: migratedTasks };
        setUserData(migratedUserData);
        if (user) {
          updateUserDataInDb({ taskDefinitions: migratedTasks });
        }
      } else {
        setUserData(authUserData);
      }
    } else if (isUserDataLoaded) {
      setUserData(authUserData);
    }
  }, [authUserData, isUserDataLoaded, user]);

  const records = useMemo(() => userData?.records || [], [userData]);
  
  const taskDefinitions = useMemo(() => {
    const userTasks = userData?.taskDefinitions || [];
    const defaultTasks = DEFAULT_TASK_DEFINITIONS.map(t => ({...t, status: 'active' as TaskStatus}));

    const userTaskMap = new Map(userTasks.map(task => [task.id, task]));

    // Merge default tasks with user tasks, user's overrides default
    const mergedTasks = defaultTasks.map(defaultTask => 
      userTaskMap.has(defaultTask.id) 
        ? { ...defaultTask, ...userTaskMap.get(defaultTask.id) } 
        : defaultTask
    );

    // Add any truly custom tasks (not in defaults)
    userTasks.forEach(userTask => {
      if (!defaultTasks.some(dt => dt.id === userTask.id)) {
        mergedTasks.push(userTask);
      }
    });
    
    return mergedTasks;
  }, [userData?.taskDefinitions]);

  const totalBonusPoints = useMemo(() => userData?.bonusPoints || 0, [userData]);
  const unlockedAchievements = useMemo(() => userData?.unlockedAchievements || [], [userData]);
  const claimableAchievements = useMemo(() => userData?.claimableAchievements || [], [userData]);
  const spentSkillPoints = useMemo(() => userData?.spentSkillPoints || {}, [userData]);
  const unlockedSkills = useMemo(() => userData?.unlockedSkills || [], [userData]);
  const freezeCrystals = useMemo(() => userData?.freezeCrystals || 0, [userData]);
  const awardedStreakMilestones = useMemo(() => userData?.awardedStreakMilestones || {}, [userData]);
  const highGoals = useMemo(() => userData?.highGoals || [], [userData]);
  const masterBonusAwarded = useMemo(() => userData?.masterBonusAwarded || false, [userData]);
  const taskMastery = useMemo(() => userData?.taskMastery || {}, [userData]);
  const reputation = useMemo(() => userData?.reputation || {}, [userData]);
  const aetherShards = useMemo(() => userData?.aetherShards || 0, [userData]);
  const notes = useMemo(() => userData?.notes || [], [userData]);

  const updateUserDataInDb = useCallback(async (dataToUpdate: Partial<UserData>) => {
    const getNewState = (prevData: UserData | null) => {
      const newState = { ...(prevData || {} as UserData), ...dataToUpdate };
      return newState as UserData;
    }
    setUserData(getNewState);

    if (isGuest) {
      const guestDataString = localStorage.getItem('guest-userData');
      const guestData = guestDataString ? JSON.parse(guestDataString) : {};
      const updatedGuestData = { ...guestData, ...dataToUpdate };
      localStorage.setItem('guest-userData', JSON.stringify(updatedGuestData));
      return;
    }
    
    if (user) {
      if (!db) {
        console.error("Firestore DB is not initialized");
        return;
      }
      
      const userDocRef = doc(db!, 'users', user.uid);
      try {
        const sanitizedData = removeUndefinedValues(dataToUpdate);
        if (sanitizedData && Object.keys(sanitizedData).length > 0) {
           await setDoc(userDocRef, sanitizedData, { merge: true });
        }
      } catch (error) {
        console.error("Error updating user data in DB:", error);
      }
    }
  }, [user, isGuest]);

  const getTaskDefinitionById = useCallback((taskId: string): TaskDefinition | undefined => {
    return taskDefinitions.find(task => task.id === taskId);
  }, [taskDefinitions]);
    
  const getTaskMasteryInfo = useCallback((taskId: string): TaskMasteryInfo | null => {
    const masteryData = taskMastery[taskId];
    if (!masteryData) return calculateMasteryLevelInfo(0);

    return calculateMasteryLevelInfo(masteryData.xp);
  }, [taskMastery]);

  const calculateXpForRecord = useCallback((
    recordValue: number,
    task: TaskDefinition | undefined,
    userLevel: number
  ): number => {
      if (!task || !XP_CONFIG || XP_CONFIG.length === 0) return 0;
      
      const levelConfig = XP_CONFIG.find(c => c.level === userLevel);
      if (!levelConfig) return 0; // No config for this level

      let value = recordValue;
      if (task.unit === 'hours') {
          value = recordValue * 60; // Convert hours to minutes for consistent threshold checks
      }

      const phase = getContributionLevel(value, task.intensityThresholds);
      if (phase === 0) return 0;

      const baseXP = task.priority === 'high' ? levelConfig.base_high_xp : levelConfig.base_low_xp;
      
      const phasePercentages = [0, 0.25, 0.50, 0.75, 1.00];
      const percentage = phasePercentages[phase] || 0;

      return Math.round(baseXP * percentage);
  }, []);

  const calculateTotalXp = useCallback((): number => {
    if (!isUserDataLoaded) return 0;
    
    let cumulativeXp = 0;
    const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // We must recalculate XP based on the level AT THE TIME of the record
    let tempXpForLevelCalc = 0;
    for (const record of sortedRecords) {
        const { currentLevel } = calculateUserLevelInfo(tempXpForLevelCalc);
        const task = getTaskDefinitionById(record.taskType || '');
        const recordXp = calculateXpForRecord(record.value, task, currentLevel);
        tempXpForLevelCalc += recordXp;
    }
    cumulativeXp = tempXpForLevelCalc;

    return cumulativeXp + totalBonusPoints;
  }, [records, getTaskDefinitionById, totalBonusPoints, isUserDataLoaded, calculateXpForRecord]);

  const getUserLevelInfo = useCallback((): UserLevelInfo | null => {
    if (!isUserDataLoaded) return null;
    if (XP_CONFIG.length === 0) {
        console.warn("XP_CONFIG is empty. Leveling system will not function correctly.");
        return calculateUserLevelInfo(0);
    };
    const totalExperience = calculateTotalXp();
    return calculateUserLevelInfo(totalExperience);
  }, [isUserDataLoaded, calculateTotalXp]);

  const getCurrentStreak = useCallback((taskId: string | null = null): number => {
    if (!isUserDataLoaded) return 0;
  
    const allRecords = [...records];
    let taskRelevantRecords = taskId ? allRecords.filter(r => r.taskType === taskId) : allRecords;
    const recordDates = new Set(taskRelevantRecords.map(r => r.date));
  
    const taskDef = taskId ? getTaskDefinitionById(taskId) : null;
    const isDaily = !taskDef || !taskDef.frequencyType || taskDef.frequencyType !== 'weekly';
  
    let currentDate = startOfDay(new Date());
    let streak = 0;
  
    if (!recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
      currentDate = subDays(currentDate, 1);
    }
  
    if (isDaily) {
      while (recordDates.has(format(currentDate, 'yyyy-MM-dd'))) {
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
  }, [records, getTaskDefinitionById, isUserDataLoaded]);

  const addRecord = useCallback((entry: Omit<RecordEntry, 'id'>) => {
    const newRecord: RecordEntry = {
      ...entry,
      id: uuidv4(),
      value: Number(entry.value),
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Base data to update
    const dataToUpdate: Partial<UserData> = { records: updatedRecords };
    
    if (newRecord.taskType && user) {
        const task = getTaskDefinitionById(newRecord.taskType);
        const currentUserLevel = getUserLevelInfo()?.currentLevel || 1;
        const recordXp = calculateXpForRecord(newRecord.value, task, currentUserLevel);
        
        // Update task mastery
        const currentMastery = taskMastery[newRecord.taskType] || { level: 1, xp: 0 };
        const newMasteryXp = (currentMastery.xp || 0) + recordXp;
        const updatedTaskMastery = {
            ...taskMastery,
            [newRecord.taskType]: { ...currentMastery, xp: newMasteryXp }
        };
        dataToUpdate.taskMastery = updatedTaskMastery;
        
        // Update reputation
        const faction = FACTIONS.find(f => f.taskCategoryId === newRecord.taskType);
        if (faction) {
          const repGained = Math.round(recordXp * REP_PER_XP);
          const currentRep = reputation[faction.id] || 0;
          const newRep = currentRep + repGained;
          const updatedReputation = { ...reputation, [faction.id]: newRep };
          dataToUpdate.reputation = updatedReputation;
        }

        // Check for alliance progress
        if(userAlliances && userAlliances.length > 0) {
            const now = new Date();
            const relevantAlliance = userAlliances.find(a => 
                a.taskId === newRecord.taskType &&
                isWithinInterval(now, { start: parseISO(a.startDate), end: parseISO(a.endDate) })
            );

            if (relevantAlliance) {
                updateAllianceProgress(relevantAlliance.id, newRecord.value);
                updateMemberContribution(relevantAlliance.id, user.uid, recordXp);
            }
        }
    }
    
    updateUserDataInDb(dataToUpdate);

  }, [records, updateUserDataInDb, taskMastery, getTaskDefinitionById, getUserLevelInfo, reputation, calculateXpForRecord, userAlliances, updateAllianceProgress, updateMemberContribution, user]);

  const updateRecord = useCallback((entry: RecordEntry) => {
      // This is complex because we would need to reverse old XP/Rep and apply new.
      // For now, we'll just update the value and accept the slight data inaccuracy.
      // A more robust solution would store XP/Rep per record or recalculate all on change.
      const updatedRecords = records.map(r => r.id === entry.id ? { ...entry, value: Number(entry.value) } : r);
      updateUserDataInDb({ records: updatedRecords });
  }, [records, updateUserDataInDb]);

  const deleteRecord = useCallback((recordId: string) => {
      // This is also complex. For now, we'll remove the record but won't deduct the earned XP/Rep.
      const updatedRecords = records.filter(r => r.id !== recordId);
      updateUserDataInDb({ records: updatedRecords });
  }, [records, updateUserDataInDb]);

  const getRecordsByDate = useCallback((date: string): RecordEntry[] => {
    return records.filter(r => r.date === date);
  }, [records]);

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

  const getAggregateSum = useCallback((startDate: Date, endDate: Date, taskId: string | null = null): number => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    return relevantRecords.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  }, [getRecordsForDateRange]);

  const getYearlySum = useCallback((year: number, taskId: string | null = null): number => {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    return getAggregateSum(startDate, endDate, taskId);
  }, [getAggregateSum]);

  const getAllRecordsStringified = useCallback(() => {
    const formattedRecords = records.map(r => ({ date: r.date, value: r.value, taskType: r.taskType }));
    return JSON.stringify(formattedRecords);
  }, [records]);

  const getDailyConsistency = useCallback((days: number, taskId: string | null = null): number => {
    if (!isUserDataLoaded || days <= 0) return 0;
  
    const today = startOfDay(new Date());
    const startDate = startOfDay(subDays(today, days - 1));
  
    let relevantRecords = getRecordsForDateRange(startDate, today);
    
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    
    const recordDates = new Set(relevantRecords.map(r => r.date));
  
    if (!taskId) {
      const activeDays = recordDates.size;
      return Math.round((activeDays / days) * 100);
    }
  
    const taskDef = getTaskDefinitionById(taskId);
    if (!taskDef || taskDef.frequencyType === 'daily' || !taskDef.frequencyType) {
      const activeDays = recordDates.size;
      return Math.round((activeDays / days) * 100);
    } else {
      const freqCount = taskDef.frequencyCount || 1;
      let totalWeeks = 0;
      let successfulWeeks = 0;
      let currentDate = today;
  
      while(currentDate >= startDate) {
        const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
  
        const recordsThisWeek = [...recordDates].filter(dateStr => {
          const d = parseISO(dateStr);
          return isWithinInterval(d, { start: weekStart, end: weekEnd })
        }).length;
        
        if(isWithinInterval(weekStart, {start: startDate, end: today}) || isWithinInterval(weekEnd, {start: startDate, end: today})) {
            totalWeeks++;
            if (recordsThisWeek >= freqCount) {
                successfulWeeks++;
            }
        }
        currentDate = subDays(weekStart, 1);
      }
      
      if (totalWeeks === 0) return 100;
      return Math.round((successfulWeeks / totalWeeks) * 100);
    }
  
  }, [getRecordsForDateRange, getTaskDefinitionById, isUserDataLoaded]);

  const addTaskDefinition = useCallback((taskData: Omit<TaskDefinition, 'id' | 'status'>): string => {
    const newId = uuidv4();
    const newTask: TaskDefinition = {
      ...taskData,
      id: newId,
      status: 'active' as TaskStatus,
    };
    const updatedTasks = [...taskDefinitions, newTask];
    updateUserDataInDb({ taskDefinitions: updatedTasks });
    return newId;
  }, [taskDefinitions, updateUserDataInDb]);

  const updateTaskDefinition = useCallback((updatedTask: TaskDefinition) => {
    const updatedTasks = taskDefinitions.map(task => task.id === updatedTask.id ? { ...updatedTask } : task);
    updateUserDataInDb({ taskDefinitions: updatedTasks });
  }, [taskDefinitions, updateUserDataInDb]);

  const deleteTaskDefinition = useCallback((taskId: string) => {
    const updatedTasks = taskDefinitions.filter(task => task.id !== taskId);
    const updatedRecords = records.map(rec => rec.taskType === taskId ? {...rec, taskType: undefined} : rec);
    updateUserDataInDb({ taskDefinitions: updatedTasks, records: updatedRecords });
  }, [taskDefinitions, records, updateUserDataInDb]);

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    const updatedTasks = taskDefinitions.map(task => {
        if (task.id === taskId) {
            const updatedTask = { ...task, status };
            if (status === 'completed') {
                updatedTask.completedDate = new Date().toISOString();
            }
            return updatedTask;
        }
        return task;
    });
    updateUserDataInDb({ taskDefinitions: updatedTasks });
  }, [taskDefinitions, updateUserDataInDb]);

  const getStatsForCompletedWeek = useCallback((weekOffset: number, taskId?: string | null): WeeklyProgressStats | null => {
    if (records.length === 0) return null;
    const today = new Date();
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const targetWeekStart = subWeeks(currentWeekStart, weekOffset);
    let targetWeekEnd = endOfWeek(targetWeekStart, { weekStartsOn: 1 });

    if (targetWeekEnd > today) {
        targetWeekEnd = today;
    }
    
    if (targetWeekStart > today) {
        return { total: 0, startDate: targetWeekStart, endDate: targetWeekEnd };
    }

    const sum = getAggregateSum(targetWeekStart, targetWeekEnd, taskId);
    return { total: sum, startDate: targetWeekStart, endDate: targetWeekEnd };

  }, [records, getAggregateSum]);

  const getAggregatesForChart = useCallback((timeRange: ProgressChartTimeRange, taskId: string | null): AggregatedTimeDataPoint[] => {
    if (records.length === 0) return [];
    const today = new Date();
    
    const getIntervalAndFormat = () => {
        switch (timeRange) {
            case 'monthly':
                return {
                    interval: { start: subDays(today, 29), end: today },
                    eachFn: eachDayOfInterval,
                    formatFn: (d: Date) => format(d, 'd'),
                    subFormatFn: (d: Date) => format(d, 'MMM')
                };
            case 'quarterly':
                return {
                    interval: { start: subMonths(today, 3), end: today },
                    eachFn: (interval: Interval) => eachWeekOfInterval(interval, { weekStartsOn: 1 }),
                    formatFn: (d: Date) => format(d, 'd'),
                    subFormatFn: (d: Date) => format(d, 'MMM')
                };
            case 'biannually':
                 return {
                    interval: { start: subMonths(today, 6), end: today },
                    eachFn: (interval: Interval) => eachWeekOfInterval(interval, { weekStartsOn: 1 }),
                    formatFn: (d: Date) => format(d, 'd'),
                    subFormatFn: (d: Date) => format(d, 'MMM')
                };
            case 'yearly':
                return {
                    interval: { start: subMonths(today, 12), end: today },
                    eachFn: eachMonthOfInterval,
                    formatFn: (d: Date) => format(d, 'MMM'),
                    subFormatFn: (d: Date) => format(d, 'yyyy')
                };
            case 'weekly':
            default:
                const weekStart = startOfWeek(today, { weekStartsOn: 1 });
                return {
                    interval: { start: weekStart, end: addDays(weekStart, 6) },
                    eachFn: eachDayOfInterval,
                    formatFn: (d: Date) => format(d, 'E'),
                    subFormatFn: (d: Date) => ''
                };
        }
    };

    const { interval, eachFn, formatFn, subFormatFn } = getIntervalAndFormat();
    
    return eachFn(interval).map((date, index, arr) => {
        let endDate = date;
        if (timeRange === 'quarterly' || timeRange === 'biannually') {
            endDate = endOfWeek(date, { weekStartsOn: 1 });
        } else if (timeRange === 'yearly') {
            endDate = endOfYear(date);
        }

        const sum = getAggregateSum(date, endDate, taskId);
        
        let dateLabel = formatFn(date);
        const prevDate = arr[index - 1];
        if (prevDate && subFormatFn(prevDate) !== subFormatFn(date)) {
            dateLabel = `${subFormatFn(date)} ${dateLabel}`;
        } else if (index === 0) {
            dateLabel = `${subFormatFn(date)} ${dateLabel}`;
        }

        return {
            date: dateLabel.trim(),
            value: sum
        };
    });
}, [records, getAggregateSum]);

  const awardTierEntryBonus = useCallback((bonusAmount: number) => {
    if (bonusAmount > 0) {
      const newBonus = totalBonusPoints + bonusAmount;
      updateUserDataInDb({ bonusPoints: newBonus });
    }
  }, [totalBonusPoints, updateUserDataInDb]);

  const awardBonusPoints = useCallback((bonusAmount: number, isMasterBonus = false) => {
    if (bonusAmount > 0) {
      const newBonus = totalBonusPoints + bonusAmount;
      const dataToUpdate: Partial<UserData> = { bonusPoints: newBonus };
      if (isMasterBonus) {
        dataToUpdate.masterBonusAwarded = true;
      }
      updateUserDataInDb(dataToUpdate);
    }
  }, [totalBonusPoints, updateUserDataInDb]);

  const deductBonusPoints = useCallback((penalty: number) => {
    const newBonus = totalBonusPoints - Math.abs(penalty);
    updateUserDataInDb({ bonusPoints: newBonus });
  }, [totalBonusPoints, updateUserDataInDb]);

  const resetUserProgress = useCallback(() => {
    const resetData: Partial<UserData> = {
        records: [],
        bonusPoints: 0,
        unlockedAchievements: [],
        spentSkillPoints: {},
        unlockedSkills: [],
        freezeCrystals: 0,
        awardedStreakMilestones: {},
        highGoals: [],
        taskMastery: {},
        aetherShards: 0,
        reputation: {},
    };
    updateUserDataInDb(resetData);
    // Force a re-evaluation of the user data to ensure UI updates
    setUserData(prev => ({
        ...(prev ?? ({} as UserData)),
        ...resetData
    }));
  }, [updateUserDataInDb]);

  const useFreezeCrystal = useCallback(() => {
    if (freezeCrystals > 0) {
      const newCrystals = freezeCrystals - 1;
      updateUserDataInDb({ freezeCrystals: newCrystals });
    }
  }, [freezeCrystals, updateUserDataInDb]);

  // Constellation Functions
  const getAvailableSkillPoints = useCallback((taskId: string): number => {
    if (records.length === 0) return 0;
    const levelInfo = getUserLevelInfo();
    if (!levelInfo) return 0;

    const totalPoints = records
      .filter(r => r.taskType === taskId)
      .reduce((sum, r) => {
          const task = getTaskDefinitionById(r.taskType || '');
          const recordXp = calculateXpForRecord(r.value, task, levelInfo.currentLevel);
          return sum + recordXp;
      }, 0);

    const spentPoints = spentSkillPoints[taskId] || 0;
    return totalPoints - spentPoints;
  }, [records, spentSkillPoints, getTaskDefinitionById, getUserLevelInfo, calculateXpForRecord]);

  const isSkillUnlocked = useCallback((skillId: string): boolean => {
    return unlockedSkills.includes(skillId);
  }, [unlockedSkills]);

  const unlockSkill = useCallback((skillId: string, taskId: string, cost: number): boolean => {
    const availablePoints = getAvailableSkillPoints(taskId);
    if (availablePoints >= cost && !isSkillUnlocked(skillId)) {
        const updatedPoints = { ...spentSkillPoints, [taskId]: (spentSkillPoints[taskId] || 0) + cost };
        const updatedSkills = [...unlockedSkills, skillId];
        updateUserDataInDb({ spentSkillPoints: updatedPoints, unlockedSkills: updatedSkills });
      return true;
    }
    return false;
  }, [getAvailableSkillPoints, isSkillUnlocked, updateUserDataInDb, spentSkillPoints, unlockedSkills]);

  const constellations = useMemo(() => CONSTELLATIONS, []);

  // Insights Functions
  const getTaskDistribution = useCallback((startDate: Date, endDate: Date, taskId: string | null = null): TaskDistributionData[] => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
        relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    const distribution = new Map<string, { value: number; color: string; name: string }>();

    relevantRecords.forEach(record => {
      const taskDef = record.taskType ? getTaskDefinitionById(record.taskType) : undefined;
      const effectiveTaskId = taskDef?.id || 'unassigned';
      const taskName = taskDef?.name || 'Unassigned';
      const taskColor = taskDef?.color || DEFAULT_TASK_COLOR;

      const current = distribution.get(effectiveTaskId) || { value: 0, color: taskColor, name: taskName };
      current.value += record.value;
      distribution.set(effectiveTaskId, current);
    });

    return Array.from(distribution.entries()).map(([_, data]) => ({
      name: data.name,
      value: data.value,
      fill: data.color,
    }));
  }, [getRecordsForDateRange, getTaskDefinitionById]);

  const getProductivityByDay = useCallback((startDate: Date, endDate: Date, taskId: string | null = null): ProductivityByDayData[] => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
     if (taskId) {
        relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    const dayTotals = [
        { day: 'Sun', total: 0 }, { day: 'Mon', total: 0 }, { day: 'Tue', total: 0 }, 
        { day: 'Wed', total: 0 }, { day: 'Thu', total: 0 }, { day: 'Fri', total: 0 }, { day: 'Sat', total: 0 }
    ];

    relevantRecords.forEach(record => {
        try {
            const dayOfWeek = getDay(parseISO(record.date)); // 0 for Sunday, 1 for Monday, etc.
            dayTotals[dayOfWeek].total += record.value;
        } catch(e) {
            // Ignore invalid dates
        }
    });

    return dayTotals;
  }, [getRecordsForDateRange]);

  const getDailyTimeBreakdown = useCallback((date: Date = new Date()): DailyTimeBreakdownData[] => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dailyRecords = getRecordsByDate(dateStr);
    
    const timeBreakdown = new Map<string, { name: string; value: number; color: string }>();
    let totalMinutes = 0;

    const timeBasedRecords = dailyRecords.filter(record => {
        if (!record.taskType) return false;
        const task = getTaskDefinitionById(record.taskType);
        return task && (task.unit === 'minutes' || task.unit === 'hours');
    });

    timeBasedRecords.forEach(record => {
      if (!record.taskType) return; // Should not happen due to filter, but for type safety
      const task = getTaskDefinitionById(record.taskType)!;
      const minutes = task.unit === 'hours' ? record.value * 60 : record.value;
      const current = timeBreakdown.get(task.id) || { name: task.name, value: 0, color: task.color };
      current.value += minutes;
      timeBreakdown.set(task.id, current);
      totalMinutes += minutes;
    });

    const result: DailyTimeBreakdownData[] = Array.from(timeBreakdown.values());
    
    const remainingMinutes = 1440 - totalMinutes;

    if (timeBasedRecords.length === 0) {
      return [{
          name: 'Unallocated',
          value: 1440,
          color: 'hsl(var(--muted))'
      }];
    }
    
    if (remainingMinutes > 0) {
      result.push({
        name: 'Unallocated',
        value: remainingMinutes,
        color: 'hsl(var(--muted))'
      });
    }

    return result;
  }, [getRecordsByDate, taskDefinitions, getTaskDefinitionById]);
  
  
  const getAggregateSumForTask = useCallback((taskId: string): number => {
    const allTimeRecords = records.filter(r => r.taskType === taskId);
    const sum = allTimeRecords.reduce((total, r) => total + r.value, 0);

    const taskDef = getTaskDefinitionById(taskId);
    if (!taskDef) return sum;

    // Handle unit conversion for titles (e.g. learning is stored in minutes, title is for hours)
    if (taskDef.unit === 'minutes') return sum / 60; // Convert to hours
    
    return sum;
  }, [records, getTaskDefinitionById]);

  // Achievement Check
  useEffect(() => {
    if (!isUserDataLoaded || !userData) return;
    const levelInfo = getUserLevelInfo();
    if (!levelInfo) return;

    const streaks: Record<string, number> = {};
    taskDefinitions.forEach(task => {
        streaks[task.id] = getCurrentStreak(task.id);
    });
    const unlockedSkillCount = unlockedSkills.length;
    let loreEntryCount = 0;

    const context = { levelInfo, streaks, unlockedSkillCount, loreEntryCount, getAggregateSumForTask };
    
    const nowClaimable: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
      // An achievement is claimable if its conditions are met AND it's not already unlocked or pending claim.
      if (!unlockedAchievements.includes(ach.id) && !claimableAchievements.includes(ach.id) && ach.check(context)) {
        nowClaimable.push(ach.id);
      }
    });

    if (nowClaimable.length > 0) {
      const updatedClaimable = [...new Set([...claimableAchievements, ...nowClaimable])];
      updateUserDataInDb({ claimableAchievements: updatedClaimable });
      toast({
        title: `✨ New Achievement${nowClaimable.length > 1 ? 's' : ''} Ready!`,
        description: "Visit the achievements page to claim your reward.",
      });
    }
  }, [isUserDataLoaded, getUserLevelInfo, taskDefinitions, getCurrentStreak, unlockedSkills.length, unlockedAchievements, claimableAchievements, toast, updateUserDataInDb, userData, getAggregateSumForTask]);

  const claimAchievement = useCallback((achievementId: string) => {
    if (claimableAchievements.includes(achievementId)) {
        const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
        toast({
          title: `🏆 ${ach?.isTitle ? 'Title' : 'Achievement'} Unlocked!`,
          description: ach?.name || 'You have unlocked a new achievement.',
        });
        
        const newUnlockedAchievements = [...unlockedAchievements, achievementId];
        const newClaimableAchievements = claimableAchievements.filter(id => id !== achievementId);
        
        updateUserDataInDb({ 
            unlockedAchievements: newUnlockedAchievements,
            claimableAchievements: newClaimableAchievements
        });
    }
  }, [claimableAchievements, unlockedAchievements, updateUserDataInDb, toast]);

  // High Goal Functions
  const addHighGoal = useCallback((goalData: Omit<HighGoal, 'id'>) => {
    const newGoal: HighGoal = { ...goalData, id: uuidv4() };
    const updatedGoals = [...highGoals, newGoal];
    updateUserDataInDb({ highGoals: updatedGoals });
  }, [highGoals, updateUserDataInDb]);

  const updateHighGoal = useCallback((updatedGoal: HighGoal) => {
    const updatedGoals = highGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    updateUserDataInDb({ highGoals: updatedGoals });
  }, [highGoals, updateUserDataInDb]);

  const deleteHighGoal = useCallback((goalId: string) => {
    const goalToDelete = highGoals.find(g => g.id === goalId);
    if (!goalToDelete) return;
    
    const progress = getHighGoalProgress(goalToDelete);
    if (progress >= goalToDelete.targetValue) {
      const shardsToAward = Math.round(goalToDelete.targetValue / 10);
      const newShards = (userData?.aetherShards || 0) + shardsToAward;
      updateUserDataInDb({ aetherShards: newShards });
      toast({
        title: "Objective Complete!",
        description: `You've earned ${shardsToAward} Aether Shards for completing "${goalToDelete.name}".`
      });
    }

    const updatedGoals = highGoals.filter(g => g.id !== goalId);
    updateUserDataInDb({ highGoals: updatedGoals });

  }, [highGoals, updateUserDataInDb, userData?.aetherShards, toast]);
  
  const getHighGoalProgress = useCallback((goal: HighGoal) => {
    return getAggregateSum(parseISO(goal.startDate), parseISO(goal.endDate), goal.taskId);
  }, [getAggregateSum]);
  
  // Streak milestone rewards check
  useEffect(() => {
    if (!isUserDataLoaded || !user || !userData) return;
    const newMilestones: Record<string, number[]> = {};
    let crystalsAwarded = 0;

    taskDefinitions.forEach(task => {
      const streak = getCurrentStreak(task.id);
      const currentTaskMilestones = awardedStreakMilestones[task.id] || [];
      const newAwardsForTask: number[] = [];

      STREAK_MILESTONES_FOR_CRYSTALS.forEach(milestone => {
        if(streak >= milestone && !currentTaskMilestones.includes(milestone)) {
          crystalsAwarded++;
          newAwardsForTask.push(milestone);
        }
      });
      if(newAwardsForTask.length > 0) {
        newMilestones[task.id] = [...currentTaskMilestones, ...newAwardsForTask];
      }
    });

    if(crystalsAwarded > 0) {
      const updatedTotalCrystals = freezeCrystals + crystalsAwarded;
      const updatedMilestones = {...awardedStreakMilestones, ...newMilestones};
      updateUserDataInDb({ freezeCrystals: updatedTotalCrystals, awardedStreakMilestones: updatedMilestones });
      toast({
        title: "❄️ Freeze Crystal Earned!",
        description: `Your dedication has rewarded you with ${crystalsAwarded} Freeze Crystal${crystalsAwarded > 1 ? 's' : ''}!`
      });
    }
  }, [records, taskDefinitions, awardedStreakMilestones, freezeCrystals, isUserDataLoaded, user, getCurrentStreak, updateUserDataInDb, toast, userData]);

  const convertXpToShards = useCallback((xpAmount: number) => {
    if (xpAmount <= 0) {
      throw new Error("Amount must be positive.");
    }
    const convertibleXp = userData?.bonusPoints || 0;
    if (convertibleXp < xpAmount) {
      throw new Error("Not enough convertible bonus XP.");
    }
    const shardsGained = Math.floor(xpAmount / 5);
    if (shardsGained <= 0) {
        throw new Error("XP amount is too low to convert into at least one shard.");
    }
    
    const newBonusPoints = convertibleXp - xpAmount;
    const newAetherShards = (userData?.aetherShards || 0) + shardsGained;

    updateUserDataInDb({
      bonusPoints: newBonusPoints,
      aetherShards: newAetherShards,
    });
  }, [userData, updateUserDataInDb]);

  const addNote = useCallback((noteData: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = {
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      ...noteData,
    };
    const updatedNotes = [...notes, newNote].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    updateUserDataInDb({ notes: updatedNotes });
  }, [notes, updateUserDataInDb]);

  const deleteNote = useCallback((noteId: string) => {
    const updatedNotes = notes.filter(n => n.id !== noteId);
    updateUserDataInDb({ notes: updatedNotes });
  }, [notes, updateUserDataInDb]);

  const contextValue = useMemo(() => ({
    records,
    addRecord,
    updateRecord,
    deleteRecord,
    getRecordsByDate,
    getRecordsForDateRange,
    getAggregateSum,
    getYearlySum,
    getAllRecordsStringified,
    getDailyConsistency,
    getCurrentStreak,
    taskDefinitions,
    addTaskDefinition,
    updateTaskDefinition,
    deleteTaskDefinition,
    updateTaskStatus,
    getTaskDefinitionById,
    getStatsForCompletedWeek,
    getAggregatesForChart,
    getUserLevelInfo,
    totalBonusPoints,
    awardTierEntryBonus,
    awardBonusPoints,
    deductBonusPoints,
    resetUserProgress,
    updateUserDataInDb,
    userData,
    isUserDataLoaded,
    getAvailableSkillPoints,
    unlockSkill,
    isSkillUnlocked,
    constellations,
    getTaskDistribution,
    getProductivityByDay,
    getDailyTimeBreakdown,
    freezeCrystals,
    useFreezeCrystal,
    unlockedAchievements,
    claimableAchievements,
    claimAchievement,
    highGoals,
    addHighGoal,
    updateHighGoal,
    deleteHighGoal,
    getHighGoalProgress,
    masterBonusAwarded,
    getTaskMasteryInfo,
    convertXpToShards,
    addNote,
    deleteNote,
  }), [
      records,
      addRecord,
      updateRecord,
      deleteRecord,
      getRecordsByDate,
      getRecordsForDateRange,
      getAggregateSum,
      getYearlySum,
      getAllRecordsStringified,
      getDailyConsistency,
      getCurrentStreak,
      taskDefinitions,
      addTaskDefinition,
      updateTaskDefinition,
      deleteTaskDefinition,
      updateTaskStatus,
      getTaskDefinitionById,
      getStatsForCompletedWeek,
      getAggregatesForChart,
      getUserLevelInfo,
      totalBonusPoints,
      awardTierEntryBonus,
      awardBonusPoints,
      deductBonusPoints,
      resetUserProgress,
      updateUserDataInDb,
      userData,
      isUserDataLoaded,
      getAvailableSkillPoints,
      unlockSkill,
      isSkillUnlocked,
      constellations,
      getTaskDistribution,
      getProductivityByDay,
      getDailyTimeBreakdown,
      freezeCrystals,
      useFreezeCrystal,
      unlockedAchievements,
      claimableAchievements,
      claimAchievement,
      highGoals,
      addHighGoal,
      updateHighGoal,
      deleteHighGoal,
      getHighGoalProgress,
      masterBonusAwarded,
      getTaskMasteryInfo,
      convertXpToShards,
      addNote,
      deleteNote,
  ]);

  return (
    <UserRecordsContext.Provider value={contextValue}>
      {children}
    </UserRecordsContext.Provider>
  );
};

export const useUserRecords = (): UserRecordsContextType => {
  const context = React.useContext(UserRecordsContext);
  if (context === undefined) {
    throw new Error('useUserRecords must be used within a UserRecordsProvider');
  }
  return context;
};
