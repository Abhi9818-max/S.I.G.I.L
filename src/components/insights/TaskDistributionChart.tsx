
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PieChart as PieChartIcon, Target } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import type { TaskDistributionData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface TaskDistributionChartProps {
  startDate: Date;
  endDate: Date;
  taskId: string | null;
}

const TaskDistributionChart: React.FC<TaskDistributionChartProps> = ({ startDate, endDate, taskId }) => {
  const { getTaskDistribution, taskDefinitions } = useUserRecords();
  const [chartData, setChartData] = useState<TaskDistributionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const data = getTaskDistribution(startDate, endDate, taskId);
    const totalValue = data.reduce((sum, item) => sum + item.value, 0);
    const dataWithPercentage = data.map(item => ({
        ...item,
        percentage: totalValue > 0 ? ((item.value / totalValue) * 100) : 0
    })).filter(item => item.value > 0); // Filter out tasks with no value

    setChartData(dataWithPercentage);
    setIsLoading(false);
  }, [startDate, endDate, taskId, getTaskDistribution]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    if (chartData.length > 0) {
      chartData.forEach((item) => {
        config[item.name] = { // Use name as key
          label: item.name,
          color: item.color,
        };
      });
    }
    return config;
  }, [chartData]);
  
  const totalValue = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);

  const SingleTaskView = () => {
    if (!taskId) return null;
    const task = taskDefinitions.find(t => t.id === taskId);
    if (!task) return null;

    return (
        <div className="h-[250px] flex flex-col items-center justify-center text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-bold" style={{color: task.color}}>{task.name}</h3>
            <p className="text-3xl font-bold">{totalValue.toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">Total recorded value in selected period.</p>
        </div>
    );
  };

  const MemoizedPie = React.memo(({ data }: { data: TaskDistributionData[] }) => (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <ChartTooltip
            cursor={false}
            content={<ChartTooltipContent hideLabel />}
        />
        <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius="60%"
            outerRadius="80%"
            strokeWidth={2}
            stroke="hsl(var(--background))"
        >
            {data.map((entry) => (
              <Cell key={`cell-${entry.name}`} fill={entry.color} />
            ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  ));
  MemoizedPie.displayName = 'MemoizedPie';
  
  const LabelColumn = ({ items }: { items: TaskDistributionData[] }) => (
    <div className="flex flex-col justify-center gap-4">
        {items.map(item => (
            <div key={item.name} className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: item.color }} />
                <div>
                    <p className="font-semibold text-sm text-foreground">{item.name}</p>
                    <p className="text-lg font-bold" style={{ color: item.color }}>{item.percentage?.toFixed(0) ?? 0}%</p>
                </div>
            </div>
        ))}
    </div>
  );
  
  const noDataMessage = !taskId && chartData.length <= 1 
    ? "Select a specific task or log data for multiple tasks to see a distribution."
    : "No data to display for this period.";

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PieChartIcon className="h-6 w-6 text-accent" />
          <CardTitle>Task Distribution</CardTitle>
        </div>
        <CardDescription>How your total effort is distributed across tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full p-4">
            <Skeleton className="h-full w-full" />
          </div>
        ) : taskId ? (
          <SingleTaskView />
        ) : chartData.length === 0 || totalValue === 0 || chartData.length <=1 ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">
             {noDataMessage}
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-8 min-h-[250px]">
                <div className="w-full h-full flex items-center justify-center">
                    <MemoizedPie data={chartData} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <LabelColumn items={chartData.slice(0, Math.ceil(chartData.length / 2))} />
                  <LabelColumn items={chartData.slice(Math.ceil(chartData.length / 2))} />
                </div>
            </div>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskDistributionChart;
