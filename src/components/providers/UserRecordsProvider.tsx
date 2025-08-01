

"use client";

import type { RecordEntry, TaskDefinition, WeeklyProgressStats, AggregatedTimeDataPoint, UserLevelInfo, Constellation, TaskDistributionData, ProductivityByDayData, HighGoal, DailyTimeBreakdownData, UserData } from '@/types';
import React, from 'react';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './AuthProvider';
import {
  TASK_DEFINITIONS as DEFAULT_TASK_DEFINITIONS,
  calculateUserLevelInfo,
  STREAK_MILESTONES_FOR_CRYSTALS,
} from '@/lib/config';
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
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from "@/hooks/use-toast";

// Helper function to recursively remove undefined values from an object
const removeUndefinedValues = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(removeUndefinedValues).filter(v => v !== null && v !== undefined);
  }
  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const newObj: { [key: string]: any } = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        if (value !== undefined) {
          const sanitizedValue = removeUndefinedValues(value);
          if (sanitizedValue !== null && sanitizedValue !== undefined) {
            newObj[key] = sanitizedValue;
          }
        }
      }
    }
    // Return null if the object becomes empty after cleaning
    return Object.keys(newObj).length > 0 ? newObj : null;
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
  addTaskDefinition: (taskData: Omit<TaskDefinition, 'id'>) => string;
  updateTaskDefinition: (task: TaskDefinition) => void;
  deleteTaskDefinition: (taskId: string) => void;
  getTaskDefinitionById: (taskId: string) => TaskDefinition | undefined;
  getStatsForCompletedWeek: (weekOffset: number, taskId?: string | null) => WeeklyProgressStats | null;
  getWeeklyAggregatesForChart: (numberOfWeeks: number, taskId?: string | null) => AggregatedTimeDataPoint[];
  getUserLevelInfo: () => UserLevelInfo;
  totalBonusPoints: number;
  awardTierEntryBonus: (bonusAmount: number) => void;
  deductBonusPoints: (penalty: number) => void;
  updateUserDataInDb: (dataToUpdate: Partial<UserData>) => Promise<void>;
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
  // High Goals
  highGoals: HighGoal[];
  addHighGoal: (goal: Omit<HighGoal, 'id'>) => void;
  updateHighGoal: (goal: HighGoal) => void;
  deleteHighGoal: (goalId: string) => void;
  getHighGoalProgress: (goal: HighGoal) => number;
}

const UserRecordsContext = React.createContext<UserRecordsContextType | undefined>(undefined);

export const UserRecordsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isUserDataLoaded } = useAuth();
  const [userData, setUserData] = React.useState<UserData | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        setUserData(doc.data() as UserData);
      });
      return () => unsub();
    } else {
      setUserData(null);
    }
  }, [user]);

  const records = React.useMemo(() => userData?.records || [], [userData]);
  const taskDefinitions = React.useMemo(() => {
    if (userData?.taskDefinitions && userData.taskDefinitions.length > 0) {
      return userData.taskDefinitions;
    }
    return DEFAULT_TASK_DEFINITIONS.map(task => ({ ...task, id: task.id || uuidv4() }));
  }, [userData]);
  const totalBonusPoints = React.useMemo(() => userData?.bonusPoints || 0, [userData]);
  const unlockedAchievements = React.useMemo(() => userData?.unlockedAchievements || [], [userData]);
  const spentSkillPoints = React.useMemo(() => userData?.spentSkillPoints || {}, [userData]);
  const unlockedSkills = React.useMemo(() => userData?.unlockedSkills || [], [userData]);
  const freezeCrystals = React.useMemo(() => userData?.freezeCrystals || 0, [userData]);
  const awardedStreakMilestones = React.useMemo(() => userData?.awardedStreakMilestones || {}, [userData]);
  const highGoals = React.useMemo(() => userData?.highGoals || [], [userData]);

  const updateUserDataInDb = React.useCallback(async (dataToUpdate: Partial<UserData>) => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      try {
        const sanitizedData = removeUndefinedValues(dataToUpdate);
        if (sanitizedData && Object.keys(sanitizedData).length > 0) {
           await setDoc(userDocRef, sanitizedData, { merge: true });
        }
      } catch (error) {
        console.error("Error updating user data in DB:", error);
      }
    }
  }, [user]);

  const getTaskDefinitionById = React.useCallback((taskId: string): TaskDefinition | undefined => {
    return taskDefinitions.find(task => task.id === taskId);
  }, [taskDefinitions]);
    
  const getCurrentStreak = React.useCallback((taskId: string | null = null): number => {
    if (!isUserDataLoaded) return 0;
  
    const allRecords = [...records];
    let taskRelevantRecords = taskId ? allRecords.filter(r => r.taskType === taskId) : allRecords;
    const recordDates = new Set(taskRelevantRecords.map(r => r.date));
  
    const taskDef = taskId ? getTaskDefinitionById(taskId) : null;
    const isDaily = !taskDef || !taskDef.frequencyType || taskDef.frequencyType === 'daily';
  
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

  const addRecord = React.useCallback((entry: Omit<RecordEntry, 'id'>) => {
    const newRecord: RecordEntry = {
      ...entry,
      id: uuidv4(),
      value: Number(entry.value),
    };

    const updatedRecords = [...records, newRecord].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    updateUserDataInDb({ records: updatedRecords });
  }, [records, updateUserDataInDb]);

  const updateRecord = React.useCallback((entry: RecordEntry) => {
      const updatedRecords = records.map(r => r.id === entry.id ? { ...entry, value: Number(entry.value) } : r);
      updateUserDataInDb({ records: updatedRecords });
  }, [records, updateUserDataInDb]);

  const deleteRecord = React.useCallback((recordId: string) => {
      const updatedRecords = records.filter(r => r.id !== recordId);
      updateUserDataInDb({ records: updatedRecords });
  }, [records, updateUserDataInDb]);

  const getRecordsByDate = React.useCallback((date: string): RecordEntry[] => {
    return records.filter(r => r.date === date);
  }, [records]);

  const getRecordsForDateRange = React.useCallback((startDate: Date, endDate: Date): RecordEntry[] => {
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

  const getAggregateSum = React.useCallback((startDate: Date, endDate: Date, taskId: string | null = null): number => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
      relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    return relevantRecords.reduce((sum, r) => sum + (Number(r.value) || 0), 0);
  }, [getRecordsForDateRange]);

  const getYearlySum = React.useCallback((year: number, taskId: string | null = null): number => {
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    return getAggregateSum(startDate, endDate, taskId);
  }, [getAggregateSum]);

  const getAllRecordsStringified = React.useCallback(() => {
    const formattedRecords = records.map(r => ({ date: r.date, value: r.value, taskType: r.taskType }));
    return JSON.stringify(formattedRecords);
  }, [records]);

  const getDailyConsistency = React.useCallback((days: number, taskId: string | null = null): number => {
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

  const addTaskDefinition = React.useCallback((taskData: Omit<TaskDefinition, 'id'>): string => {
    const newId = uuidv4();
    const newTask: TaskDefinition = {
      ...taskData,
      id: newId,
    };
    const updatedTasks = [...taskDefinitions, newTask];
    updateUserDataInDb({ taskDefinitions: updatedTasks });
    return newId;
  }, [taskDefinitions, updateUserDataInDb]);

  const updateTaskDefinition = React.useCallback((updatedTask: TaskDefinition) => {
    const updatedTasks = taskDefinitions.map(task => task.id === updatedTask.id ? { ...updatedTask } : task);
    updateUserDataInDb({ taskDefinitions: updatedTasks });
  }, [taskDefinitions, updateUserDataInDb]);

  const deleteTaskDefinition = React.useCallback((taskId: string) => {
    const updatedTasks = taskDefinitions.filter(task => task.id !== taskId);
    const updatedRecords = records.map(rec => rec.taskType === taskId ? {...rec, taskType: undefined} : rec);
    updateUserDataInDb({ taskDefinitions: updatedTasks, records: updatedRecords });
  }, [taskDefinitions, records, updateUserDataInDb]);

  const getStatsForCompletedWeek = React.useCallback((weekOffset: number, taskId?: string | null): WeeklyProgressStats | null => {
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

  const getWeeklyAggregatesForChart = React.useCallback((numberOfWeeks: number, taskId?: string | null): AggregatedTimeDataPoint[] => {
    if (records.length === 0) return [];
    const today = new Date();
    const data: AggregatedTimeDataPoint[] = [];
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });

    for (let i = numberOfWeeks -1; i >= 0; i--) {
      const weekStartDate = subWeeks(currentWeekStart, i);
      if (weekStartDate > today && !isSameDay(weekStartDate, startOfWeek(today, {weekStartsOn:1}))) continue;

      const weekEndDate = endOfWeek(weekStartDate, { weekStartsOn: 1 });
      const sum = getAggregateSum(weekStartDate, (weekEndDate > today ? today : weekEndDate), taskId);

      data.push({
        date: format(weekStartDate, 'MMM d'),
        value: sum,
      });
    }
    return data;
  }, [records, getAggregateSum]);

  const getTotalBaseRecordValue = React.useCallback((): number => {
    return records.reduce((sum, record) => sum + (Number(record.value) || 0), 0);
  }, [records]);

  const getUserLevelInfo = React.useCallback((): UserLevelInfo => {
    const sumOfRecordValues = getTotalBaseRecordValue();
    const totalExperience = sumOfRecordValues + totalBonusPoints;
    return calculateUserLevelInfo(totalExperience);
  }, [getTotalBaseRecordValue, totalBonusPoints]);

  const awardTierEntryBonus = React.useCallback((bonusAmount: number) => {
    if (bonusAmount > 0) {
      const newBonus = totalBonusPoints + bonusAmount;
      updateUserDataInDb({ bonusPoints: newBonus });
    }
  }, [totalBonusPoints, updateUserDataInDb]);

  const deductBonusPoints = React.useCallback((penalty: number) => {
    const newBonus = totalBonusPoints - Math.abs(penalty);
    updateUserDataInDb({ bonusPoints: newBonus });
  }, [totalBonusPoints, updateUserDataInDb]);

  const useFreezeCrystal = React.useCallback(() => {
    if (freezeCrystals > 0) {
      const newCrystals = freezeCrystals - 1;
      updateUserDataInDb({ freezeCrystals: newCrystals });
    }
  }, [freezeCrystals, updateUserDataInDb]);


  // Constellation Functions
  const getAvailableSkillPoints = React.useCallback((taskId: string): number => {
    if (records.length === 0) return 0;
    const totalPoints = getAggregateSum(new Date("1900-01-01"), new Date(), taskId);
    const spentPoints = spentSkillPoints[taskId] || 0;
    return totalPoints - spentPoints;
  }, [getAggregateSum, records, spentSkillPoints]);

  const isSkillUnlocked = React.useCallback((skillId: string): boolean => {
    return unlockedSkills.includes(skillId);
  }, [unlockedSkills]);

  const unlockSkill = React.useCallback((skillId: string, taskId: string, cost: number): boolean => {
    const availablePoints = getAvailableSkillPoints(taskId);
    if (availablePoints >= cost && !isSkillUnlocked(skillId)) {
        const updatedPoints = { ...spentSkillPoints, [taskId]: (spentSkillPoints[taskId] || 0) + cost };
        const updatedSkills = [...unlockedSkills, skillId];
        updateUserDataInDb({ spentSkillPoints: updatedPoints, unlockedSkills: updatedSkills });
      return true;
    }
    return false;
  }, [getAvailableSkillPoints, isSkillUnlocked, updateUserDataInDb, spentSkillPoints, unlockedSkills]);

  const constellations = React.useMemo(() => CONSTELLATIONS, []);

  // Insights Functions
  const getTaskDistribution = React.useCallback((startDate: Date, endDate: Date, taskId: string | null = null): TaskDistributionData[] => {
    let relevantRecords = getRecordsForDateRange(startDate, endDate);
    if (taskId) {
        relevantRecords = relevantRecords.filter(r => r.taskType === taskId);
    }
    const distribution = new Map<string, { value: number; color: string; name: string }>();

    relevantRecords.forEach(record => {
      const taskDef = record.taskType ? getTaskDefinitionById(record.taskType) : undefined;
      const effectiveTaskId = taskDef?.id || 'unassigned';
      const taskName = taskDef?.name || 'Unassigned';
      const taskColor = taskDef?.color || '#8884d8';

      const current = distribution.get(effectiveTaskId) || { value: 0, color: taskColor, name: taskName };
      current.value += record.value;
      distribution.set(effectiveTaskId, current);
    });

    return Array.from(distribution.entries()).map(([_, data]) => ({
      name: data.name,
      value: data.value,
      fill: data.name,
    }));
  }, [getRecordsForDateRange, getTaskDefinitionById]);

  const getProductivityByDay = React.useCallback((startDate: Date, endDate: Date, taskId: string | null = null): ProductivityByDayData[] => {
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

  const getDailyTimeBreakdown = React.useCallback((date: Date = new Date()): DailyTimeBreakdownData[] => {
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

  // Achievement Check
  React.useEffect(() => {
    if (!isUserDataLoaded) return;
    const levelInfo = getUserLevelInfo();
    const streaks: Record<string, number> = {};
    taskDefinitions.forEach(task => {
        streaks[task.id] = getCurrentStreak(task.id);
    });
    const unlockedSkillCount = unlockedSkills.length;
    let loreEntryCount = 0; // Lore is disabled, so this will be 0

    const context = { levelInfo, streaks, unlockedSkillCount, loreEntryCount };
    
    const newlyUnlocked: string[] = [];
    ACHIEVEMENTS.forEach(ach => {
      if (!unlockedAchievements.includes(ach.id) && ach.check(context)) {
        newlyUnlocked.push(ach.id);
        toast({
          title: `🏆 Achievement Unlocked!`,
          description: ach.name,
        });
      }
    });

    if (newlyUnlocked.length > 0) {
      const updatedAchievements = [...new Set([...unlockedAchievements, ...newlyUnlocked])];
      updateUserDataInDb({ unlockedAchievements: updatedAchievements });
    }
  }, [isUserDataLoaded, getUserLevelInfo, taskDefinitions, getCurrentStreak, unlockedSkills.length, unlockedAchievements, toast, updateUserDataInDb]);

  // High Goal Functions
  const addHighGoal = React.useCallback((goalData: Omit<HighGoal, 'id'>) => {
    const newGoal: HighGoal = { ...goalData, id: uuidv4() };
    const updatedGoals = [...highGoals, newGoal];
    updateUserDataInDb({ highGoals: updatedGoals });
  }, [highGoals, updateUserDataInDb]);

  const updateHighGoal = React.useCallback((updatedGoal: HighGoal) => {
    const updatedGoals = highGoals.map(g => g.id === updatedGoal.id ? updatedGoal : g);
    updateUserDataInDb({ highGoals: updatedGoals });
  }, [highGoals, updateUserDataInDb]);

  const deleteHighGoal = React.useCallback((goalId: string) => {
    const updatedGoals = highGoals.filter(g => g.id !== goalId);
    updateUserDataInDb({ highGoals: updatedGoals });
  }, [highGoals, updateUserDataInDb]);
  
  const getHighGoalProgress = React.useCallback((goal: HighGoal) => {
    return getAggregateSum(parseISO(goal.startDate), parseISO(goal.endDate), goal.taskId);
  }, [getAggregateSum]);
  
  // Streak milestone rewards check
  React.useEffect(() => {
    if (!isUserDataLoaded || !user) return;
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
  }, [records, taskDefinitions, awardedStreakMilestones, freezeCrystals, isUserDataLoaded, user, getCurrentStreak, updateUserDataInDb, toast]);


  const contextValue = React.useMemo(() => ({
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
    getTaskDefinitionById,
    getStatsForCompletedWeek,
    getWeeklyAggregatesForChart,
    getUserLevelInfo,
    totalBonusPoints,
    awardTierEntryBonus,
    deductBonusPoints,
    updateUserDataInDb,
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
    highGoals,
    addHighGoal,
    updateHighGoal,
    deleteHighGoal,
    getHighGoalProgress,
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
      getTaskDefinitionById,
      getStatsForCompletedWeek,
      getWeeklyAggregatesForChart,
      getUserLevelInfo,
      totalBonusPoints,
      awardTierEntryBonus,
      deductBonusPoints,
      updateUserDataInDb,
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
      highGoals,
      addHighGoal,
      updateHighGoal,
      deleteHighGoal,
      getHighGoalProgress,
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
