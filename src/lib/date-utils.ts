

import {
  format,
  startOfMonth,
  getDay,
  getDaysInMonth,
  setDate,
  getYear,
  getMonth,
  isFuture,
  startOfDay,
  eachDayOfInterval,
  subWeeks,
  endOfDay,
  startOfYear,
  endOfYear,
  addDays,
} from 'date-fns';
import type { RecordEntry, MonthColumn, MonthlyDayData, TaskDefinition } from '@/types';
import { getContributionLevel, DEFAULT_TASK_COLOR, NUM_WEEKS_TO_DISPLAY } from './config';

export const getMonthlyGraphData = (
  records: RecordEntry[], 
  taskDefinitions: TaskDefinition[],
  filterByTaskId: string | null = null,
  currentSystemDate: Date,
  displayMode: 'full' | 'current_month' = 'current_month',
  year?: number
): MonthColumn[] => {
  const today = startOfDay(currentSystemDate);
  const monthlyDataMap = new Map<string, { monthLabel: string; year: number; month: number; days: MonthlyDayData[] }>();

  // Determine the date range
  let startDate: Date;
  let endDate: Date;
  const currentYear = getYear(today);
  const displayYear = year || currentYear;

  if (displayMode === 'full') {
    startDate = startOfYear(new Date(displayYear, 0, 1));
    endDate = endOfYear(new Date(displayYear, 11, 31));
  } else {
    // current_month view for the dashboard
    startDate = startOfMonth(today);
    // Ensure end date includes the entire current month
    const daysInMonth = getDaysInMonth(today);
    endDate = setDate(today, daysInMonth);
    endDate = endOfDay(endDate);
  }
  
  const allDaysInRange = eachDayOfInterval({ start: startDate, end: endDate });

  const recordsMap = new Map<string, RecordEntry[]>();
  records.forEach(record => {
    if (!recordsMap.has(record.date)) {
      recordsMap.set(record.date, []);
    }
    recordsMap.get(record.date)!.push(record);
  });

  const taskDefinitionMap = new Map<string, TaskDefinition>();
  taskDefinitions.forEach(task => taskDefinitionMap.set(task.id, task));
  
  // Populate all days in the range
  allDaysInRange.forEach(dateObj => {
    const year = getYear(dateObj);
    const month = getMonth(dateObj);
    const monthKey = `${year}-${month}`;

    if (!monthlyDataMap.has(monthKey)) {
      monthlyDataMap.set(monthKey, {
        monthLabel: format(dateObj, 'MMM'),
        year,
        month,
        days: [],
      });
    }
    
    const dateStr = format(dateObj, 'yyyy-MM-dd');
    const dailyRecords = recordsMap.get(dateStr) || [];
    const relevantRecords = filterByTaskId 
      ? dailyRecords.filter(r => r.taskType === filterByTaskId) 
      : dailyRecords;
    
    const totalValue = relevantRecords.reduce((sum, r) => sum + r.value, 0);

    let displayValue: number | null = null;
    let displayLevel = 0;
    let taskColor: string | undefined = undefined;
    let taskName: string | undefined = undefined;
    let taskType: string | undefined = undefined;
    let taskIntensityThresholds: readonly number[] | undefined = undefined;

    if (relevantRecords.length > 0) {
      displayValue = totalValue;
      const representativeRecord = relevantRecords[0];
      const taskDef = representativeRecord.taskType ? taskDefinitionMap.get(representativeRecord.taskType) : undefined;
      
      if (taskDef) {
        taskColor = taskDef.color;
        taskName = relevantRecords.length > 1 ? `${relevantRecords.length} tasks` : taskDef.name;
        taskType = taskDef.id;
        if (taskDef.intensityThresholds && taskDef.intensityThresholds.length === 4) {
          taskIntensityThresholds = taskDef.intensityThresholds;
        }
      } else {
        taskColor = DEFAULT_TASK_COLOR;
        taskName = relevantRecords.length > 1 ? `${relevantRecords.length} tasks` : 'Unassigned';
      }
      displayLevel = getContributionLevel(totalValue, taskIntensityThresholds);
    }
    
    monthlyDataMap.get(monthKey)!.days.push({
      date: dateStr,
      value: displayValue,
      level: displayLevel,
      taskType: taskType,
      taskName: taskName,
      taskColor: taskColor,
      isPlaceholder: false,
    });
  });

  const finalColumns: MonthColumn[] = [];

  monthlyDataMap.forEach((data) => {
    const { monthLabel, year, month, days } = data;
    const firstDayOfMonth = new Date(year, month, 1);
    const firstDayOfMonthWeekDay = getDay(firstDayOfMonth);

    const allMonthCells: MonthlyDayData[] = [];

    // Add placeholders for the start of the month
    for (let j = 0; j < firstDayOfMonthWeekDay; j++) {
      allMonthCells.push({
        date: `placeholder-start-${year}-${month}-${j}`,
        value: null,
        level: 0,
        isPlaceholder: true,
      });
    }

    // Add actual days
    days.forEach(day => {
        allMonthCells.push(day);
    });

    // Structure into weeks
    const weeks: MonthlyDayData[][] = [];
    let currentWeek: MonthlyDayData[] = [];
    allMonthCells.forEach(cell => {
      currentWeek.push(cell);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    });
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
            date: `placeholder-end-${year}-${month}-${currentWeek.length}`,
            value: null,
            level: 0,
            isPlaceholder: true,
        });
      }
      weeks.push(currentWeek);
    }
    
    // Ensure 6 rows for consistent alignment
    while(weeks.length < 6) {
        const placeholderWeek: MonthlyDayData[] = [];
        for (let j = 0; j < 7; j++) {
            placeholderWeek.push({
                date: `placeholder-fill-${year}-${month}-${weeks.length}-${j}`,
                value: null, level: 0, isPlaceholder: true
            });
        }
        weeks.push(placeholderWeek);
    }

    finalColumns.push({ monthLabel, year, month, weeks });
  });

  return finalColumns.sort((a,b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });
};
