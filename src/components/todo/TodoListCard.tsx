
"use client";

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTodos } from '@/components/providers/TodoProvider';
import { ListChecks, Trash2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isPast, startOfDay, isToday, parseISO, isTomorrow, addDays, isSameDay } from 'date-fns';
import { Separator } from '../ui/separator';

const TodoListCard = () => {
  const { todoItems, toggleTodoItem, deleteTodoItem } = useTodos();

  const incompleteItems = todoItems
    .filter(item => {
        const isCreatedToday = isToday(parseISO(item.createdAt));
        const isDueToday = item.dueDate ? isToday(parseISO(item.dueDate)) : false;
        return !item.completed && (isCreatedToday || isDueToday);
    })
    .slice(0, 5);
    
  const upcomingItems = todoItems
    .filter(item => {
        if (!item.dueDate || item.completed) return false;
        const dueDate = parseISO(item.dueDate);
        const tomorrow = addDays(startOfDay(new Date()), 1);
        const dayAfterTomorrow = addDays(startOfDay(new Date()), 2);
        return isSameDay(dueDate, tomorrow) || isSameDay(dueDate, dayAfterTomorrow);
    })
    .sort((a, b) => parseISO(a.dueDate!).getTime() - parseISO(b.dueDate!).getTime())
    .slice(0, 3);
    
  const getDueDateLabel = (dueDate: string) => {
    const date = parseISO(dueDate);
    if (isTomorrow(date)) return "Due Tomorrow";
    return `Due ${format(date, "MMM d")}`;
  };

  return (
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ListChecks className="h-6 w-6 text-accent" />
          <CardTitle>Pacts</CardTitle>
        </div>
        <CardDescription>Your most important tasks for today and tomorrow.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow">
        <ScrollArea className="h-full pr-3">
            {incompleteItems.length === 0 && upcomingItems.length === 0 ? (
                 <div className="flex items-center justify-center h-full">
                    <p className="text-center text-muted-foreground py-4">No pacts for today or tomorrow! ✨</p>
                 </div>
            ) : (
                <ul className="space-y-3">
                  {incompleteItems.map((item) => {
                    const isOverdue = item.dueDate && !item.completed && isPast(startOfDay(new Date(item.dueDate)));
                    return (
                      <li
                        key={item.id}
                        className="flex items-start gap-3 p-2 border rounded-md bg-card hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`todo-card-${item.id}`}
                          checked={item.completed}
                          onCheckedChange={() => toggleTodoItem(item.id)}
                          aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                          className="mt-1"
                        />
                        <div className="flex-grow">
                          <label
                            htmlFor={`todo-card-${item.id}`}
                            className={cn(
                              "cursor-pointer text-sm font-medium",
                              item.completed && "line-through text-muted-foreground"
                            )}
                          >
                            {item.text}
                          </label>
                          {item.dueDate && (
                            <div className={cn(
                                "text-xs flex items-center mt-1",
                                isOverdue ? "text-destructive" : "text-muted-foreground"
                              )}
                            >
                              Due: {format(new Date(item.dueDate), "MMM d")}
                              {isOverdue && <span className="ml-1 font-semibold">(Overdue)</span>}
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                          onClick={() => deleteTodoItem(item.id)}
                          aria-label={`Delete task: ${item.text}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    );
                  })}

                  {upcomingItems.length > 0 && (
                      <>
                        {incompleteItems.length > 0 && <Separator className="my-4" />}
                        <h4 className="text-xs font-semibold text-muted-foreground mb-2">UPCOMING</h4>
                        {upcomingItems.map(item => (
                            <li key={item.id} className="flex items-start gap-3 p-2 border rounded-md bg-card/50 opacity-80">
                               <Checkbox
                                  id={`todo-card-${item.id}`}
                                  checked={item.completed}
                                  onCheckedChange={() => toggleTodoItem(item.id)}
                                  aria-label={item.completed ? "Mark as incomplete" : "Mark as complete"}
                                  className="mt-1"
                                />
                                <div className="flex-grow">
                                  <label
                                    htmlFor={`todo-card-${item.id}`}
                                    className="cursor-pointer text-sm font-medium"
                                  >
                                    {item.text}
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1 font-semibold">
                                      {getDueDateLabel(item.dueDate!)}
                                  </p>
                                </div>
                            </li>
                        ))}
                      </>
                  )}
                </ul>
            )}
        </ScrollArea>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href="/todo">
            Manage All Pacts
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default TodoListCard;
