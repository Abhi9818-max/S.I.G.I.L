
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { TaskDefinition } from '@/types';
import { ListFilter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskFilterBarProps {
  taskDefinitions: TaskDefinition[];
  selectedTaskId: string | null;
  onSelectTask: (taskId: string | null) => void;
}

const TaskFilterBar: React.FC<TaskFilterBarProps> = ({ taskDefinitions, selectedTaskId, onSelectTask }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-4 p-3 rounded-lg shadow-md bg-card">
      <button 
        onClick={() => setIsExpanded(!isExpanded)} 
        className="flex items-center w-full text-left mb-3"
        aria-expanded={isExpanded}
      >
        <ListFilter className="h-4 w-4 mr-2 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Filter by Task</h3>
        <ChevronDown className={cn("h-4 w-4 ml-auto text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
      </button>

      {isExpanded && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          <Button
            variant={selectedTaskId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onSelectTask(null)}
            className={cn(
              "transition-all",
              selectedTaskId === null && "shadow-md"
            )}
          >
            All Tasks
          </Button>
          {taskDefinitions.map((task) => (
            <Button
              key={task.id}
              variant={selectedTaskId === task.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onSelectTask(task.id)}
              className={cn(
                  "transition-all text-foreground/90",
                  selectedTaskId === task.id && "shadow-md text-primary-foreground brightness-110"
              )}
              style={
                selectedTaskId === task.id
                  ? {
                      backgroundColor: task.color,
                      borderColor: task.color,
                    }
                  : {}
              }
            >
              {task.name}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TaskFilterBar;
