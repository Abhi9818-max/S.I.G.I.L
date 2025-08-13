
"use client";

import React from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gem, Store } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';

export default function MarketPage() {
  const { getUserLevelInfo } = useUserRecords();
  const { userData } = useAuth();
  
  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  const aetherShards = userData?.aetherShards ?? 0;

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6 md:p-0">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Marketplace</h1>
            </div>
            <p className="text-muted-foreground mt-2">Trade with friends and acquire valuable items.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
            <Card className="md:col-span-1">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Your Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Gem className="h-6 w-6 text-cyan-400" />
                  <p className="text-3xl font-bold">{aetherShards.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Aether Shards</p>
              </CardContent>
            </Card>
          </div>
          
           <div className="text-center text-muted-foreground py-20">
              <p>Marketplace under construction.</p>
              <p className="text-sm">Soon you'll be able to trade items with your friends here.</p>
            </div>

        </div>
      </main>
    </div>
  );
}
