
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { AreaChart, CartesianGrid, XAxis, YAxis, Area, DotProps, Tooltip as RechartsTooltip } from 'recharts';
import type { AggregatedTimeDataPoint, TaskDefinition, ProgressChartTimeRange } from '@/types';
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
  const { getAggregatesForChart, getTaskDefinitionById } = useUserRecords();
  const { dashboardSettings } = useSettings();
  const [chartData, setChartData] = useState<AggregatedTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const timeRange = dashboardSettings.progressChartTimeRange || 'weekly';

  const task = useMemo(() => {
    return selectedTaskFilterId ? getTaskDefinitionById(selectedTaskFilterId) : null;
  }, [selectedTaskFilterId, getTaskDefinitionById]);
  
  const chartTitle = useMemo(() => {
    const taskName = task ? `${task.name} Progress` : "Progress";
    const rangeName = timeRange.charAt(0).toUpperCase() + timeRange.slice(1);
    return `${rangeName} ${taskName}`;
  }, [task, timeRange]);

  const defaultChartColor = "hsl(var(--primary))";

  useEffect(() => {
    setIsLoading(true);
    const data = getAggregatesForChart(timeRange, selectedTaskFilterId);
    setChartData(data);
    setIsLoading(false);
  }, [selectedTaskFilterId, getAggregatesForChart, timeRange]);

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

  const chartDescription = useMemo(() => {
    switch(timeRange) {
        case 'weekly': return 'Total daily values for the current week.';
        case 'monthly': return 'Total daily values for the last 30 days.';
        case 'quarterly': return 'Total weekly values for the last 3 months.';
        case 'biannually': return 'Total weekly values for the last 6 months.';
        case 'yearly': return 'Total monthly values for the last 12 months.';
        default: return 'Your progress over time.'
    }
  }, [timeRange]);

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-accent" />
          <h2 className="text-2xl font-semibold">{chartTitle}</h2>
        </div>
      </div>
      <div>
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
                width={50}
                domain={[0, 'dataMax']}
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
      </div>
    </div>
  );
};

export default ProgressOverTimeChart;
