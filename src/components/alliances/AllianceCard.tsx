
"use client";

import React from 'react';
import type { Alliance } from '@/types';
import { Shield, Target, Calendar, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

interface AllianceCardProps {
  alliance: Alliance;
}

const AllianceCard: React.FC<AllianceCardProps> = ({ alliance }) => {
  const {
    name,
    description,
    taskName,
    taskColor,
    target,
    startDate,
    endDate,
    members,
    progress,
    photoURL,
  } = alliance;

  const progressPercentage = Math.min((progress / target) * 100, 100);
  const timeRemaining = differenceInDays(parseISO(endDate), new Date());

  return (
    <div className="w-[450px] h-auto bg-background rounded-2xl shadow-2xl p-6 flex flex-col font-sans border border-white/10">
      <header className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-primary/20">
          {photoURL ? (
            <Image src={photoURL} alt={name} fill className="object-cover" />
          ) : (
            <div className="bg-muted w-full h-full" />
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white truncate">{name}</h2>
          <p className="text-sm text-white/70 mt-1">{description}</p>
        </div>
      </header>

      <main className="space-y-4">
        <div className="p-4 rounded-lg bg-card/50">
          <div className="flex items-center gap-3 mb-3">
            <Target className="h-6 w-6" style={{ color: taskColor }} />
            <h3 className="font-semibold text-lg" style={{ color: taskColor }}>
              Objective: {taskName}
            </h3>
          </div>
          <div className="space-y-2">
            <Progress
              value={progressPercentage}
              indicatorClassName="transition-all duration-500"
              style={{ backgroundColor: taskColor }}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="font-mono">
                {progress.toLocaleString()} / {target.toLocaleString()}
              </span>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>
                  {timeRemaining >= 0 ? `${timeRemaining} days left` : 'Ended'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="text-center pt-4 mt-auto border-t border-white/10">
        <p className="font-bold text-lg text-white/90">S.I.G.I.L. Alliance</p>
      </footer>
    </div>
  );
};

export default AllianceCard;
