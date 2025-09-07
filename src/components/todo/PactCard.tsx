
"use client";

import React from 'react';
import type { TodoItem } from '@/types';
import { format } from 'date-fns';
import { Check, Dumbbell, BookOpen, Droplets, Utensils, Sun, Moon, ListChecks, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const getIconForPact = (text: string) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('workout') || lowerText.includes('gym') || lowerText.includes('exercise')) return Dumbbell;
    if (lowerText.includes('read')) return BookOpen;
    if (lowerText.includes('water')) return Droplets;
    if (lowerText.includes('eat') || lowerText.includes('diet') || lowerText.includes('food')) return Utensils;
    if (lowerText.includes('morning') || lowerText.includes('am')) return Sun;
    if (lowerText.includes('night') || lowerText.includes('pm')) return Moon;
    return ListChecks;
}

interface PactCardProps {
  pacts: TodoItem[];
  date: Date;
}

const PactCard: React.FC<PactCardProps> = ({ pacts, date }) => {
    const completedCount = pacts.filter(p => p.completed).length;

  return (
    <div className="w-[400px] h-auto bg-background rounded-2xl shadow-2xl p-6 flex flex-col font-sans border border-white/10">
      <header className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-white">Daily Pacts</h2>
          <p className="text-sm text-white/70">{format(date, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-primary">{completedCount}/{pacts.length}</span>
            <span className="text-xs text-muted-foreground">Completed</span>
        </div>
      </header>

      <main className="space-y-3">
        {pacts.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">No pacts for this day.</div>
        ) : (
            pacts.map(item => {
                const Icon = getIconForPact(item.text);
                return (
                     <div 
                        key={item.id}
                        className={cn(
                            "flex items-center w-full p-3 rounded-xl transition-all duration-300 ease-in-out",
                            item.completed ? 'bg-white/90 text-black shadow-lg' : 'bg-white/10 text-white'
                        )}
                    >
                        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center mr-3 flex-shrink-0", item.completed ? 'bg-black/80 text-white' : 'bg-white/20')}>
                            <Icon className="h-5 w-5" />
                        </div>
                        <span className="flex-grow text-left text-sm font-medium">{item.text}</span>
                        <div className="w-6 h-6 rounded-full border-2 border-current/30 flex items-center justify-center ml-3 flex-shrink-0">
                            {item.completed && <Check className="h-4 w-4" />}
                        </div>
                    </div>
                )
            })
        )}
      </main>

      <footer className="text-center pt-4 mt-auto border-t border-white/10">
        <p className="font-bold text-lg text-white/90">S.I.G.I.L.</p>
      </footer>
    </div>
  );
};

export default PactCard;
