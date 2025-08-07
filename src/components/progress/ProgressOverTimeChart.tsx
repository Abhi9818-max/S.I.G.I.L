
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { AreaChart, CartesianGrid, XAxis, YAxis, Area, DotProps, Tooltip as RechartsTooltip } from 'recharts';
import type { AggregatedTimeDataPoint, TaskDefinition } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ProgressOverTimeChartProps {
  selectedTaskFilterId: string | null;
}

const CustomDot: React.FC<DotProps & { stroke: string }> = (props) => {
  const { cx, cy, stroke } = props;

  if (cx === null || cy === null) {
    return null;
  }

  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill={stroke} />
      <circle cx={cx} cy={cy} r={3} fill="hsl(var(--background))" />
    </g>
  );
};


const ProgressOverTimeChart: React.FC<ProgressOverTimeChartProps> = ({ selectedTaskFilterId }) => {
  const { getDailyAggregatesForChart, getTaskDefinitionById } = useUserRecords();
  const [chartData, setChartData] = useState<AggregatedTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const task = useMemo(() => {
    return selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;
  }, [selectedTaskFilterId, getTaskDefinitionById]);
  
  const chartTitle = task ? `${task.name} Progress` : "Weekly Activity";
  const defaultChartColor = "hsl(var(--primary))";

  useEffect(() => {
    setIsLoading(true);
    // The function now always returns the current week's data.
    const data = getDailyAggregatesForChart(selectedTaskFilterId);
    setChartData(data);
    setIsLoading(false);
  }, [selectedTaskFilterId, getDailyAggregatesForChart]);

  const chartConfig = useMemo(() => {
    let color = defaultChartColor;
    let label = "Total Value"; 

    if (task) {
      color = task.color;
      label = task.name;
    }
    return {
      value: {
        label: label,
        color: color,
      },
    } satisfies ChartConfig;
  }, [task]);

  const yAxisTicks = useMemo(() => {
    if (task?.intensityThresholds && task.intensityThresholds.length === 4) {
      const maxValueInChart = Math.max(...chartData.map(d => d.value), 0);
      const thresholds = [...task.intensityThresholds];
      
      // If the max value in the chart is higher than the highest threshold, add it to the scale
      if (maxValueInChart > thresholds[thresholds.length - 1]) {
        // Add a rounded-up tick to give some space at the top
        const topTick = Math.ceil(maxValueInChart / 5) * 5;
        thresholds.push(topTick);
      }
      
      return [0, ...thresholds];
    }
    return undefined; // Let Recharts decide the ticks
  }, [task, chartData]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-accent" />
          <CardTitle>{chartTitle}</CardTitle>
        </div>
        <CardDescription>Total daily values for the current week.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 || chartData.every(d => d.value === 0) ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">No recent data to display chart.</p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12,
                top: 5,
                bottom: 5,
              }}
            >
              <defs>
                <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                    <stop
                        offset="5%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.4}
                    />
                    <stop
                        offset="95%"
                        stopColor="var(--color-value)"
                        stopOpacity={0.1}
                    />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                width={30}
                ticks={yAxisTicks}
                domain={yAxisTicks ? [0, 'dataMax + 5'] : [0, 'auto']}
              />
              <RechartsTooltip
                cursor={true}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Area
                dataKey="value"
                type="monotone"
                fill="url(#fillValue)"
                stroke={`var(--color-value)`}
                strokeWidth={2}
                dot={<CustomDot stroke={`var(--color-value)`}/>}
                activeDot={<CustomDot stroke={`var(--color-value)`}/>}
                name={chartConfig.value.label}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default ProgressOverTimeChart;
