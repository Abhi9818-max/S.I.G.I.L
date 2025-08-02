
"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, BarChart } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAuth } from '@/components/providers/AuthProvider';
import type { UserData, TaskDefinition } from '@/types';
import { startOfYear, endOfYear, parseISO } from 'date-fns';

interface TaskComparisonChartProps {
    friendData: UserData;
}

const TaskComparisonChart: React.FC<TaskComparisonChartProps> = ({ friendData }) => {
    const { userData } = useAuth();
    const { taskDefinitions: currentUserTasks, records: currentUserRecordsFromCtx } = useUserRecords();
    
    const currentUserRecords = userData?.records || currentUserRecordsFromCtx;

    const comparisonData = useMemo(() => {
        const friendTasks = friendData.taskDefinitions || [];
        const friendRecords = friendData.records || [];

        // Combine all unique task definitions from both users
        const allTaskDefinitions = new Map<string, TaskDefinition>();
        [...currentUserTasks, ...friendTasks].forEach(task => {
            if (!allTaskDefinitions.has(task.id)) {
                allTaskDefinitions.set(task.id, task);
            }
        });
        
        const data = Array.from(allTaskDefinitions.values()).map(task => {
            const currentUserTotal = currentUserRecords
                .filter(r => r.taskType === task.id)
                .reduce((sum, r) => sum + r.value, 0);
            
            const friendUserTotal = friendRecords
                .filter(r => r.taskType === task.id)
                .reduce((sum, r) => sum + r.value, 0);
            
            // Only include tasks where at least one person has data
            if(currentUserTotal === 0 && friendUserTotal === 0) return null;

            return {
                task: task.name,
                'You': currentUserTotal,
                [friendData.username]: friendUserTotal,
            };
        }).filter(Boolean);

        return data as { task: string; [key: string]: number | string; }[];
    }, [friendData, userData, currentUserTasks, currentUserRecords]);

    if (!comparisonData || comparisonData.length === 0) {
        return (
             <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <BarChart className="h-6 w-6 text-primary" />
                        <CardTitle>Task Comparison</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                        No shared tasks with data to compare.
                    </div>
                </CardContent>
            </Card>
        );
    }
    
    const maxVal = Math.max(
      ...comparisonData.flatMap(d => [d['You'] as number, d[friendData.username] as number])
    );
    const friendColor = "hsl(var(--destructive))";
    const userColor = "hsl(var(--primary))";

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <BarChart className="h-6 w-6 text-primary" />
                    <CardTitle>Task Comparison</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={comparisonData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="task" />
                        <PolarRadiusAxis angle={30} domain={[0, maxVal > 0 ? 'auto' : 100]} tick={false} axisLine={false} />
                        <Radar 
                          name="You" 
                          dataKey="You" 
                          stroke={userColor} 
                          fill={userColor} 
                          fillOpacity={0.6} 
                        />
                        <Radar 
                          name={friendData.username} 
                          dataKey={friendData.username} 
                          stroke={friendColor} 
                          fill={friendColor} 
                          fillOpacity={0.6}
                        />
                        <Legend />
                    </RadarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

export default TaskComparisonChart;
