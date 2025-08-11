
"use client";

import type { TodoItem } from '@/types';
import React, { useMemo } from 'react';
import { useUserRecords } from './UserRecordsProvider';
import { useSettings } from './SettingsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isSameDay, isYesterday } from 'date-fns';
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
  const { updateUserDataInDb, userData, isUserDataLoaded } = useUserRecords();
  const { dashboardSettings } = useSettings();
  const { toast } = useToast();
  
  const todoItems = React.useMemo(() => {
    if (!isUserDataLoaded || !userData?.todoItems) return [];
    
    return userData.todoItems;
  }, [isUserDataLoaded, userData?.todoItems]);


  // Effect for handling pact penalties
  React.useEffect(() => {
    if (isUserDataLoaded && userData?.todoItems) {
        let itemsChanged = false;
        let processedItems = [...userData.todoItems];
        
        const checkAndApplyPenalties = async () => {
            const yesterdayStr = format(new Date(new Date().setDate(new Date().getDate() - 1)), 'yyyy-MM-dd');
            
            const incompleteYesterday = processedItems.filter(item =>
                !item.completed &&
                !item.penaltyApplied &&
                isSameDay(parseISO(item.createdAt), parseISO(yesterdayStr))
            );

            if (incompleteYesterday.length > 0) {
                itemsChanged = true;
                const firstFailedPact = incompleteYesterday[0];
                let dare: string | undefined;

                try {
                    dare = await generateDare(firstFailedPact.text, dashboardSettings.dareCategory);
                } catch (e) {
                    console.error("Failed to generate dare:", e);
                }

                if (dare) {
                    toast({
                        title: "Pact Judged",
                        description: `A pact from yesterday was incomplete. A new dare has been assigned.`,
                        variant: "destructive",
                        duration: 7000,
                    });
                }
                
                let dareAssigned = false;
                processedItems = processedItems.map(item => {
                    if (incompleteYesterday.some(p => p.id === item.id)) {
                        if (dare && !dareAssigned) {
                            dareAssigned = true;
                            return { ...item, penaltyApplied: true, dare: dare };
                        }
                        return { ...item, penaltyApplied: true };
                    }
                    return item;
                });
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

  const value = useMemo(() => ({
      todoItems,
      addTodoItem,
      toggleTodoItem,
      deleteTodoItem,
      getTodoItemById,
  }), [todoItems, getTodoItemById]);

  return (
    <TodoContext.Provider value={value}>
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
