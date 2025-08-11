
"use client";

import type { TodoItem } from '@/types';
import React, from 'react';
import { useUserRecords } from './UserRecordsProvider';
import { useSettings } from './SettingsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isSameDay } from 'date-fns';
import { useAuth } from './AuthProvider';
import { v4 as uuidv4 } from 'uuid';
import { generateDare } from '@/lib/server/dare';

interface TodoContextType {
  todoItems: TodoItem[];
  addTodoItem: (text: string, dueDate?: string) => void;
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
    
    return userData.todoItems;
  }, [isUserDataLoaded, userData?.todoItems]);


  // Effect for handling pact penalties
  React.useEffect(() => {
    if (isUserDataLoaded && userData?.todoItems) {
        const allStoredItems = userData.todoItems;
        let itemsChanged = false;
        let processedItems = [...allStoredItems];
        
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
                
                const firstFailedPact = itemsForDate[0];
                let dare: string | undefined;
                let penaltyApplied = false;

                try {
                    dare = await generateDare(firstFailedPact.text, dashboardSettings.dareCategory);
                    penaltyApplied = true;
                } catch (e) {
                    console.error("Failed to generate dare:", e);
                }
                
                let dareAssigned = false;
                processedItems = processedItems.map(item => {
                    if (item.dueDate === date && !item.completed && !item.penaltyApplied) {
                        if (dare && !dareAssigned) {
                            dareAssigned = true;
                            return { ...item, penaltyApplied: true, dare };
                        }
                        return { ...item, penaltyApplied: true };
                    }
                    return item;
                });
                
                 if (penaltyApplied) {
                    toast({
                        title: "Pact Judged",
                        description: `A pact from a previous day was incomplete. A new dare has been assigned.`,
                        variant: "destructive",
                        duration: 7000,
                    });
                }
            }

            if (itemsChanged) {
                updateUserDataInDb({ todoItems: processedItems });
            }
        };

        checkAndApplyPenalties();
    }
  }, [isUserDataLoaded, dashboardSettings.dareCategory, userData?.todoItems, updateUserDataInDb, toast]);

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


  const addTodoItem = async (text: string, dueDate?: string) => {
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
