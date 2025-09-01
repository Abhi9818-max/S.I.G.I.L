
"use client";

import React, { ReactNode } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { UserRecordsProvider } from '@/components/providers/UserRecordsProvider';
import { TodoProvider } from '@/components/providers/TodoProvider';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { FriendProvider } from '@/components/providers/FriendProvider';
import { AllianceProvider } from './AllianceProvider';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <FriendProvider>
        <AllianceProvider>
          <UserRecordsProvider>
            <SettingsProvider>
              <TooltipProvider delayDuration={100}>
                <TodoProvider>
                  {children}
                </TodoProvider>
              </TooltipProvider>
            </SettingsProvider>
          </UserRecordsProvider>
        </AllianceProvider>
      </FriendProvider>
    </AuthProvider>
  );
}
