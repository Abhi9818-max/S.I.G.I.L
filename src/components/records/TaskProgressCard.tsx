
"use client";

import React from 'react';
import type { TaskDefinition, RecordEntry } from '@/types';
import { format, getDaysInMonth, startOfMonth, getDate, getDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Target } from 'lucide-react';
import { getContributionLevel } from '@/lib/config';

interface TaskProgressCardProps {
  task: TaskDefinition;
  records: RecordEntry[];
  month: Date;
}

const TaskProgressCard: React.FC<TaskProgressCardProps> = ({ task, records, month }) => {
  const monthName = format(month, 'MMMM yyyy');
  const daysInMonth = getDaysInMonth(month);
  const firstDayOfMonth = getDay(startOfMonth(month)); // 0=Sun, 1=Mon...
  
  const totalValue = records.reduce((sum, r) => sum + r.value, 0);

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
  }

  return (
    <div className="w-[400px] h-auto bg-background rounded-2xl shadow-2xl p-6 flex flex-col font-sans border border-white/10">
      <header className="flex items-center gap-3 mb-4">
        <Target className="h-8 w-8" style={{ color: task.color }} />
        <div>
          <h2 className="text-xl font-bold text-white" style={{ color: task.color }}>{task.name}</h2>
          <p className="text-sm text-white/70">{monthName}</p>
        </div>
      </header>

      <main className="space-y-4">
        <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
        </div>
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
      </main>

      <footer className="text-center pt-4 mt-auto border-t border-white/10">
        <p className="font-bold text-base text-white/90">S.I.G.I.L.</p>
        <p className="text-xs text-white/50">Monthly Task Summary</p>
      </footer>
    </div>
  );
};

export default TaskProgressCard;
