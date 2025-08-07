
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
import { AreaChart, CartesianGrid, XAxis, YAxis, Area, DotProps } from 'recharts';
import type { AggregatedTimeDataPoint } from '@/types';
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
  const { getDailyAggregatesForChart, taskDefinitions } = useUserRecords();
  const [chartData, setChartData] = useState<AggregatedTimeDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const task = useMemo(() => {
    return selectedTaskFilterId ? taskDefinitions.find(t => t.id === selectedTaskFilterId) : null;
  }, [selectedTaskFilterId, taskDefinitions]);
  
  const chartTitle = task ? `${task.name} Progress` : "Recent Activity";
  const defaultChartColor = "hsl(var(--primary))";

  useEffect(() => {
    setIsLoading(true);
    const data = getDailyAggregatesForChart(7, selectedTaskFilterId);
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
  }, [task, defaultChartColor]);


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-accent" />
          <CardTitle>{chartTitle}</CardTitle>
        </div>
        <CardDescription>Total daily values over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[250px] w-full">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">Not enough data to display chart.</p>
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
                tickFormatter={(value) => value.substring(0,3)}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                width={30}
              />
              <ChartTooltip
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
