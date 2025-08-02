
"use client";

import type { TodoItem } from '@/types';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useUserRecords } from './UserRecordsProvider';
import { useToast } from '@/hooks/use-toast';
import { isPast, startOfDay, format, parseISO, isToday, isYesterday, subDays } from 'date-fns';
import { useAuth } from './AuthProvider';
import { v4 as uuidv4 } from 'uuid';

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
  const userRecords = useUserRecords();
  const { userData, isUserDataLoaded } = useAuth();
  const { toast } = useToast();

  const applyPenalty = useCallback((item: TodoItem): TodoItem => {
    // Only apply penalty if it's defined, positive, and not already applied
    if (item.penalty && item.penalty > 0 && userRecords.deductBonusPoints && !item.penaltyApplied) {
      userRecords.deductBonusPoints(item.penalty);
      toast({
        title: "Pact Broken",
        description: `Your pact "${item.text}" was not honored in time. A penalty of ${item.penalty} XP has been deducted.`,
        variant: "destructive",
        duration: 7000,
      });
      return { ...item, penaltyApplied: true };
    }
    // If there's no penalty to apply, just return the item as-is.
    return item;
  }, [userRecords, toast]);

  // Load from Firebase on auth state change
  useEffect(() => {
    if (isUserDataLoaded && userData) {
        const allStoredItems = userData.todoItems || [];
        const itemsToUpdate: TodoItem[] = [];
        let penaltiesApplied = false;

        const processedItems = allStoredItems.map(item => {
            if (!item.completed && !item.penaltyApplied && item.dueDate) {
                const dueDate = startOfDay(parseISO(item.dueDate));
                if (isPast(dueDate)) {
                    penaltiesApplied = true;
                    // Mark for update instead of calling state-modifying function directly
                    const updatedItem = { ...item, penaltyApplied: true };
                    itemsToUpdate.push(updatedItem);
                    return updatedItem;
                }
            }
            return item;
        });

        if (penaltiesApplied) {
            let totalPenalty = 0;
            const updatedItemsMap = new Map(itemsToUpdate.map(item => [item.id, item]));
            
            const finalItems = allStoredItems.map(item => updatedItemsMap.get(item.id) || item);
            
            itemsToUpdate.forEach(item => {
                if(item.penalty && item.penalty > 0) {
                    totalPenalty += item.penalty;
                }
            });

            if (totalPenalty > 0) {
                userRecords.deductBonusPoints(totalPenalty);
                toast({
                    title: "Pacts Judged",
                    description: `Incomplete pacts from previous days have been penalized. Total penalty: ${totalPenalty} XP.`,
                    variant: "destructive",
                    duration: 7000,
                });
            }
            
            // Save all updated items back to the DB at once.
            userRecords.updateUserDataInDb({ todoItems: finalItems });
            setTodoItems(finalItems);
        } else {
            setTodoItems(allStoredItems);
        }

    } else if (isUserDataLoaded) {
        setTodoItems([]);
    }
}, [userData, isUserDataLoaded, userRecords.deductBonusPoints, userRecords.updateUserDataInDb, toast]);


  const addTodoItem = useCallback((text: string, dueDate?: string, penalty?: number) => {
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

    setTodoItems(prevItems => {
        const newItems = [newItem, ...prevItems].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        userRecords.updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  }, [userRecords.updateUserDataInDb]);

  const toggleTodoItem = useCallback((id: string) => {
    setTodoItems(prevItems => {
        let itemToUpdate: TodoItem | undefined;
        const newItems = prevItems.map(item => {
            if (item.id === id) {
                itemToUpdate = { ...item, completed: !item.completed };
                return itemToUpdate;
            }
            return item;
        });

        if (itemToUpdate) {
            const isOverdue = itemToUpdate.dueDate && !itemToUpdate.completed && isPast(startOfDay(new Date(itemToUpdate.dueDate)));
            if (isOverdue && !itemToUpdate.penaltyApplied) {
                applyPenalty(itemToUpdate);
            }
        }

        userRecords.updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  }, [applyPenalty, userRecords.updateUserDataInDb]);

  const deleteTodoItem = useCallback((id: string) => {
    setTodoItems(prevItems => {
        const newItems = prevItems.filter(i => i.id !== id);
        userRecords.updateUserDataInDb({ todoItems: newItems });
        return newItems;
    });
  }, [userRecords.updateUserDataInDb]);

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
