
"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTodos } from '@/components/providers/TodoProvider';
import { ListChecks, PlusCircle, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { format, isToday, isYesterday } from 'date-fns';
import PactList from '@/components/todo/PactList';

const AddPactForm = ({ onAddItem, newItemText, setNewItemText }: any) => {
  const handleAddItemKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItemText.trim()) {
      e.preventDefault();
      onAddItem();
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2 mt-4">
      <Input
        type="text"
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
        placeholder="Add a new pact..."
        className="flex-grow bg-white/10 placeholder:text-gray-400 border-gray-500/50"
        onKeyPress={handleAddItemKeyPress}
      />
      <Button 
          onClick={onAddItem} 
          className="w-full sm:w-auto"
          disabled={newItemText.trim() === ''}
          variant="secondary"
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Add
        </Button>
    </div>
  );
};

export default function TodoPage() {
  const [newItemText, setNewItemText] = useState('');
  const [newDueDate, setNewDueDate] = useState<Date | undefined>();
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [view, setView] = useState<'today' | 'yesterday'>('today');

  const { todoItems, addTodoItem, checkMissedDares, toggleTodoItem, deleteTodoItem, toggleDareCompleted } = useTodos();
  const { getUserLevelInfo } = useUserRecords();
  
  useEffect(() => {
    checkMissedDares();
  }, [checkMissedDares]);

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
      addTodoItem(newItemText, dueDateString);
      setNewItemText('');
      setNewDueDate(undefined);
    }
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  const addPactFormProps = {
    onAddItem: handleAddItem,
    newItemText,
    setNewItemText,
  };
  
  const displayedPacts = view === 'today' ? todaysPacts : yesterdaysPacts;
  const completedCount = displayedPacts.filter(p => p.completed).length;
  const totalCount = displayedPacts.length;

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
       <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up flex items-center justify-center">
        <div className="w-full max-w-lg mx-auto">
          
          <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Tasks</h1>
                <p className="text-sm text-gray-400">Great start to the day</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/20 bg-black/30">
                <span className="text-sm font-semibold text-white">{completedCount}/{totalCount}</span>
              </div>
          </div>

          <PactList 
            items={displayedPacts}
            isEditable={view === 'today'}
            onToggle={toggleTodoItem}
            onDelete={deleteTodoItem}
            onToggleDare={toggleDareCompleted}
          />

          {view === 'today' && <AddPactForm {...addPactFormProps} />}

          <div className="text-center mt-6">
            <Button variant="outline" size="sm" onClick={() => setView(v => v === 'today' ? 'yesterday' : 'today')}>
                <RotateCcw className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">View {view === 'today' ? 'Yesterday' : 'Today'}</span>
            </Button>
          </div>
          
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Pacts &copy; {currentYear}
      </footer>
    </div>
  );
}
