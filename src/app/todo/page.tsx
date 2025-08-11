
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTodos } from '@/components/providers/TodoProvider';
import { ListChecks, CalendarIcon, PlusCircle, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isPast, startOfDay, isToday, isYesterday } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import PactList from '@/components/todo/PactList';

const AddPactForm = ({ onAddItem, newItemText, setNewItemText, newDueDate, setNewDueDate, newPenalty, setNewPenalty }: any) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (newDueDate && date && startOfDay(newDueDate).getTime() === startOfDay(date).getTime()) {
      setNewDueDate(undefined);
    } else {
      setNewDueDate(date);
    }
  };

  useEffect(() => {
    // If due date is removed, also remove the penalty
    if (!newDueDate) {
      setNewPenalty(undefined);
    }
  }, [newDueDate, setNewPenalty]);
  
  useEffect(() => {
    // If advanced options are hidden, clear the values
    if (!showAdvanced) {
      setNewDueDate(undefined);
      setNewPenalty(undefined);
    }
  }, [showAdvanced, setNewDueDate, setNewPenalty]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-grow"
          onKeyPress={(e) => e.key === 'Enter' && newItemText.trim() && onAddItem()}
        />
        <Button 
            onClick={onAddItem} 
            className="w-full sm:w-auto"
            disabled={newItemText.trim() === ''}
          >
            Add Pact
          </Button>
      </div>

      {!showAdvanced ? (
        <Button variant="outline" size="sm" onClick={() => setShowAdvanced(true)} className="w-full sm:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Details (Due Date, Penalty)
        </Button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-2 animate-fade-in-up">
          <div className="flex-grow">
            <Label htmlFor="due-date-button" className="sr-only">Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="due-date-button"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !newDueDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {newDueDate ? format(newDueDate, "PPP") : <span>Pick due date (optional)</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={newDueDate}
                  onSelect={handleDateSelect}
                  initialFocus
                  disabled={(date) => date < startOfDay(new Date())}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex-grow">
            <Label htmlFor="penalty" className="sr-only">Penalty</Label>
            <Input
              id="penalty"
              type="number"
              value={newPenalty || ''}
              onChange={(e) => setNewPenalty(e.target.value === '' ? undefined : Number(e.target.value))}
              placeholder="Penalty XP (optional)"
              disabled={!newDueDate}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function TodoPage() {
  const [newItemText, setNewItemText] = useState('');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [newPenalty, setNewPenalty] = useState<number | undefined>();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [view, setView] = useState<'today' | 'yesterday'>('today');

  const { todoItems, addTodoItem, toggleTodoItem, deleteTodoItem } = useTodos();
  const { getUserLevelInfo } = useUserRecords();

  const todaysPacts = todoItems.filter(item => {
    try {
      return isToday(new Date(item.createdAt));
    } catch (e) {
      return false;
    }
  });

  const yesterdaysPacts = todoItems.filter(item => {
    try {
      return isYesterday(new Date(item.createdAt));
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);

  const handleAddItem = () => {
    if (newItemText.trim()) {
      const dueDateString = newDueDate ? format(newDueDate, 'yyyy-MM-dd') : undefined;
      // Ensure we don't pass `undefined` if penalty is not a valid number
      const penaltyValue = (newPenalty && Number.isFinite(newPenalty)) ? newPenalty : undefined;
      addTodoItem(newItemText, dueDateString, penaltyValue);
      setNewItemText('');
      setNewDueDate(undefined);
      setNewPenalty(undefined);
    }
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  const addPactFormProps = {
    onAddItem: handleAddItem,
    newItemText,
    setNewItemText,
    newDueDate,
    setNewDueDate,
    newPenalty,
    setNewPenalty,
  };
  
  const displayedPacts = view === 'today' ? todaysPacts : yesterdaysPacts;

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
       <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-2xl mx-auto">
          <div className="p-6 md:p-0">
             <div className="flex justify-between items-center gap-2">
                <div className="flex items-center gap-2">
                    <ListChecks className="h-6 w-6 text-primary" />
                    <h1 className="text-lg sm:text-2xl font-semibold leading-none tracking-tight">{view === 'today' ? "Today's Pacts" : "Yesterday's Pacts"}</h1>
                </div>
                 <Button variant="outline" size="sm" onClick={() => setView(v => v === 'today' ? 'yesterday' : 'today')} className="sm:w-auto w-10 p-0 sm:px-3 sm:py-2">
                    <RotateCcw className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">View {view === 'today' ? 'Yesterday' : 'Today'}</span>
                </Button>
            </div>
             <p className="text-sm text-muted-foreground mt-2">
              {view === 'today' ? "What promises will you keep today?" : "Review and finalize yesterday's tasks."}
            </p>
          </div>
          <div className="p-6 md:p-0 pt-6">
            {displayedPacts.length === 0 && view !== 'today' ? (
              <p className="text-center text-muted-foreground py-4">No pacts were created yesterday.</p>
            ) : (
                <div className="space-y-6">
                    {view === 'today' && displayedPacts.length === 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-4">Add a New Pact</h4>
                        <AddPactForm {...addPactFormProps} />
                        <Separator className="mt-6" />
                      </div>
                    )}
                    <ScrollArea className="h-[400px] pr-3">
                        <PactList 
                          items={displayedPacts}
                          toggleTodoItem={toggleTodoItem}
                          deleteTodoItem={deleteTodoItem}
                          isEditable={view === 'today'}
                        />
                         {displayedPacts.length === 0 && view === 'today' && (
                            <p className="text-center text-muted-foreground py-4">No pacts for today yet.</p>
                        )}
                    </ScrollArea>
                    {view === 'today' && displayedPacts.length > 0 && (
                      <>
                        <Separator />
                        <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-4">Add a New Pact</h4>
                        <AddPactForm {...addPactFormProps} />
                        </div>
                      </>
                    )}
                </div>
            )}
          </div>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Pacts &copy; {currentYear}
      </footer>
    </div>
  );
}
