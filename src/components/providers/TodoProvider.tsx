
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRecords } from './UserRecordsProvider';
import { useSettings } from './SettingsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isYesterday } from 'date-fns';
import { useAuth } from './AuthProvider';
import { v4 as uuidv4 } from 'uuid';
import { generateDare } from '@/lib/server/dare';

interface TodoContextType {
  todoItems: TodoItem[];
  addTodoItem: (text: string, dueDate?: string, penalty?: number) => void;
  toggleTodoItem: (id: string) => void;
  deleteTodoItem: (id: string) => void;
  getTodoItemById: (id: string) => TodoItem | undefined;
}

const TodoContext = createContext<TodoContextType | undefined>(undefined);

export const TodoProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { updateUserDataInDb, deductBonusPoints, userData, isUserDataLoaded } = useUserRecords();
  const { dashboardSettings } = useSettings();
  const { toast } = useToast();
  
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);

  useEffect(() => {
    if (isUserDataLoaded && userData?.todoItems) {
      setTodoItems(userData.todoItems);
    } else if (isUserDataLoaded) {
      setTodoItems([]);
    }
  }, [isUserDataLoaded, userData?.todoItems]);


  // Load initial data and handle penalties on mount
  useEffect(() => {
    if (isUserDataLoaded && userData) {
        const allStoredItems = userData.todoItems || [];
        let itemsChanged = false;
        let processedItems = [...allStoredItems];
        let totalPenalty = 0;
        
        const checkAndApplyPenalties = async () => {
            const overdueDates = new Set<string>();
            processedItems.forEach(item => {
                if (!item.completed && !item.penaltyApplied && item.dueDate && isPast(startOfDay(parseISO(item.dueDate)))) {
                    overdueDates.add(item.dueDate);
                }
            });

            for (const date of overdueDates) {
                const itemsForDate = processedItems.filter(item => item.dueDate === date && !item.completed && !item.penaltyApplied);
                if (itemsForDate.length === 0) continue;

                itemsChanged = true;
                const firstItemWithPenalty = itemsForDate.find(item => item.penalty && item.penalty > 0);
                let dare: string | undefined;

                if (firstItemWithPenalty) {
                    try {
                        dare = await generateDare(firstItemWithPenalty.text, dashboardSettings.dareCategory);
                    } catch (e) {
                        console.error("Failed to generate dare:", e);
                    }
                }
                
                let dareAssigned = false;
                processedItems = processedItems.map(item => {
                    if (item.dueDate === date && !item.completed && !item.penaltyApplied) {
                        if (item.penalty && item.penalty > 0) {
                            totalPenalty += item.penalty;
                        }
                        if (dare && !dareAssigned) {
                            dareAssigned = true;
                            return { ...item, penaltyApplied: true, dare };
                        }
                        return { ...item, penaltyApplied: true };
                    }
                    return item;
                });
            }

            if (itemsChanged) {
                if (totalPenalty > 0) {
                    deductBonusPoints(totalPenalty);
                    toast({
                        title: "Pacts Judged",
                        description: `Incomplete pacts from previous days have been penalized. Total penalty: ${totalPenalty} XP. Check for new dares.`,
                        variant: "destructive",
                        duration: 7000,
                    });
                }
                updateUserDataInDb({ todoItems: processedItems });
            }
        };

        checkAndApplyPenalties();
    }
  }, [isUserDataLoaded, dashboardSettings.dareCategory]);

  const addTodoItem = (text: string, dueDate?: string, penalty?: number) => {
    if (text.trim() === '') return;
    
    setTodoItems(prevItems => {
        const newItem: TodoItem = {
          id: uuidv4(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
          ...(dueDate && { dueDate }),
          ...(dueDate && penalty && penalty > 0 && { penalty }),
          penaltyApplied: false,
        };

        const newItems = [newItem, ...prevItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  };

  const toggleTodoItem = (id: string) => {
    setTodoItems(prevItems => {
        const newItems = prevItems.map(item => {
          if (item.id === id) {
            return { ...item, completed: !item.completed };
          }
          return item;
        });
        updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  };

  const deleteTodoItem = (id: string) => {
    setTodoItems(prevItems => {
        const newItems = prevItems.filter(i => i.id !== id);
        updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  };

  const getTodoItemById = useCallback((id: string): TodoItem | undefined => {
    return todoItems.find(item => item.id === id);
  }, [todoItems]);

  const displayedPacts = todoItems.filter(item => {
      try {
        const itemDate = new Date(item.createdAt);
        return isToday(itemDate) || isYesterday(itemDate);
      } catch (e) {
        return false;
      }
  });


  return (
    <TodoContext.Provider value={{ 
      todoItems: displayedPacts,
      addTodoItem, 
      toggleTodoItem, 
      deleteTodoItem,
      getTodoItemById 
    }}>
      {children}
    </TodoContext.Provider>
  );
};

export const useTodos = (): TodoContextType => {
  const context = useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};
