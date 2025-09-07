

"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useSettings } from '@/components/providers/SettingsProvider';
import { Clock, PlusCircle, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Separator } from '../ui/separator';
import type { TaskUnit, RecordEntry, DailyTimeBreakdownData, TaskDefinition } from '@/types';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

interface DailyTimeBreakdownChartProps {
  date?: Date;
  hideFooter?: boolean;
  records?: RecordEntry[];
  taskDefinitions?: TaskDefinition[];
}

const getDailyTimeBreakdown = (
    date: Date = new Date(),
    allRecords: RecordEntry[],
    allTaskDefinitions: TaskDefinition[]
): DailyTimeBreakdownData[] => {
    const getTaskDefinitionById = (taskId: string): TaskDefinition | undefined => {
        return allTaskDefinitions.find(task => task.id === taskId);
    };

    const getRecordsByDate = (dateStr: string): RecordEntry[] => {
        return allRecords.filter(r => r.date === dateStr);
    };

    const dateStr = format(date, 'yyyy-MM-dd');
    const dailyRecords = getRecordsByDate(dateStr);
    
    const timeBreakdown = new Map<string, { name: string; value: number; color: string }>();
    let totalMinutes = 0;

    const timeBasedRecords = dailyRecords.filter(record => {
        if (!record.taskType) return false;
        const task = getTaskDefinitionById(record.taskType);
        return task && (task.unit === 'minutes' || task.unit === 'hours');
    });

    timeBasedRecords.forEach(record => {
      if (!record.taskType) return; // Should not happen due to filter, but for type safety
      const task = getTaskDefinitionById(record.taskType)!;
      const minutes = task.unit === 'hours' ? record.value * 60 : record.value;
      const current = timeBreakdown.get(task.id) || { name: task.name, value: 0, color: task.color };
      current.value += minutes;
      timeBreakdown.set(task.id, current);
      totalMinutes += minutes;
    });

    const result: DailyTimeBreakdownData[] = Array.from(timeBreakdown.values());
    
    const remainingMinutes = 1440 - totalMinutes;

    if (timeBasedRecords.length === 0) {
      return [{
          name: 'Unallocated',
          value: 1440,
          color: 'hsl(var(--muted))'
      }];
    }
    
    if (remainingMinutes > 0) {
      result.push({
        name: 'Unallocated',
        value: remainingMinutes,
        color: 'hsl(var(--muted))'
      });
    }

    return result;
};

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const hours = Math.floor(data.value / 60);
        const minutes = data.value % 60;
        return (
            <div className="p-2 bg-card border border-border rounded-lg shadow-lg">
                <p className="font-bold" style={{ color: data.color }}>{data.name}</p>
                <p className="text-sm text-muted-foreground">{`${hours}h ${minutes}m`}</p>
            </div>
        );
    }
    return null;
};

const renderLegend = (props: any) => {
    const { payload } = props;
    return (
        <ul className="flex flex-col space-y-2">
            {payload.map((entry: any, index: number) => {
                if (entry.payload.name === 'Unallocated' && entry.payload.value > 0) return null;
                const percentage = ((entry.payload.value / 1440) * 100).toFixed(0);
                return (
                    <li key={`item-${index}`} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }}></span>
                        <span className="text-muted-foreground">{entry.value}</span>
                        <span className="ml-auto text-foreground font-semibold">{percentage}%</span>
                    </li>
                );
            })}
        </ul>
    );
}


const DailyTimeBreakdownChart: React.FC<DailyTimeBreakdownChartProps> = ({ date, hideFooter = false, records: recordsProp, taskDefinitions: taskDefinitionsProp }) => {
    const userRecordsContext = useUserRecords();
    const { dashboardSettings } = useSettings();
    
    const records = recordsProp ?? userRecordsContext.records;
    const taskDefinitions = taskDefinitionsProp ?? userRecordsContext.taskDefinitions;

    const data = useMemo(() => getDailyTimeBreakdown(date, records, taskDefinitions), [date, records, taskDefinitions]);
    const { toast } = useToast();

    const [showQuickLogForm, setShowQuickLogForm] = useState(false);
    const [newTaskName, setNewTaskName] = useState('');
    const [unit, setUnit] = useState<TaskUnit>('minutes');
    const [quickLogValue, setQuickLogValue] = useState<string>('');
    
    const handleQuickLog = () => {
        const value = Number(quickLogValue);

        if (!newTaskName.trim() || !quickLogValue) {
             toast({
                title: 'Missing Information',
                description: 'Please enter a task name and a value.',
                variant: 'destructive',
            });
            return;
        }

        if (unit === 'hours' && value > 24) {
             toast({
                title: 'Invalid Value',
                description: 'Hours cannot exceed 24 for a single day.',
                variant: 'destructive',
            });
            return;
        }

        if (unit === 'minutes' && value > 1440) {
             toast({
                title: 'Invalid Value',
                description: 'Minutes cannot exceed 1440 for a single day.',
                variant: 'destructive',
            });
            return;
        }


        let task = taskDefinitions.find(t => t.name.toLowerCase() === newTaskName.trim().toLowerCase() && (t.unit === 'minutes' || t.unit === 'hours'));
        let taskId = task?.id;

        if (!task) {
            const newTaskId = userRecordsContext.addTaskDefinition({
                name: newTaskName.trim(),
                color: `hsl(${Math.random() * 360}, 70%, 70%)`,
                unit: unit,
            });
            taskId = newTaskId;
            toast({
                title: 'Task Created!',
                description: `New task "${newTaskName.trim()}" was created.`,
            });
        }
        
        if (!taskId) return;
        
        const taskDef = userRecordsContext.getTaskDefinitionById(taskId);

        userRecordsContext.addRecord({
            date: format(date || new Date(), 'yyyy-MM-dd'),
            value: Number(quickLogValue),
            taskType: taskId,
            notes: 'Logged via dashboard widget.'
        });

        toast({
            title: 'Time Logged!',
            description: `${quickLogValue} ${taskDef?.unit || unit} logged for "${newTaskName.trim()}".`,
        });

        setNewTaskName('');
        setQuickLogValue('');
    };
    
    const handleDeleteRecord = (id: string) => {
        userRecordsContext.deleteRecord(id);
        toast({
            title: "Record Deleted",
            description: "The time entry has been removed.",
            variant: "destructive"
        });
    };

    const totalMinutesForAllSlices = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

    const pieData = useMemo(() => {
        return data.map(item => ({
            ...item,
            percentage: totalMinutesForAllSlices > 0 ? (item.value / totalMinutesForAllSlices) * 100 : 0,
        }));
    }, [data, totalMinutesForAllSlices]);

    const getRecordsByDate = (dateStr: string): RecordEntry[] => {
        return records.filter(r => r.date === dateStr);
    };

    const dailyRecords = getRecordsByDate(format(date || new Date(), 'yyyy-MM-dd'));
    const timeBasedRecords = dailyRecords.filter(rec => {
        if (!rec.taskType) return false;
        const task = userRecordsContext.getTaskDefinitionById(rec.taskType!);
        return task && (task.unit === 'minutes' || task.unit === 'hours');
    });

    const isChartEmpty = pieData.length === 1 && pieData[0].name === 'Unallocated';

    return (
        <div className="bg-transparent">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center min-h-[300px]">
                <div className="h-[300px] w-full relative">
                    {isChartEmpty ? (
                         <div className="flex items-center justify-center h-full text-muted-foreground">No time logged today.</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Tooltip content={<CustomTooltip />} />
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius="60%"
                                    outerRadius="80%"
                                    fill="#8884d8"
                                    dataKey="value"
                                    nameKey="name"
                                    strokeWidth={2}
                                    stroke="hsl(var(--background))"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
                <div className="flex flex-col justify-center gap-4">
                    {pieData.filter(item => item.name !== 'Unallocated').map((item, index) => (
                        <div key={index} className="flex items-center gap-3">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                            <div>
                                <p className="font-semibold text-sm text-foreground">{item.name}</p>
                                <p className="text-xs text-muted-foreground">{Math.floor(item.value / 60)}h {item.value % 60}m</p>
                            </div>
                            <p className="ml-auto text-lg font-bold" style={{ color: item.color }}>{item.percentage?.toFixed(0)}%</p>
                        </div>
                    ))}
                </div>
            </div>
            {!hideFooter && (
                <div className="flex-col items-start gap-4 p-6 pt-4">
                    <Separator />
                    <button 
                      className="w-full flex justify-between items-center p-2 rounded-md hover:bg-muted/50 transition-colors"
                      onClick={() => setShowQuickLogForm(!showQuickLogForm)}
                      aria-expanded={showQuickLogForm}
                    >
                        <p className="text-sm font-medium text-muted-foreground">Quick Log Time</p>
                        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showQuickLogForm && "rotate-180")} />
                    </button>
                    {showQuickLogForm && (
                        <div className="w-full space-y-3 animate-fade-in-up">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                 <div>
                                    <Label htmlFor="quick-task-name" className="sr-only">Task Name</Label>
                                    <Input 
                                        id="quick-task-name"
                                        placeholder="Task Name"
                                        value={newTaskName}
                                        onChange={(e) => setNewTaskName(e.target.value)}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Select value={unit} onValueChange={(value: TaskUnit) => setUnit(value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="minutes">Minutes</SelectItem>
                                            <SelectItem value="hours">Hours</SelectItem>
                                        </SelectContent>
                                    </Select>
                                     <Input 
                                        type="number" 
                                        placeholder="e.g., 30"
                                        value={quickLogValue}
                                        onChange={(e) => setQuickLogValue(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button onClick={handleQuickLog} className="w-full">
                                <PlusCircle className="mr-2 h-4 w-4" /> Log Time
                            </Button>
                            {timeBasedRecords.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <h4 className="text-xs font-semibold text-muted-foreground">LOGGED TODAY:</h4>
                                    <ScrollArea className="h-24 pr-2">
                                        <div className="space-y-1">
                                            {timeBasedRecords.map(rec => {
                                                const task = userRecordsContext.getTaskDefinitionById(rec.taskType!);
                                                return (
                                                    <div key={rec.id} className="flex items-center justify-between text-xs p-1 rounded-md hover:bg-muted/50">
                                                        <span>{task?.name}: <span className="font-bold">{rec.value}</span> {task?.unit}</span>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDeleteRecord(rec.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </ScrollArea>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default DailyTimeBreakdownChart;
