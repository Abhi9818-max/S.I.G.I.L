
"use client";

import React from 'react';
import type { DayData } from '@/types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format, parseISO, isFuture } from 'date-fns';

interface DaySquareProps {
  day: DayData;
  onDoubleClick: () => void;
}

const DaySquare: React.FC<DaySquareProps> = ({ day, onDoubleClick }) => {
  const dayDate = parseISO(day.date);
  const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  const isDayInTheFuture = isFuture(dayDate) && !isToday;

  const getSquareStyle = (): React.CSSProperties => {
    // Level 0 or future: No activity
    if (day.level === 0 || day.value === null || isDayInTheFuture) {
      return { backgroundColor: `var(--contribution-level-0)` };
    }

    // Level 1-4 with a specific task color
    if (day.taskColor) {
      return { backgroundColor: day.taskColor, opacity: 0.3 + (day.level * 0.175) };
    }

    // Fallback for activity without a task color
    return { backgroundColor: `var(--contribution-level-${day.level})` };
  };

  let tooltipText = `No records on ${format(dayDate, "MMM d, yyyy")}`;
  if (day.value !== null && day.value > 0) {
    if (day.taskName) {
      tooltipText = `${day.value} for ${day.taskName} on ${format(dayDate, "MMM d, yyyy")}`;
    } else {
      tooltipText = `${day.value} record(s) on ${format(dayDate, "MMM d, yyyy")}`;
    }
  } else if (isDayInTheFuture) {
    tooltipText = `Future date: ${format(dayDate, "MMM d, yyyy")}`;
  }


  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onDoubleClick={onDoubleClick}
            disabled={isDayInTheFuture}
            className={cn(
              "aspect-square w-full h-full rounded-sm focus:outline-none focus:ring-2 focus:ring-ring",
              "hover:shadow-md hover:brightness-110",
              "transition-all duration-200 ease-out",
              isDayInTheFuture ? "cursor-not-allowed" : "cursor-pointer",
              isToday && "today-glow"
            )}
            style={getSquareStyle()}
            aria-label={tooltipText}
          />
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DaySquare;
