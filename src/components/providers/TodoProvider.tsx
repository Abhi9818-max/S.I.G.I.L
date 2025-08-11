
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRecords } from './UserRecordsProvider';
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
  const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
  const { updateUserDataInDb, deductBonusPoints, userData, isUserDataLoaded, getTaskDefinitionById } = useUserRecords();
  const { toast } = useToast();

  // Load initial data and handle penalties on mount
  useEffect(() => {
    if (isUserDataLoaded && userData) {
      const allStoredItems = userData.todoItems || [];
      let totalPenalty = 0;
      let itemsChanged = false;

      const checkAndApplyPenalties = async () => {
        const promises = allStoredItems.map(async (item) => {
          if (!item.completed && !item.penaltyApplied && item.dueDate && isPast(startOfDay(parseISO(item.dueDate)))) {
            let dare: string | undefined = undefined;
            if (item.penalty && item.penalty > 0) {
              totalPenalty += item.penalty;
              try {
                // Since this might be for a task, we can try to find the task name
                const taskName = item.text; // Assume pact text is descriptive enough
                dare = await generateDare(taskName);
              } catch (e) {
                console.error("Failed to generate dare:", e);
              }
            }
            itemsChanged = true;
            return { ...item, penaltyApplied: true, dare };
          }
          return item;
        });
        
        const processedItems = await Promise.all(promises);
        setTodoItems(processedItems);

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
          // Save the updated penalty status
          updateUserDataInDb({ todoItems: processedItems });
        }
      }

      checkAndApplyPenalties();
    } else if (isUserDataLoaded) {
      setTodoItems([]);
    }
  }, [userData, isUserDataLoaded, deductBonusPoints, updateUserDataInDb, toast]);

  const addTodoItem = (text: string, dueDate?: string, penalty?: number) => {
    if (text.trim() === '') return;
    
    const newItem: TodoItem = {
      id: uuidv4(),
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      ...(dueDate && { dueDate }),
      ...(dueDate && penalty && penalty > 0 && { penalty }),
      penaltyApplied: false,
    };

    const newItems = [newItem, ...todoItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setTodoItems(newItems);
    updateUserDataInDb({ todoItems: newItems });
  };

  const toggleTodoItem = (id: string) => {
    const newItems = todoItems.map(item => {
      if (item.id === id) {
        return { ...item, completed: !item.completed };
      }
      return item;
    });
    setTodoItems(newItems);
    updateUserDataInDb({ todoItems: newItems });
  };

  const deleteTodoItem = (id: string) => {
    const newItems = todoItems.filter(i => i.id !== id);
    setTodoItems(newItems);
    updateUserDataInDb({ todoItems: newItems });
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
