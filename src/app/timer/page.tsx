
"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Hourglass, PlusCircle } from 'lucide-react';
import type { TaskDefinition } from '@/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

const formatTime = (timeInSeconds: number) => {
  const hours = Math.floor(timeInSeconds / 3600);
  const minutes = Math.floor((timeInSeconds % 3600) / 60);
  const seconds = timeInSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const TimeInput = ({ value, onChange, label }: { value: number, onChange: (value: number) => void, label: string }) => (
    <div className="flex flex-col items-center">
        <Input 
            type="number" 
            value={value} 
            onChange={(e) => onChange(Number(e.target.value))} 
            className="w-20 text-center text-2xl h-12"
            min="0"
        />
        <label className="text-xs text-muted-foreground mt-1">{label}</label>
    </div>
);


const TimerComponent = ({ tasks, onLogTime }: { tasks: TaskDefinition[], onLogTime: (task: TaskDefinition, value: number) => void }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        setInitialTime(totalSeconds);
        setTime(totalSeconds);
    }, [hours, minutes, seconds]);

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTime(prevTime => {
                    if (prevTime <= 1) {
                        clearInterval(intervalRef.current!);
                        setIsActive(false);
                        logTime();
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive, selectedTaskId]);

    const logTime = () => {
        const task = tasks.find(t => t.id === selectedTaskId);
        if (!task) return;
        
        const timeToLog = initialTime - time;
        if(timeToLog > 0) {
            onLogTime(task, timeToLog / 60); // Log in minutes
        }
    };
    
    const handleStartPause = () => {
        if (!selectedTaskId) {
            toast({ title: 'No Task Selected', description: 'Please select a task to track time for.', variant: 'destructive' });
            return;
        }
        setIsActive(!isActive);
    };

    const handleReset = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        setTime(totalSeconds);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-6xl font-mono tracking-tighter">
                {formatTime(time)}
            </div>
            {!isActive && time === 0 && (
                 <div className="flex items-center gap-2">
                    <TimeInput value={hours} onChange={setHours} label="Hours"/>
                    <span className="text-2xl -mt-4">:</span>
                    <TimeInput value={minutes} onChange={setMinutes} label="Minutes"/>
                    <span className="text-2xl -mt-4">:</span>
                    <TimeInput value={seconds} onChange={setSeconds} label="Seconds"/>
                </div>
            )}
            <div className="w-full max-w-sm">
                <Select onValueChange={setSelectedTaskId} value={selectedTaskId || ''} disabled={isActive}>
                    <SelectTrigger><SelectValue placeholder="Select a task..." /></SelectTrigger>
                    <SelectContent>
                        {tasks.map(task => <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-4">
                <Button onClick={handleStartPause} size="lg" className="w-32">
                    {isActive ? <><Pause className="mr-2 h-5 w-5" /> Pause</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
                </Button>
                <Button onClick={handleReset} size="lg" variant="outline"><RotateCcw className="mr-2 h-5 w-5" /> Reset</Button>
            </div>
        </div>
    );
};

const StopwatchComponent = ({ tasks, onLogTime }: { tasks: TaskDefinition[], onLogTime: (task: TaskDefinition, value: number) => void }) => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        if (isActive) {
            intervalRef.current = setInterval(() => {
                setTime(prevTime => prevTime + 1);
            }, 1000);
        } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [isActive]);
    
    const handleStartPause = () => {
        if (!selectedTaskId) {
            toast({ title: 'No Task Selected', description: 'Please select a task to track time for.', variant: 'destructive' });
            return;
        }
        setIsActive(!isActive);
    };

    const handleReset = () => {
        if (isActive) { // If stopwatch is running, log the time before resetting
            const task = tasks.find(t => t.id === selectedTaskId);
            if (task) {
                onLogTime(task, time / 60); // Log in minutes
            }
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        setTime(0);
        setSelectedTaskId(null);
    };

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-6xl font-mono tracking-tighter">
                {formatTime(time)}
            </div>
            <div className="w-full max-w-sm">
                <Select onValueChange={setSelectedTaskId} value={selectedTaskId || ''} disabled={isActive}>
                    <SelectTrigger><SelectValue placeholder="Select a task..." /></SelectTrigger>
                    <SelectContent>
                        {tasks.map(task => <SelectItem key={task.id} value={task.id}>{task.name}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex gap-4">
                <Button onClick={handleStartPause} size="lg" className="w-32">
                    {isActive ? <><Pause className="mr-2 h-5 w-5" /> Pause</> : <><Play className="mr-2 h-5 w-5" /> Start</>}
                </Button>
                <Button onClick={handleReset} size="lg" variant="outline"><RotateCcw className="mr-2 h-5 w-5" /> Reset & Log</Button>
            </div>
        </div>
    );
};


export default function TimerPage() {
    const { taskDefinitions, addRecord, getUserLevelInfo } = useUserRecords();
    const { toast } = useToast();

    const timeBasedTasks = taskDefinitions.filter(task => task.unit === 'minutes' || task.unit === 'hours');

    const handleLogTime = (task: TaskDefinition, value: number) => {
        let valueToLog = value;
        if (task.unit === 'hours') {
            valueToLog = value / 60;
        }

        addRecord({
            date: format(new Date(), 'yyyy-MM-dd'),
            value: valueToLog,
            taskType: task.id,
            notes: 'Logged via timer/stopwatch.'
        });

        toast({
            title: "Time Logged!",
            description: `${value.toFixed(2)} minutes logged for "${task.name}".`
        });
    };
    
    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <div className="max-w-2xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>Time Tracker</CardTitle>
                            <CardDescription>Use the stopwatch to track active work or the timer for focused sessions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="stopwatch" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="stopwatch"><TimerIcon className="mr-2 h-4 w-4" />Stopwatch</TabsTrigger>
                                    <TabsTrigger value="timer"><Hourglass className="mr-2 h-4 w-4"/>Timer</TabsTrigger>
                                </TabsList>
                                <div className="pt-8">
                                    <TabsContent value="stopwatch">
                                        <StopwatchComponent tasks={timeBasedTasks} onLogTime={handleLogTime} />
                                    </TabsContent>
                                    <TabsContent value="timer">
                                        <TimerComponent tasks={timeBasedTasks} onLogTime={handleLogTime} />
                                    </TabsContent>
                                </div>
                            </Tabs>
                             {timeBasedTasks.length === 0 && (
                                <div className="text-center p-4 border-t mt-4">
                                    <p className="text-muted-foreground">No time-based tasks found.</p>
                                    <Button asChild variant="link">
                                        <Link href="/settings"><PlusCircle className="mr-2 h-4 w-4"/>Create a time-based task</Link>
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

