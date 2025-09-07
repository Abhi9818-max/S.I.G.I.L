

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Header from '@/components/layout/Header';
import QuoteCard from '@/components/layout/QuoteCard';
import ContributionGraph from '@/components/records/ContributionGraph';
import RecordModal from '@/components/records/RecordModal';
import StatsPanel from '@/components/records/StatsPanel';
import ManageTasksModal from '@/components/manage-tasks/ManageTasksModal';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { UserLevelInfo, Quote, TaskDefinition } from '@/types';
import { TIER_INFO } from '@/lib/config';
import { QUOTES } from '@/lib/quotes';
import TodoListCard from '@/components/todo/TodoListCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar, Download } from 'lucide-react';
import ProgressOverTimeChart from '@/components/progress/ProgressOverTimeChart';
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import { useAuth } from '@/components/providers/AuthProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { useTodos } from '@/components/providers/TodoProvider';
import InteractiveTour from '@/components/layout/InteractiveTour';
import { useSearchParams } from 'next/navigation';
import { toPng } from 'html-to-image';
import QuoteDisplayCard from '@/components/layout/QuoteDisplayCard';
import TaskProgressCard from '@/components/records/TaskProgressCard';

const LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS = 'shownTierWelcomeToasts';
const LOCAL_STORAGE_QUOTE_KEY = 'dailyQuote';
const LOCAL_STORAGE_KEY_TOUR_SEEN = 'sigil-tour-seen-interactive';

export default function HomePage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [isManageTasksModalOpen, setIsManageTasksModalOpen] = useState(false);
  const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [taskToDownload, setTaskToDownload] = useState<TaskDefinition | null>(null);
  const [isDownloadingBreakdown, setIsDownloadingBreakdown] = useState(false);
  
  const { isUserDataLoaded } = useAuth();
  const { 
    taskDefinitions, 
    getUserLevelInfo, 
    awardTierEntryBonus,
    getRecordsForDateRange,
  } = useUserRecords();
  const { dashboardSettings } = useSettings();
  const { toast } = useToast();
  const { checkMissedDares } = useTodos();
  const searchParams = useSearchParams();
  const quoteCardRef = useRef<HTMLDivElement>(null);
  const taskCardRef = useRef<HTMLDivElement>(null);
  const breakdownCardRef = useRef<HTMLDivElement>(null);

  // Tour State
  const [isTourActive, setIsTourActive] = useState(false);
  const tourRefs = {
    stats: useRef<HTMLDivElement>(null),
    calendar: useRef<HTMLDivElement>(null),
    pacts: useRef<HTMLDivElement>(null),
    charts: useRef<HTMLDivElement>(null),
    header: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    const tourStatus = localStorage.getItem(LOCAL_STORAGE_KEY_TOUR_SEEN);
    if (tourStatus === 'pending') {
      setIsTourActive(true);
    }
    
    if (searchParams.get('tour') === 'true') {
      setIsTourActive(true);
    }
  }, [searchParams]);

  const handleTourComplete = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TOUR_SEEN, 'true');
    setIsTourActive(false);
  };

  const currentLevelInfo = getUserLevelInfo();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  useEffect(() => {
    checkMissedDares();
  }, [checkMissedDares]);

  useEffect(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    let storedQuoteData;
    try {
      const item = localStorage.getItem(LOCAL_STORAGE_QUOTE_KEY);
      storedQuoteData = item ? JSON.parse(item) : null;
    } catch (e) {
      storedQuoteData = null;
    }

    if (storedQuoteData && storedQuoteData.date === todayStr) {
      setQuote(storedQuoteData.quote);
    } else {
      const newQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      setQuote(newQuote);
      try {
        localStorage.setItem(LOCAL_STORAGE_QUOTE_KEY, JSON.stringify({ date: todayStr, quote: newQuote }));
      } catch (error) {
        console.error("Failed to save daily quote to localStorage:", error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentLevelInfo) {
      const newTierSlug = currentLevelInfo.tierSlug;
      let shownTierToasts: string[] = [];
      try {
        const storedShownToasts = localStorage.getItem(LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS);
        if (storedShownToasts) {
          shownTierToasts = JSON.parse(storedShownToasts);
        }
      } catch (error) {
        console.error("Failed to load shown tier toasts from localStorage:", error);
        shownTierToasts = [];
      }

      if (!shownTierToasts.includes(newTierSlug)) {
        const newTierData = TIER_INFO.find(tier => tier.slug === newTierSlug);
        if (newTierData) {
          let toastDescription = newTierData.welcomeMessage;

          if (newTierData.tierEntryBonus && newTierData.tierEntryBonus > 0 && newTierData.minLevel > TIER_INFO[0].minLevel) {
            awardTierEntryBonus(newTierData.tierEntryBonus);
            toastDescription += ` You earned ${newTierData.tierEntryBonus} bonus XP!`;
          }

          toast({
            title: `✨ You've reached: ${newTierData.name}! ✨`,
            description: toastDescription,
            duration: 10000,
          });

          shownTierToasts.push(newTierSlug);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS, JSON.stringify(shownTierToasts));
          } catch (error) {
            console.error("Failed to save shown tier toasts to localStorage:", error);
          }
        }
      }
    }
  }, [currentLevelInfo, toast, awardTierEntryBonus]);

  const handleDownloadQuote = useCallback(() => {
    if (quoteCardRef.current === null) {
      return;
    }

    toPng(quoteCardRef.current, { cacheBust: true, pixelRatio: 2 })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `sigil-quote-${quote?.author.replace(/\s/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('Failed to create quote card image', err);
        toast({
          title: "Download Failed",
          description: "Could not generate quote card.",
          variant: "destructive"
        });
      });
  }, [quoteCardRef, toast, quote]);

  const handleTaskTripleClick = useCallback((task: TaskDefinition) => {
    setTaskToDownload(task);
  }, []);

  useEffect(() => {
    if (taskToDownload && taskCardRef.current) {
      toPng(taskCardRef.current, { cacheBust: true, pixelRatio: 2 })
        .then((dataUrl) => {
          const link = document.createElement('a');
          const monthStr = format(new Date(), 'yyyy-MM');
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
  }, [taskToDownload, toast]);
  
  const handleBreakdownCardDownload = () => {
    toast({
      title: "Generating Card...",
      description: "Your daily breakdown card is being prepared.",
    });
    setIsDownloadingBreakdown(true);
  };

  useEffect(() => {
    if (isDownloadingBreakdown && breakdownCardRef.current) {
        toPng(breakdownCardRef.current, { cacheBust: true, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `sigil-breakdown-${format(new Date(), 'yyyy-MM-dd')}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error("Could not generate breakdown card image", err);
                toast({
                    title: "Download Failed",
                    description: "Could not generate the breakdown card.",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setIsDownloadingBreakdown(false);
            });
    }
  }, [isDownloadingBreakdown, toast]);

  const handleDayClick = (date: string) => {
    setSelectedDateForModal(date);
    setIsRecordModalOpen(true);
  };

  const handleAddRecordClick = () => {
    setSelectedDateForModal(format(new Date(), 'yyyy-MM-dd'));
    setIsRecordModalOpen(true);
  };

  const handleManageTasksClick = () => {
    setIsManageTasksModalOpen(true);
  };

  if (!isUserDataLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-black">
          <div className="flex items-center justify-center min-h-screen">
              <Image src="/loading.gif" alt="Loading..." width={242} height={242} unoptimized priority />
          </div>
      </div>
    );
  }
  
  const showStatsPanel = dashboardSettings.showTotalLast30Days || dashboardSettings.showCurrentStreak || dashboardSettings.showDailyConsistency || dashboardSettings.showHighGoalStat;

  const recordsForDownload = getRecordsForDateRange(
    startOfMonth(subMonths(new Date(), (dashboardSettings.taskCardTimeRange || 1) - 1)),
    endOfMonth(new Date())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div ref={tourRefs.header}>
        <Header
          onAddRecordClick={handleAddRecordClick}
          onManageTasksClick={handleManageTasksClick}
        />
      </div>
      <InteractiveTour
        isActive={isTourActive}
        onComplete={handleTourComplete}
        refs={tourRefs}
      />
      <QuoteCard quote={quote} onDownload={handleDownloadQuote} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">
        {showStatsPanel && <div ref={tourRefs.stats}><StatsPanel selectedTaskFilterId={selectedTaskFilterId} /></div>}

        {dashboardSettings.showTaskFilterBar && (
          <TaskFilterBar
            taskDefinitions={taskDefinitions}
            selectedTaskId={selectedTaskFilterId}
            onSelectTask={(taskId) => setSelectedTaskFilterId(taskId)}
            onTaskTripleClick={handleTaskTripleClick}
          />
        )}
        
        {dashboardSettings.showContributionGraph && (
            <div ref={tourRefs.calendar}>
                <ContributionGraph
                    onDayClick={handleDayClick}
                    onDayDoubleClick={handleDayClick}
                    selectedTaskFilterId={selectedTaskFilterId}
                    displayMode="full"
                />
                <div className="text-center mt-4">
                    <Button asChild variant="outline" size="sm">
                    <Link href="/calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Full Calendar
                    </Link>
                    </Button>
                </div>
            </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {dashboardSettings.showTodoList && (
                <div ref={tourRefs.pacts} className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <TodoListCard />
                </div>
            )}
            <div ref={tourRefs.charts} className={cn("space-y-6 animate-fade-in-up", dashboardSettings.showTodoList ? "lg:col-span-2" : "lg:col-span-3")} style={{ animationDelay: '200ms' }}>
                {dashboardSettings.showProgressChart && (
                  <ProgressOverTimeChart selectedTaskFilterId={selectedTaskFilterId} />
                )}

                <div className="grid grid-cols-1 gap-6">
                  {dashboardSettings.showTimeBreakdownChart && (
                      <div className="animate-fade-in-up mt-8" style={{ animationDelay: '500ms' }}>
                          <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-semibold">Shit Done Today</h2>
                                <p className="text-sm text-muted-foreground">A 24-hour visualization of your time-based tasks.</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleBreakdownCardDownload} aria-label="Download breakdown card">
                                <Download className="h-5 w-5" />
                            </Button>
                          </div>
                          <DailyTimeBreakdownChart />
                      </div>
                  )}
                </div>
            </div>
        </div>

      </main>
      <RecordModal
        isOpen={isRecordModalOpen}
        onOpenChange={setIsRecordModalOpen}
        selectedDate={selectedDateForModal}
        defaultTaskTypeId={selectedTaskFilterId}
      />
      <ManageTasksModal
        isOpen={isManageTasksModalOpen}
        onOpenChange={setIsManageTasksModalOpen}
      />
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. &copy; {currentYear}
      </footer>
      
      {/* Offscreen elements for image generation */}
      <div className="fixed -left-[9999px] top-0">
          <div ref={quoteCardRef}>
              <QuoteDisplayCard quote={quote} />
          </div>
          <div ref={taskCardRef}>
            {taskToDownload && (
              <TaskProgressCard 
                task={taskToDownload} 
                records={recordsForDownload.filter(r => r.taskType === taskToDownload.id)}
                endDate={new Date()}
                months={dashboardSettings.taskCardTimeRange || 1}
              />
            )}
          </div>
          <div ref={breakdownCardRef}>
            {isDownloadingBreakdown && (
                <div className="w-[450px] p-6 bg-background border border-border rounded-lg">
                    <div className="mb-4">
                        <h2 className="text-2xl font-semibold text-foreground">Daily Time Breakdown</h2>
                        <p className="text-sm text-muted-foreground">{format(new Date(), 'MMMM d, yyyy')}</p>
                    </div>
                    <DailyTimeBreakdownChart hideFooter={true} />
                     <div className="text-center pt-4 mt-4 border-t border-border">
                        <p className="font-bold text-lg text-foreground/90">S.I.G.I.L.</p>
                    </div>
                </div>
            )}
          </div>
      </div>
    </div>
  );
}

