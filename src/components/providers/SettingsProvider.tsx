

"use client";

import type { DashboardSettings } from '@/types';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const defaultSettings: DashboardSettings = {
  showTotalLast30Days: true,
  totalDays: 30,
  showCurrentStreak: true,
  showDailyConsistency: true,
  consistencyDays: 30,
  showHighGoalStat: true,
  showTaskFilterBar: true,
  showContributionGraph: true,
  showTodoList: true,
  showProgressChart: true,
  showTimeBreakdownChart: true,
  pieChartLabelFormat: 'percentage',
};

interface SettingsContextType {
  dashboardSettings: DashboardSettings;
  updateDashboardSetting: <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dashboardSettings, setDashboardSettings] = useState<DashboardSettings>(defaultSettings);
  const { user, userData, isUserDataLoaded } = useAuth();

  useEffect(() => {
    if (isUserDataLoaded && userData?.dashboardSettings) {
      const mergedSettings = { ...defaultSettings, ...userData.dashboardSettings };
      setDashboardSettings(mergedSettings);
    } else if (isUserDataLoaded) {
      setDashboardSettings(defaultSettings);
    }
  }, [userData, isUserDataLoaded]);

  const updateDashboardSetting = useCallback(<K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
    setDashboardSettings(prevSettings => {
        const newSettings = {
            ...prevSettings,
            [key]: value,
        };
        
        // Save to Firestore
        if (user) {
            const updateDb = async () => {
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    await setDoc(userDocRef, { dashboardSettings: newSettings }, { merge: true });
                } catch (e) {
                    console.error("Failed to save dashboard settings to Firestore:", e);
                }
            };
            updateDb();
        }
        return newSettings;
    });
  }, [user]);

  return (
    <SettingsContext.Provider value={{ dashboardSettings, updateDashboardSetting }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
