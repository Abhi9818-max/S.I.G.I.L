

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import QuoteCard from '@/components/layout/QuoteCard';
import ContributionGraph from '@/components/records/ContributionGraph';
import RecordModal from '@/components/records/RecordModal';
import StatsPanel from '@/components/records/StatsPanel';
import ManageTasksModal from '@/components/manage-tasks/ManageTasksModal';
import TaskFilterBar from '@/components/records/TaskFilterBar';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { format } from 'date-fns';
import { useToast } from "@/hooks/use-toast";
import { cn } from '@/lib/utils';
import type { UserLevelInfo } from '@/types';
import { TIER_INFO } from '@/lib/config';
import type { Quote } from '@/lib/quotes';
import { QUOTES } from '@/lib/quotes';
import TodoListCard from '@/components/todo/TodoListCard';
import AISuggestionsCard from '@/components/records/AISuggestionsCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Calendar } from 'lucide-react';
import ProgressOverTimeChart from '@/components/progress/ProgressOverTimeChart';
import DailyTimeBreakdownChart from '@/components/dashboard/DailyTimeBreakdownChart';
import { useAuth } from '@/components/providers/AuthProvider';

const LOCAL_STORAGE_KEY_SHOWN_TIER_TOASTS = 'shownTierWelcomeToasts';

export default function HomePage() {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] = useState<string | null>(null);
  const [isManageTasksModalOpen, setIsManageTasksModalOpen] = useState(false);
  const [selectedTaskFilterId, setSelectedTaskFilterId] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  
  const { isUserDataLoaded } = useAuth();
  const userRecords = useUserRecords();
  const { dashboardSettings } = useSettings();
  const { toast } = useToast();

  const currentLevelInfo = userRecords.getUserLevelInfo();

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  useEffect(() => {
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);
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
            userRecords.awardTierEntryBonus(newTierData.tierEntryBonus);
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
  }, [currentLevelInfo, toast, userRecords.awardTierEntryBonus]);

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

  if (!isUserDataLoaded || !currentLevelInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-primary">Loading your S.I.G.I.L...</div>
      </div>
    );
  }
  
  const pageTierClass = currentLevelInfo ? `page-tier-group-${currentLevelInfo.tierGroup}` : 'page-tier-group-1';
  
  const showStatsPanel = dashboardSettings.showTotalLast30Days || dashboardSettings.showCurrentStreak || dashboardSettings.showDailyConsistency || dashboardSettings.showHighGoalStat;


  return (
    <div className={cn("min-h-screen flex flex-col transition-colors duration-700 ease-in-out", pageTierClass)}>
      <Header
        onAddRecordClick={handleAddRecordClick}
        onManageTasksClick={handleManageTasksClick}
      />
      <QuoteCard quote={quote} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8 animate-fade-in-up">
        {showStatsPanel && <StatsPanel selectedTaskFilterId={selectedTaskFilterId} />}

        {dashboardSettings.showTaskFilterBar && (
          <TaskFilterBar
            taskDefinitions={userRecords.taskDefinitions}
            selectedTaskId={selectedTaskFilterId}
            onSelectTask={(taskId) => setSelectedTaskFilterId(taskId)}
          />
        )}
        
        {dashboardSettings.showContributionGraph && (
            <>
                <ContributionGraph
                    onDayClick={handleDayClick}
                    selectedTaskFilterId={selectedTaskFilterId}
                    displayMode="full"
                />
                <div className="text-center -mt-4">
                    <Button asChild variant="outline" size="sm">
                    <Link href="/calendar">
                        <Calendar className="mr-2 h-4 w-4" />
                        View Full Calendar
                    </Link>
                    </Button>
                </div>
            </>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {dashboardSettings.showTodoList && (
                <div className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <TodoListCard />
                </div>
            )}
            <div className={cn("p-4 border rounded-lg bg-muted/20 space-y-6 animate-fade-in-up", dashboardSettings.showTodoList ? "lg:col-span-2" : "lg:col-span-3")} style={{ animationDelay: '200ms' }}>
                {dashboardSettings.showProgressChart && (
                  <ProgressOverTimeChart selectedTaskFilterId={selectedTaskFilterId} />
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                   {dashboardSettings.showAISuggestions && (
                      <div className="animate-fade-in-up" style={{ animationDelay: '400ms' }}>
                          <AISuggestionsCard />
                      </div>
                  )}
                  {dashboardSettings.showTimeBreakdownChart && (
                      <div className="animate-fade-in-up" style={{ animationDelay: '500ms' }}>
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
    </div>
  );
}
