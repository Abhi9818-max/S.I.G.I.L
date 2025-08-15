
"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ListChecks, ShieldAlert, Check, Dumbbell, BookOpen, Droplets, Utensils, X, Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TodoItem } from '@/types';

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

interface PactItemProps {
    item: TodoItem;
    isEditable: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleDare: (id: string, completed?: boolean) => void;
    completedPact: string | null;
}

const PactItem = React.memo(({ item, isEditable, onToggle, onDelete, onToggleDare }: PactItemProps) => {
    const Icon = getIconForPact(item.text);
    const [showDelete, setShowDelete] = useState(false);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const handleInteractionStart = () => {
        if (!isEditable) return;
        longPressTimer.current = setTimeout(() => {
            setShowDelete(true);
        }, 800); // 800ms for long press
    };

    const handleInteractionEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };
    
    const handleDoubleClick = () => {
        if (!isEditable) return;
        setShowDelete(true);
    };

    return (
        <div className="flex flex-col gap-2">
             <button 
                onClick={() => onToggle(item.id)} 
                onDoubleClick={handleDoubleClick}
                onTouchStart={handleInteractionStart}
                onTouchEnd={handleInteractionEnd}
                onMouseDown={handleInteractionStart}
                onMouseUp={handleInteractionEnd}
                onMouseLeave={handleInteractionEnd} // Cancel timer if mouse leaves
                disabled={!isEditable}
                className={cn(
                    "flex items-center w-full p-3 rounded-xl transition-all duration-300 ease-in-out",
                    item.completed ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'
                )}
            >
                <div className="w-8 h-8 rounded-full bg-black/80 flex items-center justify-center mr-3 flex-shrink-0">
                    <Icon className="h-5 w-5" />
                </div>
                <span className="flex-grow text-left text-sm font-medium">{item.text}</span>
                <div className="w-6 h-6 rounded-full border-2 border-current/30 flex items-center justify-center ml-3 flex-shrink-0">
                    {item.completed && <Check className="h-4 w-4" />}
                </div>
            </button>
            
            {showDelete && isEditable && (
                <div className="flex justify-end gap-2 animate-fade-in-up">
                    <Button variant="secondary" size="sm" onClick={() => setShowDelete(false)}>Cancel</Button>
                    <Button variant="destructive" size="sm" onClick={() => onDelete(item.id)}>Delete</Button>
                </div>
            )}

            {item.dare && (
                <div className="p-2 mt-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive w-full animate-fade-in-up">
                    <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4" />
                        <p className="text-xs font-semibold">{item.dare}</p>
                    </div>
                    <div className="mt-2 flex items-center justify-end gap-2">
                        <span className="text-xs font-medium">Completed?</span>
                        <Button size="sm" variant={item.dareCompleted === true ? "secondary" : "outline"} onClick={() => onToggleDare(item.id, true)} className="h-7 px-2 text-xs">I did it!</Button>
                        <Button size="sm" variant={item.dareCompleted === false ? "secondary" : "outline"} onClick={() => onToggleDare(item.id, false)} className="h-7 px-2 text-xs">Not yet</Button>
                    </div>
                </div>
            )}
        </div>
    );
});
PactItem.displayName = 'PactItem';

interface PactListProps {
  items: TodoItem[];
  isEditable: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleDare: (id: string, completed?: boolean) => void;
  title?: string;
}

const PactList: React.FC<PactListProps> = ({ items, isEditable, title, onToggle, onDelete, onToggleDare }) => {
  const [completedPact, setCompletedPact] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    onToggle(id);
    setCompletedPact(id);
    setTimeout(() => setCompletedPact(null), 800); // Duration of the animation
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10">
        <p>No pacts for today.</p>
        <p className="text-xs">Add one below to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 my-4">
      {items.map((item) => (
        <PactItem 
            key={item.id}
            item={item}
            isEditable={isEditable}
            onToggle={handleToggle}
            onDelete={onDelete}
            onToggleDare={onToggleDare}
            completedPact={completedPact}
        />
      ))}
    </div>
  );
};

export default PactList;
