
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
    }));

    setChartData(dataWithPercentage);
    setIsLoading(false);
  }, [startDate, endDate, taskId, getTaskDistribution]);

  const chartConfig = useMemo(() => {
    const config: any = {};
    if (chartData.length > 0) {
      chartData.forEach(item => {
        config[item.name] = {
          label: item.name,
          color: item.fill,
        };
      });
    }
    return config;
  }, [chartData]);
  
  const totalValue = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);


  const SingleTaskView = () => {
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
            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
            ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  ));
  MemoizedPie.displayName = 'MemoizedPie';
  
  const LabelColumn = ({ items }: { items: TaskDistributionData[] }) => (
    <div className="flex flex-col justify-center gap-6">
        {items.map(item => (
            <div key={item.name} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full mt-2" style={{ backgroundColor: item.fill }} />
                <div>
                    <p className="font-semibold text-foreground">{item.name}</p>
                    <p className="text-2xl font-bold" style={{ color: item.fill }}>{item.percentage?.toFixed(0) ?? 0}%</p>
                </div>
            </div>
        ))}
    </div>
  );

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
        ) : chartData.length === 0 || totalValue === 0 ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">
            No data to display for this period.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4 min-h-[250px]">
            <LabelColumn items={chartData.slice(0, Math.ceil(chartData.length / 2))} />
            <div className="col-span-1 h-full flex items-center justify-center">
              <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
                <MemoizedPie data={chartData} />
              </ChartContainer>
            </div>
            <LabelColumn items={chartData.slice(Math.ceil(chartData.length / 2))} />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TaskDistributionChart;
