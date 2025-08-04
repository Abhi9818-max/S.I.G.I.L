
"use client";

import React, { useEffect, useRef } from 'react';
import DaySquare from './DaySquare';
import type { DayData, MonthColumn, RecordEntry, TaskDefinition } from '@/types';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { getMonthlyGraphData } from '@/lib/date-utils';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getMonth, parseISO, isFuture, format, getYear } from 'date-fns';

interface ContributionGraphProps {
  year?: number; // Optional: for selecting a specific year
  onDayClick: (date: string) => void;
  selectedTaskFilterId: string | null;
  displayMode?: 'full' | 'current_month';
  // Allow passing records and tasks directly for friend profiles
  records?: RecordEntry[];
  taskDefinitions?: TaskDefinition[];
}

const ContributionGraph: React.FC<ContributionGraphProps> = ({ 
  year,
  onDayClick, 
  selectedTaskFilterId,
  displayMode = 'current_month',
  records: recordsProp,
  taskDefinitions: taskDefinitionsProp,
}) => {
  const userRecordsContext = useUserRecords();
  const [clientToday, setClientToday] = React.useState<Date | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null); 
  const monthColumnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Use passed props if available, otherwise use context
  const records = recordsProp ?? userRecordsContext.records;
  const taskDefinitions = taskDefinitionsProp ?? userRecordsContext.taskDefinitions;

  useEffect(() => {
    setClientToday(new Date()); 
  }, []);

  const monthlyGraphData: MonthColumn[] = React.useMemo(() => {
    if (!clientToday) return [];
    // Ensure we don't try to render a graph if there are no task definitions at all
    if (taskDefinitions.length === 0) return [];
    return getMonthlyGraphData(records, taskDefinitions, selectedTaskFilterId, clientToday, displayMode, year); 
  }, [records, taskDefinitions, clientToday, selectedTaskFilterId, displayMode, year]);

  useEffect(() => {
    if (clientToday && monthlyGraphData.length > 0 && displayMode === 'full') {
      const currentMonthKey = `${year || getYear(clientToday)}-${getMonth(clientToday)}`;
      const targetMonthEl = monthColumnRefs.current.get(currentMonthKey);
      const isViewingCurrentYear = (year || getYear(clientToday)) === getYear(new Date());

      if (targetMonthEl && scrollAreaRef.current && isViewingCurrentYear) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            const scrollAreaWidth = viewport.clientWidth;
            const targetScrollLeft = targetMonthEl.offsetLeft - (scrollAreaWidth / 2) + (targetMonthEl.offsetWidth / 2);
            
            setTimeout(() => {
              viewport.scrollTo({
                  left: targetScrollLeft,
                  behavior: 'smooth' 
              });
            }, 100);
        }
      }
    }
  }, [monthlyGraphData, clientToday, displayMode, year]); 

  if (!clientToday) {
    return <div className="p-4 text-center text-muted-foreground">Loading graph data...</div>;
  }
  
  if (taskDefinitions.length === 0) {
      return <div className="p-4 text-center text-muted-foreground">Please define tasks in 'Manage Tasks' to see the graph.</div>;
  }

  if (monthlyGraphData.length === 0) {
    return <div className="p-4 text-center text-muted-foreground">No records to display for this period.</div>;
  }


  return (
    <div className="flex gap-x-5 sm:gap-x-8">
      
      <ScrollArea className="w-full whitespace-nowrap" ref={scrollAreaRef}>
        <div className="flex gap-x-5 sm:gap-x-8">
          {monthlyGraphData.map((monthCol) => {
            const monthKey = `${monthCol.year}-${monthCol.month}`;
            return (
              <div
                key={monthKey}
                className="flex flex-col items-center flex-shrink-0"
                ref={el => {
                  if (el) monthColumnRefs.current.set(monthKey, el);
                  else monthColumnRefs.current.delete(monthKey);
                }}>
                <div className="text-sm font-medium mb-2 text-center h-5 flex items-center">{monthCol.monthLabel}</div>
                <div className="grid grid-cols-7 grid-rows-6 gap-2"> 
                  {monthCol.weeks.flat().map((day, dayIdx) => (
                    day.isPlaceholder ? (
                      <div key={`ph-${day.date}-${dayIdx}`} className="w-7 h-7 rounded-sm" />
                    ) : (
                      <div key={day.date} className="w-7 h-7">
                        <DaySquare 
                          day={day as DayData} 
                          onClick={() => {
                            const clickedDate = parseISO(day.date);
                              if (!isFuture(clickedDate) || format(clickedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
                              onDayClick(day.date);
                            }
                          }} 
                        />
                      </div>
                    )
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default ContributionGraph;
