
"use client";

import type { TodoItem } from '@/types';
import React, from 'react';
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

const TodoContext = React.createContext<TodoContextType | undefined>(undefined);

const LOCAL_STORAGE_SHOWN_NOTIFICATIONS_KEY = 'sigil-shown-pact-notifications';

export const TodoProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { updateUserDataInDb, deductBonusPoints, userData, isUserDataLoaded } = useUserRecords();
  const { dashboardSettings } = useSettings();
  const { toast } = useToast();
  
  const todoItems = React.useMemo(() => {
    if (!isUserDataLoaded || !userData?.todoItems) return [];
    
    // Filter to only show pacts from today or yesterday
    const now = new Date();
    const today = startOfDay(now);
    const yesterday = startOfDay(new Date(now.setDate(now.getDate() - 1)));

    return userData.todoItems.filter(item => {
        try {
            const itemDate = startOfDay(new Date(item.createdAt));
            return isSameDay(itemDate, today) || isSameDay(itemDate, yesterday);
        } catch (e) {
            return false;
        }
    });
  }, [isUserDataLoaded, userData?.todoItems]);


  // Effect for handling pact penalties
  React.useEffect(() => {
    if (isUserDataLoaded && userData?.todoItems) {
        const allStoredItems = userData.todoItems;
        let itemsChanged = false;
        let processedItems = [...allStoredItems];
        let totalPenalty = 0;
        
        const checkAndApplyPenalties = async () => {
            const overdueDates = new Set<string>();
            processedItems.forEach(item => {
                if (!item.completed && !item.penaltyApplied && item.dueDate && isPast(startOfDay(parseISO(item.dueDate))) && !isToday(parseISO(item.dueDate))) {
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
                }
                toast({
                    title: "Pacts Judged",
                    description: `Incomplete pacts from previous days have been penalized. Total penalty: ${totalPenalty} XP. Check for new dares.`,
                    variant: "destructive",
                    duration: 7000,
                });
                updateUserDataInDb({ todoItems: processedItems });
            }
        };

        checkAndApplyPenalties();
    }
  }, [isUserDataLoaded, dashboardSettings.dareCategory]);

  // Effect for handling notifications
  React.useEffect(() => {
    if (!isUserDataLoaded || !userData?.todoItems || typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }
    
    const checkAndShowNotifications = () => {
      if (Notification.permission !== 'granted') {
        return;
      }
      
      const shownNotifications: string[] = JSON.parse(localStorage.getItem(LOCAL_STORAGE_SHOWN_NOTIFICATIONS_KEY) || '[]');
      
      const todayPactsWithDueDate = userData.todoItems.filter(item => 
        !item.completed && item.dueDate && isToday(parseISO(item.dueDate)) && !shownNotifications.includes(item.id)
      );

      if (todayPactsWithDueDate.length > 0) {
        const firstPact = todayPactsWithDueDate[0];
        const title = `Pact Due Today: ${firstPact.text}`;
        const body = todayPactsWithDueDate.length > 1 
          ? `You have ${todayPactsWithDueDate.length} pacts due today. Don't forget!`
          : `Your pact "${firstPact.text}" is due today.`;
        
        new Notification(title, { body });

        const newShownNotifications = [...shownNotifications, ...todayPactsWithDueDate.map(p => p.id)];
        localStorage.setItem(LOCAL_STORAGE_SHOWN_NOTIFICATIONS_KEY, JSON.stringify(newShownNotifications));
      }
    };
    
    checkAndShowNotifications();

  }, [isUserDataLoaded, userData?.todoItems]);


  const addTodoItem = async (text: string, dueDate?: string, penalty?: number) => {
    if (text.trim() === '') return;
    
    if (dueDate && typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    }
    
    const allItems = userData?.todoItems || [];
    const newItem: TodoItem = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      ...(dueDate && { dueDate }),
      ...(dueDate && penalty && penalty > 0 && { penalty }),
      penaltyApplied: false,
    };
    const newItems = [newItem, ...allItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    updateUserDataInDb({ todoItems: newItems });
  };

  const toggleTodoItem = (id: string) => {
    const allItems = userData?.todoItems || [];
    const newItems = allItems.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    updateUserDataInDb({ todoItems: newItems });
  };

  const deleteTodoItem = (id: string) => {
    const allItems = userData?.todoItems || [];
    const newItems = allItems.filter(i => i.id !== id);
    updateUserDataInDb({ todoItems: newItems });
  };

  const getTodoItemById = React.useCallback((id: string): TodoItem | undefined => {
    return userData?.todoItems?.find(item => item.id === id);
  }, [userData?.todoItems]);

  return (
    <TodoContext.Provider value={{ 
      todoItems,
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
  const context = React.useContext(TodoContext);
  if (context === undefined) {
    throw new Error('useTodos must be used within a TodoProvider');
  }
  return context;
};
