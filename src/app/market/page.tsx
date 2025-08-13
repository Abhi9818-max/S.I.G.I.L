
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Gem, Store, Zap, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/hooks/use-toast';

export default function MarketPage() {
  const { getUserLevelInfo, convertXpToShards } = useUserRecords();
  const { userData } = useAuth();
  const { toast } = useToast();
  
  const [xpToConvert, setXpToConvert] = useState('');

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  const aetherShards = userData?.aetherShards ?? 0;
  const totalXP = levelInfo?.totalAccumulatedValue ?? 0;
  const convertibleXp = userData?.bonusPoints ?? 0;

  const handleConversion = () => {
    const amount = Number(xpToConvert);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Invalid Amount', description: 'Please enter a positive number.', variant: 'destructive' });
      return;
    }
    if (amount > convertibleXp) {
      toast({ title: 'Not Enough XP', description: `You only have ${convertibleXp.toLocaleString()} convertible XP.`, variant: 'destructive' });
      return;
    }

    try {
      convertXpToShards(amount);
      toast({ title: 'Conversion Successful', description: `You converted ${amount.toLocaleString()} XP into ${(amount / 5).toLocaleString()} Aether Shards.` });
      setXpToConvert('');
    } catch (error) {
      toast({ title: 'Conversion Failed', description: (error as Error).message, variant: 'destructive' });
    }
  };

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
            <p className="text-muted-foreground mt-2">Exchange resources and trade with friends.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
            <Card>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <p className="text-3xl font-bold">{totalXP.toLocaleString()}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">XP</p>
              </CardContent>
            </Card>
          </div>
          
           <Card className="mt-6">
            <CardHeader>
                <CardTitle>XP Converter</CardTitle>
                <CardDescription>Convert your bonus XP into Aether Shards at a rate of 5 XP to 1 Shard.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        You have <span className="font-bold text-primary">{convertibleXp.toLocaleString()}</span> convertible bonus XP.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input 
                            type="number"
                            placeholder="XP to convert"
                            value={xpToConvert}
                            onChange={(e) => setXpToConvert(e.target.value)}
                            min="1"
                            max={convertibleXp}
                        />
                        <Button onClick={handleConversion} disabled={!xpToConvert || Number(xpToConvert) <= 0}>
                            <ArrowRight className="mr-2 h-4 w-4" />
                            Convert
                        </Button>
                    </div>
                    {Number(xpToConvert) > 0 && (
                        <p className="text-sm text-center text-muted-foreground">
                            You will receive: <span className="font-bold text-cyan-400">{(Math.floor(Number(xpToConvert) / 5)).toLocaleString()}</span> Aether Shards
                        </p>
                    )}
                </div>
            </CardContent>
           </Card>
        </div>
      </main>
    </div>
  );
}
