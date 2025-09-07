
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTodos } from '@/components/providers/TodoProvider';
import { ListChecks, PlusCircle, RotateCcw, CalendarIcon, Pencil, Download } from 'lucide-react';
import Header from '@/components/layout/Header';
import { cn } from '@/lib/utils';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { format, isToday, isSameDay, parseISO, addDays, subDays } from 'date-fns';
import PactList from '@/components/todo/PactList';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { toPng } from 'html-to-image';
import PactCard from '@/components/todo/PactCard';
import { useToast } from '@/hooks/use-toast';

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
        placeholder="Add a new pact for the selected date..."
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
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const pactCardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadClickCount, setDownloadClickCount] = useState(0);
  const { toast } = useToast();

  const { todoItems, addTodoItem, checkMissedDares, toggleTodoItem, deleteTodoItem, toggleDareCompleted } = useTodos();
  const { getUserLevelInfo } = useUserRecords();
  
  useEffect(() => {
    checkMissedDares();
  }, [checkMissedDares]);

  const displayedPacts = todoItems.filter(item => {
    try {
      const createdAtDate = parseISO(item.createdAt);
      return isSameDay(createdAtDate, selectedDate);
    } catch (e) => {
      return false;
    }
  });


  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  useEffect(() => {
    if (isDownloading && pactCardRef.current) {
        toPng(pactCardRef.current, { cacheBust: true, pixelRatio: 2 })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `sigil-pacts-${format(selectedDate, 'yyyy-MM-dd')}.png`;
                link.href = dataUrl;
                link.click();
            })
            .catch((err) => {
                console.error("Could not generate pacts card image", err);
                toast({
                    title: "Download Failed",
                    description: "Could not generate the pacts card image.",
                    variant: "destructive",
                });
            })
            .finally(() => {
                setIsDownloading(false);
            });
    }
  }, [isDownloading, selectedDate, toast]);


  const handleAddItem = () => {
    if (newItemText.trim()) {
      addTodoItem(newItemText, format(selectedDate, 'yyyy-MM-dd'));
      setNewItemText('');
      setShowAddForm(false);
    }
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  const addPactFormProps = {
    onAddItem: handleAddItem,
    newItemText,
    setNewItemText,
  };
  
  const completedCount = displayedPacts.filter(p => p.completed).length;
  const totalCount = displayedPacts.length;

  const handleDownloadClick = () => {
    const newCount = downloadClickCount + 1;
    setDownloadClickCount(newCount);

    if (newCount === 3) {
      toast({
        title: "Generating Image...",
        description: "Your pacts card is being prepared for download.",
      });
      setIsDownloading(true);
      setDownloadClickCount(0);
    }
  };

  return (
    <>
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
       <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-lg mx-auto">
          
          <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-2xl font-bold text-white">Pacts</h1>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => setShowAddForm(!showAddForm)}>
                    <Pencil className="h-5 w-5" />
                 </Button>
                 <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                          <CalendarIcon className="h-4 w-4 sm:mr-2" />
                          <span className="hidden sm:inline">{format(selectedDate, "MMM d, yyyy")}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                <div 
                  className="flex items-center justify-center w-12 h-12 rounded-full border-2 border-white/20 bg-black/30 cursor-pointer"
                  onClick={handleDownloadClick}
                  title="Click 3 times to download"
                >
                  <span className="text-sm font-semibold text-white">{completedCount}/{totalCount}</span>
                </div>
              </div>
          </div>

          <PactList 
            items={displayedPacts}
            isEditable={true}
            onToggle={toggleTodoItem}
            onDelete={deleteTodoItem}
            onToggleDare={toggleDareCompleted}
          />
          
          {showAddForm && <AddPactForm {...addPactFormProps} />}
          
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Pacts &copy; {currentYear}
      </footer>
    </div>
    {/* Offscreen card for image generation */}
    <div className="fixed -left-[9999px] top-0">
        <div ref={pactCardRef}>
            {isDownloading && <PactCard pacts={displayedPacts} date={selectedDate} />}
        </div>
    </div>
    </>
  );
}
