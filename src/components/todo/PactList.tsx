
"use client";

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ListChecks, Trash2, CalendarDays, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, startOfDay } from 'date-fns';
import type { TodoItem } from '@/types';

interface PactListProps {
  items: TodoItem[];
  toggleTodoItem?: (id: string) => void;
  deleteTodoItem?: (id: string) => void;
  isEditable: boolean;
  title?: string;
}

const PactList: React.FC<PactListProps> = ({ items, toggleTodoItem, deleteTodoItem, isEditable, title }) => {
  const [completedPact, setCompletedPact] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    if (toggleTodoItem) {
        toggleTodoItem(id);
        setCompletedPact(id);
        setTimeout(() => setCompletedPact(null), 800); // Duration of the animation
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        No pacts to display.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {title && <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>}
      {items.map((item) => {
        const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
        return (
          <li
            key={item.id}
            className="flex items-start gap-3 p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors"
          >
            <Checkbox
              id={`todo-${item.id}`}
              checked={item.completed}
              onCheckedChange={() => isEditable && handleToggle(item.id)}
              aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
              className="mt-1"
              disabled={!isEditable}
            />
            <div className="flex-grow">
              <label
                htmlFor={`todo-${item.id}`}
                className={cn(
                  "cursor-pointer text-sm font-medium transition-all",
                  item.completed && "line-through text-muted-foreground",
                  completedPact === item.id && 'text-pulse-and-fade'
                )}
              >
                {item.text}
              </label>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                {item.dueDate && (
                  <div className={cn(
                    "text-xs flex items-center",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                  >
                    <CalendarDays className="h-3.5 w-3.5 mr-1" />
                    Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                    {isOverdue && <span className="ml-1 font-semibold">(Overdue)</span>}
                  </div>
                )}
                {item.penalty && item.penalty > 0 && (
                  <div className={cn(
                    "text-xs flex items-center",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                  >
                    <ShieldAlert className="h-3.5 w-3.5 mr-1" />
                    Pact Penalty: {item.penalty} XP
                  </div>
                )}
              </div>
            </div>
            {isEditable && deleteTodoItem && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                onClick={() => deleteTodoItem(item.id)}
                aria-label={`Delete task: ${item.text}`}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default PactList;
