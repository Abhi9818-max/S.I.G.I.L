
"use client";

import React, { useState, useEffect } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart2, Calendar, CornerDownLeft, Search, ListFilter } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { subDays, startOfYear, getYear, endOfYear } from 'date-fns';
import TaskDistributionChart from '@/components/insights/TaskDistributionChart';
import ProductivityByDayChart from '@/components/insights/ProductivityByDayChart';
import Link from 'next/link';
import { Label } from '@/components/ui/label';

type TimeRange = 'last_30_days' | 'last_90_days' | 'this_year' | 'last_year' | 'custom';

export default function InsightsPage() {
  const { getUserLevelInfo, getAggregateSum, taskDefinitions } = useUserRecords();
  const [timeRange, setTimeRange] = useState<TimeRange>('last_30_days');
  const [customDays, setCustomDays] = useState<number | string>(30);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date, end: Date }>({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const calculateDateRange = (range: TimeRange, days?: number) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (range) {
      case 'last_90_days':
        start = subDays(now, 89);
        end = now;
        break;
      case 'this_year':
        start = startOfYear(now);
        end = now;
        break;
      case 'last_year':
        const lastYear = getYear(now) - 1;
        start = startOfYear(new Date(lastYear, 0, 1));
        end = endOfYear(new Date(lastYear, 11, 31));
        break;
      case 'custom':
        start = subDays(now, (Number(days) || 30) - 1);
        end = now;
        break;
      case 'last_30_days':
      default:
        start = subDays(now, 29);
        end = now;
        break;
    }
    setDateRange({ start, end });
  };
  
  // This effect recalculates the date range whenever the timeRange filter changes
  useEffect(() => {
    if (timeRange !== 'custom') {
      calculateDateRange(timeRange);
    }
  }, [timeRange]);

  const handleCustomDaysApply = () => {
    const days = Number(customDays);
    if (days > 0) {
      calculateDateRange('custom', days);
    }
  };
  
  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  const displayedSum = getAggregateSum(dateRange.start, dateRange.end, selectedTaskId);
  
  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header 
        onAddRecordClick={() => {}} 
        onManageTasksClick={() => {}}
      />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
        <div className="w-full max-w-6xl mx-auto">
          <div className="p-6 md:p-0">
            <div className="flex items-center gap-2">
              <BarChart2 className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-semibold leading-none tracking-tight">Your Insights</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-2">A deeper look into your patterns of growth and effort.</p>
          </div>
          <div className="p-6 md:p-0 pt-6">
             <div className="p-4 border rounded-lg bg-muted/50 mb-8">
                <div className="flex flex-col md:flex-row flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <ListFilter className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="task-filter" className="flex-shrink-0">Task</Label>
                        <Select onValueChange={(value) => setSelectedTaskId(value === 'all' ? null : value)} defaultValue="all" name="task-filter">
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Select a task" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Tasks</SelectItem>
                                {taskDefinitions.map(task => (
                                    <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <Label htmlFor="time-range-filter" className="flex-shrink-0">Time Range</Label>
                         <Select onValueChange={(value: TimeRange) => setTimeRange(value)} defaultValue={timeRange} name="time-range-filter">
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Select time range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                                <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                                <SelectItem value="this_year">This Year</SelectItem>
                                <SelectItem value="last_year">Last Year</SelectItem>
                                <SelectItem value="custom">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                   
                    {timeRange === 'custom' && (
                        <div className="flex items-center gap-2 w-full md:w-auto animate-fade-in-up">
                            <Label htmlFor="custom-days" className="sr-only">Custom Days</Label>
                            <Input 
                                id="custom-days"
                                type="number"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                                onBlur={() => {
                                    if (customDays === '' || Number(customDays) <= 0) {
                                        setCustomDays(30);
                                    }
                                }}
                                placeholder="Days"
                                className="w-full md:w-24"
                                onFocus={() => setTimeRange('custom')}
                            />
                            <Button onClick={handleCustomDaysApply} size="sm" variant="secondary">
                                <Search className="h-4 w-4"/>
                            </Button>
                        </div>
                    )}
                </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
               <Card className="lg:col-span-1">
                 <CardHeader>
                   <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total for Selected Period
                   </CardTitle>
                    <CardDescription>
                      {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                    </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <p className="text-3xl font-bold">{displayedSum.toLocaleString()}</p>
                 </CardContent>
               </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <TaskDistributionChart startDate={dateRange.start} endDate={dateRange.end} taskId={selectedTaskId} />
                <ProductivityByDayChart startDate={dateRange.start} endDate={dateRange.end} taskId={selectedTaskId} />
            </div>
          </div>
        </div>
        <div className="text-center mt-8">
            <Button asChild variant="outline">
                <Link href="/">
                    <CornerDownLeft className="mr-2 h-4 w-4" />
                    Return to Dashboard
                </Link>
            </Button>
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground border-t border-border">
        S.I.G.I.L. Insights &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
