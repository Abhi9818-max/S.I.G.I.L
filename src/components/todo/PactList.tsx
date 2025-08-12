
"use client";

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { ListChecks, Trash2, CalendarDays, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, startOfDay, isToday, parseISO } from 'date-fns';
import type { TodoItem } from '@/types';
import { useTodos } from '@/components/providers/TodoProvider';

interface PactItemProps {
    item: TodoItem;
    isEditable: boolean;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleDare: (id: string, completed?: boolean) => void;
    completedPact: string | null;
}

const PactItem = React.memo(({ item, isEditable, onToggle, onDelete, onToggleDare, completedPact }: PactItemProps) => {
    const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate))) && !isToday(parseISO(item.dueDate));
    return (
        <li className="flex items-start gap-3 p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
            <Checkbox
                id={`todo-${item.id}`}
                checked={item.completed}
                onCheckedChange={() => onToggle(item.id)}
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
                        )}>
                            <CalendarDays className="h-3.5 w-3.5 mr-1" />
                            Due: {format(new Date(item.dueDate), "MMM d, yyyy")}
                            {isOverdue && <span className="ml-1 font-semibold">(Overdue)</span>}
                        </div>
                    )}
                    {item.dare && (
                        <div className="p-2 mt-2 bg-destructive/10 border border-destructive/20 rounded-md text-destructive w-full">
                           <div className="flex items-center gap-2">
                             <ShieldAlert className="h-4 w-4" />
                             <p className="text-xs font-semibold">{item.dare}</p>
                           </div>
                           <div className="mt-2 flex items-center justify-end gap-2">
                                <span className="text-xs font-medium">Completed?</span>
                                 <Button size="sm" variant={item.dareCompleted ? "default" : "outline"} onClick={() => onToggleDare(item.id, true)} className="h-7 px-2 text-xs">I did it!</Button>
                                <Button size="sm" variant={!item.dareCompleted ? "default" : "outline"} onClick={() => onToggleDare(item.id, undefined)} className="h-7 px-2 text-xs">Not yet</Button>
                           </div>
                        </div>
                    )}
                </div>
            </div>
            {isEditable && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                    onClick={() => onDelete(item.id)}
                    aria-label={`Delete task: ${item.text}`}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            )}
        </li>
    );
});
PactItem.displayName = 'PactItem';

interface PactListProps {
  items: TodoItem[];
  isEditable: boolean;
  title?: string;
}

const PactList: React.FC<PactListProps> = ({ items, isEditable, title }) => {
  const { toggleTodoItem, deleteTodoItem, toggleDareCompleted } = useTodos();
  const [completedPact, setCompletedPact] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    toggleTodoItem(id);
    setCompletedPact(id);
    setTimeout(() => setCompletedPact(null), 800); // Duration of the animation
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
      {items.map((item) => (
        <PactItem 
            key={item.id}
            item={item}
            isEditable={isEditable}
            onToggle={handleToggle}
            onDelete={deleteTodoItem}
            onToggleDare={toggleDareCompleted}
            completedPact={completedPact}
        />
      ))}
    </ul>
  );
};

export default PactList;
