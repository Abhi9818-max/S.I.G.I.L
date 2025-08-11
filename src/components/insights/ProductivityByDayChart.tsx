
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart2 } from 'lucide-react';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig
} from "@/components/ui/chart";
import { BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import type { ProductivityByDayData } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductivityByDayChartProps {
  startDate: Date;
  endDate: Date;
  taskId: string | null;
}

const chartConfig = {
  total: {
    label: "Total Value",
    color: "hsl(var(--accent))",
  },
} satisfies ChartConfig;

const ProductivityByDayChart: React.FC<ProductivityByDayChartProps> = ({ startDate, endDate, taskId }) => {
  const { getProductivityByDay } = useUserRecords();
  const [chartData, setChartData] = useState<ProductivityByDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const data = getProductivityByDay(startDate, endDate, taskId);
    setChartData(data);
    setIsLoading(false);
  }, [startDate, endDate, taskId, getProductivityByDay]);

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-accent" />
          <h3 className="text-lg font-semibold">Productivity by Day</h3>
        </div>
        <p className="text-sm text-muted-foreground">Which days of the week are your most active?</p>
      </div>
      <div>
        {isLoading ? (
          <div className="h-[250px] w-full p-4">
            <Skeleton className="h-full w-full" />
          </div>
        ) : chartData.length === 0 || chartData.every(d => d.total === 0) ? (
          <p className="text-center text-muted-foreground py-10 h-[250px] flex items-center justify-center">
            No productivity data available for this period.
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[250px] w-full">
            <BarChart accessibilityLayer data={chartData}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                className="text-xs"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                className="text-xs"
                width={50}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="total" fill="var(--color-total)" radius={4} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
};

export default ProductivityByDayChart;
