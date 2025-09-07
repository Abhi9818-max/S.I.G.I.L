

"use client";

import React, { useState, useMemo, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import ContributionGraph from '@/components/records/ContributionGraph';
import RecordModal from '@/components/records/RecordModal';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { CornerDownLeft, ListFilter } from 'lucide-react';
import { format, getYear, parseISO, isToday, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from '@/components/ui/label';
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import type { TaskDefinition } from '@/types';
import TaskProgressCard from '@/components/records/TaskProgressCard';
import { toPng } from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

export default function CalendarPage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const { getUserLevelInfo, taskDefinitions, records, getRecordsForDateRange } = useUserRecords();
  const { dashboardSettings } = useSettings();
  const [selectedYear, setSelectedYear] = useState<number>(getYear(new Date()));
  const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
  const [dateForChart, setDateForChart] = useState<Date>(new Date());
  const [taskToDownload, setTaskToDownload] = useState<TaskDefinition | null>(null);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleDayDoubleClick = (date: string) => {
    setSelectedDateForModal(date);
    setIsRecordModalOpen(true);
  };
  
  const handleDaySingleClick = (date: string) => {
    setDateForChart(parseISO(date));
  }

  const handleAddRecordClick = () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    setSelectedDateForModal(todayStr);
    setDateForChart(new Date());
    setIsRecordModalOpen(true);
  };

  const handleTaskTripleClick = useCallback((task: TaskDefinition) => {
    setTaskToDownload(task);
  }, []);

  useEffect(() => {
    if (taskToDownload && taskCardRef.current) {
      toPng(taskCardRef.current, { cacheBust: true, pixelRatio: 2 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          const monthStr = format(dateForChart, 'yyyy-MM');
          link.download = `sigil-task-${taskToDownload.name.replace(/\s+/g, '-')}-${monthStr}.png`;
          link.href = dataUrl;
          link.click();
        })
        .catch((err) => {
          console.error("Could not generate task card image", err);
          toast({
            title: "Download Failed",
            description: "Could not generate the task card image.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setTaskToDownload(null);
        });
    }
  }, [taskToDownload, dateForChart, toast]);
  
  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  const availableYears = useMemo(() => {
    const years = new Set(records.map(r => getYear(new Date(r.date))));
    years.add(getYear(new Date())); // Ensure current year is always an option
    return Array.from(years).sort((a, b) => b - a);
  }, [records]);
  
  const recordsForDownload = useMemo(() => {
    if (!taskToDownload) return [];
    const months = dashboardSettings.taskCardTimeRange || 1;
    const end = endOfMonth(dateForChart);
    const start = startOfMonth(subMonths(end, months - 1));
    return getRecordsForDateRange(start, end).filter(r => r.taskType === taskToDownload.id);
  }, [taskToDownload, dateForChart, getRecordsForDateRange, dashboardSettings.taskCardTimeRange]);


  return (
    <>
      <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
        <Header 
          onAddRecordClick={handleAddRecordClick} 
          onManageTasksClick={() => { /* Not needed on this page, but prop is required */ }}
        />
        <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
           <div className="w-full max-w-7xl mx-auto">
             <div className="p-6 md:p-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold">Contribution Calendar</h2>
                  </div>
                   <div className="flex items-center gap-2 w-full sm:w-auto">
                      <Label htmlFor="year-select" className="flex-shrink-0">Year</Label>
                      <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                        <SelectTrigger className="w-full sm:w-[120px]" id="year-select">
                          <SelectValue placeholder="Select year" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                </div>
             </div>
             <div className="p-6 md:p-0">
                <TaskFilterBar
                    taskDefinitions={taskDefinitions}
                    selectedTaskId={selectedTaskFilterId}
                    onSelectTask={setSelectedTaskFilterId}
                    onTaskTripleClick={handleTaskTripleClick}
                />
                <ContributionGraph
                    year={selectedYear}
                    onDayClick={handleDaySingleClick}
                    onDayDoubleClick={handleDayDoubleClick}
                    selectedTaskFilterId={selectedTaskFilterId}
                    displayMode="full"
                />
             </div>
           </div>

           <div className="max-w-2xl mx-auto p-6 md:p-0">
               <div className="mb-4">
                    <h2 className="text-2xl font-semibold">Time Breakdown for {format(dateForChart, 'MMMM d, yyyy')}</h2>
                    <p className="text-sm text-muted-foreground">A 24-hour visualization of your time-based tasks.</p>
                </div>
                <div className="p-4 rounded-lg bg-card/50">
                    <DailyTimeBreakdownChart date={dateForChart} hideFooter={true} />
                </div>
           </div>
          
           <div className="text-center mt-8">
              <Button asChild variant="outline">
                  <Link href="/">
                      <CornerDownLeft className="mr-2 h-4 w-4" />
                      Return to Dashboard
                  </Link>
              </Button>
          </div>
        </main>
      </div>
      <RecordModal
        isOpen={isRecordModalOpen}
        onOpenChange={setIsRecordModalOpen}
        selectedDate={selectedDateForModal}
      />
      {/* Offscreen element for image generation */}
      <div className="fixed -left-[9999px] top-0">
          <div ref={taskCardRef}>
            {taskToDownload && (
              <TaskProgressCard 
                task={taskToDownload} 
                records={recordsForDownload}
                endDate={dateForChart}
                months={dashboardSettings.taskCardTimeRange || 1}
              />
            )}
          </div>
      </div>
    </>
  );
}
