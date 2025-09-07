

"use client";

import React from 'react';
import type { TaskDefinition, RecordEntry } from '@/types';
import { format, getDaysInMonth, startOfMonth, getDate, getDay, eachMonthOfInterval, subMonths, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { getContributionLevel } from '@/lib/config';

interface TaskProgressCardProps {
  task: TaskDefinition;
  records: RecordEntry[];
  endDate: Date;
  months: number;
  orientation?: 'vertical' | 'horizontal';
}

const TaskProgressCard: React.FC<TaskProgressCardProps> = ({ task, records, endDate, months, orientation = 'vertical' }) => {
  const start = subMonths(endDate, months - 1);
  const monthIntervals = eachMonthOfInterval({ start: start, end: endDate });

  return (
    <div className={cn(
        "bg-background rounded-2xl shadow-2xl p-6 flex font-sans border border-white/10",
        orientation === 'vertical' ? 'w-[400px] flex-col' : 'h-[400px] flex-row'
    )}>
      <header className={cn(
          "flex items-center gap-3",
          orientation === 'vertical' ? 'mb-4' : 'mr-6 flex-col text-center border-r border-white/10 pr-6'
      )}>
        <Target className="h-10 w-10" style={{ color: task.color }} />
        <div className={cn(orientation === 'vertical' ? '' : 'flex flex-col items-center')}>
          <h2 className="text-xl font-bold text-white" style={{ color: task.color }}>{task.name}</h2>
          <p className="text-sm text-white/70">
            {format(start, 'MMM yyyy')} - {format(endDate, 'MMM yyyy')}
          </p>
        </div>
      </header>

      <main className={cn(
          "space-y-4",
          orientation === 'horizontal' && 'flex-1 grid gap-4',
          months === 3 && orientation === 'horizontal' && 'grid-cols-3',
          months === 6 && orientation === 'horizontal' && 'grid-cols-3 grid-rows-2',
          months === 12 && orientation === 'horizontal' && 'grid-cols-4 grid-rows-3'
      )}>
        {monthIntervals.map(month => {
          const monthName = format(month, 'MMMM');
          const daysInMonth = getDaysInMonth(month);
          const firstDayOfMonth = getDay(startOfMonth(month)); // 0=Sun, 1=Mon...

          const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = format(new Date(month.getFullYear(), month.getMonth(), day), 'yyyy-MM-dd');
            const dayRecords = records.filter(r => r.date === dateStr);
            const dayValue = dayRecords.reduce((sum, r) => sum + r.value, 0);
            const level = getContributionLevel(dayValue, task.intensityThresholds);
            return { day, value: dayValue, level };
          });

          const getDayStyle = (level: number): React.CSSProperties => {
            if (level === 0) {
              return { backgroundColor: `hsl(var(--muted) / 0.2)` };
            }
            return { backgroundColor: task.color, opacity: 0.3 + (level * 0.175) };
          };

          return (
            <div key={monthName}>
              <h3 className="text-xs font-semibold text-muted-foreground text-center mb-1">{monthName}</h3>
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                  <div key={`empty-${i}`} className="w-full aspect-square" />
                ))}
                {daysArray.map(({ day, level }) => (
                  <div
                    key={day}
                    className="w-full aspect-square rounded-sm"
                    style={getDayStyle(level)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </main>

      <footer className={cn(
          "text-center pt-4 mt-auto border-t border-white/10",
          orientation === 'horizontal' && 'hidden'
      )}>
        <p className="font-bold text-base text-white/90">S.I.G.I.L.</p>
        <p className="text-xs text-white/50">Task Summary</p>
      </footer>
    </div>
  );
};

export default TaskProgressCard;
