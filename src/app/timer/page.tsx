
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
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useTodos } from '@/components/providers/TodoProvider';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Play, Pause, RotateCcw, Timer as TimerIcon, Hourglass, PlusCircle, ListChecks, Repeat } from 'lucide-react';
import type { TaskDefinition, TodoItem } from '@/types';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { format, isToday, parseISO } from 'date-fns';

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

type SelectableItem = {
    id: string;
    name: string;
    type: 'task' | 'pact';
};

const TimerComponent = ({ items, onLogTime, onDoubleClick }: { items: SelectableItem[], onLogTime: (item: SelectableItem, value: number) => void, onDoubleClick: () => void }) => {
    const [hours, setHours] = useState(0);
    const [minutes, setMinutes] = useState(25);
    const [seconds, setSeconds] = useState(0);
    const [initialTime, setInitialTime] = useState(0);
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        setInitialTime(totalSeconds);
        setTime(totalSeconds);
    }, [hours, minutes, seconds]);

    const logTime = useCallback(() => {
        const item = items.find(i => i.id === selectedItemId);
        if (!item) return;
        
        if (initialTime > 0) {
            onLogTime(item, initialTime / 60); // Log in minutes
        }
    }, [items, selectedItemId, initialTime, onLogTime]);

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
    }, [isActive, logTime]);
    
    const handleStartPause = () => {
        if (!selectedItemId) {
            toast({ title: 'No Item Selected', description: 'Please select a task or pact to track time for.', variant: 'destructive' });
            return;
        }
        if (initialTime <= 0) {
            toast({ title: 'No Time Set', description: 'Please set a timer duration greater than zero.', variant: 'destructive' });
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

    const tasks = items.filter(i => i.type === 'task');
    const pacts = items.filter(i => i.type === 'pact');

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-6xl font-mono tracking-tighter cursor-pointer" onDoubleClick={onDoubleClick}>
                {formatTime(time)}
            </div>
            {(!isActive && time === initialTime) && (
                 <div className="flex items-center gap-2">
                    <TimeInput value={hours} onChange={setHours} label="Hours"/>
                    <span className="text-2xl -mt-4">:</span>
                    <TimeInput value={minutes} onChange={setMinutes} label="Minutes"/>
                    <span className="text-2xl -mt-4">:</span>
                    <TimeInput value={seconds} onChange={setSeconds} label="Seconds"/>
                </div>
            )}
            <div className="w-full max-w-sm">
                <Select onValueChange={setSelectedItemId} value={selectedItemId || ''} disabled={isActive}>
                    <SelectTrigger><SelectValue placeholder="Select a task or pact..." /></SelectTrigger>
                    <SelectContent>
                        {pacts.length > 0 && (
                            <SelectGroup>
                                <SelectLabel className="flex items-center gap-2"><ListChecks className="h-4 w-4" />Daily Pacts</SelectLabel>
                                {pacts.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectGroup>
                        )}
                        {tasks.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Tasks</SelectLabel>
                                {tasks.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectGroup>
                        )}
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

const StopwatchComponent = ({ items, onLogTime, onDoubleClick }: { items: SelectableItem[], onLogTime: (item: SelectableItem, value: number) => void, onDoubleClick: () => void }) => {
    const [time, setTime] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
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
        if (!selectedItemId) {
            toast({ title: 'No Item Selected', description: 'Please select a task or pact to track time for.', variant: 'destructive' });
            return;
        }
        setIsActive(!isActive);
    };

    const handleReset = () => {
        if (time > 0) {
            const item = items.find(i => i.id === selectedItemId);
            if (item) {
                onLogTime(item, time / 60); // Log in minutes
            }
        }
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsActive(false);
        setTime(0);
        setSelectedItemId(null);
    };

    const tasks = items.filter(i => i.type === 'task');
    const pacts = items.filter(i => i.type === 'pact');

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="text-6xl font-mono tracking-tighter cursor-pointer" onDoubleClick={onDoubleClick}>
                {formatTime(time)}
            </div>
            <div className="w-full max-w-sm">
                <Select onValueChange={setSelectedItemId} value={selectedItemId || ''} disabled={isActive}>
                    <SelectTrigger><SelectValue placeholder="Select a task or pact..." /></SelectTrigger>
                    <SelectContent>
                       {pacts.length > 0 && (
                            <SelectGroup>
                                <SelectLabel className="flex items-center gap-2"><ListChecks className="h-4 w-4" />Daily Pacts</SelectLabel>
                                {pacts.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectGroup>
                        )}
                        {tasks.length > 0 && (
                            <SelectGroup>
                                <SelectLabel>Tasks</SelectLabel>
                                {tasks.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectGroup>
                        )}
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
    const { taskDefinitions, addRecord, getUserLevelInfo, getTaskDefinitionById } = useUserRecords();
    const { todoItems, toggleTodoItem } = useTodos();
    const { toast } = useToast();
    const [mode, setMode] = useState<'stopwatch' | 'timer'>('stopwatch');

    const timeBasedTasks: SelectableItem[] = taskDefinitions
        .filter(task => task.unit === 'minutes' || task.unit === 'hours')
        .map(task => ({ id: task.id, name: task.name, type: 'task' }));

    const todaysPacts: SelectableItem[] = todoItems
        .filter(pact => isToday(parseISO(pact.createdAt)) && !pact.completed)
        .map(pact => ({ id: pact.id, name: pact.text, type: 'pact' }));

    const selectableItems = [...todaysPacts, ...timeBasedTasks];

    const findAssociatedTask = (pactText: string): TaskDefinition | null => {
        const lowerPactText = pactText.toLowerCase();
        const keywordMap: { [key: string]: string[] } = {
            'exercise': ['exercise', 'workout', 'gym', 'run', 'yoga', 'cardio', 'lift'],
            'work': ['work', 'project', 'meeting', 'code', 'develop'],
            'reading': ['read', 'book'],
            'learning': ['learn', 'study', 'course'],
            'personal': ['meditate', 'journal', 'plan'],
        };

        for (const taskId in keywordMap) {
            if (keywordMap[taskId].some(keyword => lowerPactText.includes(keyword))) {
                const task = getTaskDefinitionById(taskId);
                if (task && (task.unit === 'minutes' || task.unit === 'hours')) {
                    return task;
                }
            }
        }
        const otherTask = getTaskDefinitionById('other');
        if(otherTask && (otherTask.unit === 'minutes' || otherTask.unit === 'hours')) return otherTask;
        
        return null;
    };


    const handleLogTime = (item: SelectableItem, valueInMinutes: number) => {
        let taskToLog: TaskDefinition | null = null;
        let loggedTaskName = '';

        if (item.type === 'pact') {
            toggleTodoItem(item.id);
            taskToLog = findAssociatedTask(item.name);
            loggedTaskName = item.name;
             toast({
                title: "Pact Completed!",
                description: `You've completed the pact: "${item.name}".`
            });
        } else {
            taskToLog = getTaskDefinitionById(item.id)!;
            loggedTaskName = taskToLog.name;
        }

        if (!taskToLog) {
             toast({
                title: "Time Logged to 'Other'",
                description: `Could not find a specific time-based task for "${loggedTaskName}". Logged under 'Other'.`,
                variant: 'default'
            });
            const otherTask = getTaskDefinitionById('other');
            if (otherTask) {
                taskToLog = otherTask;
            } else {
                 toast({
                    title: "Logging Failed",
                    description: "No time-based 'Other' task found. Please create one.",
                    variant: 'destructive'
                });
                return;
            }
        }
        
        let valueToLog = valueInMinutes;
        if (taskToLog.unit === 'hours') {
            valueToLog = valueInMinutes / 60;
        }

        addRecord({
            date: format(new Date(), 'yyyy-MM-dd'),
            value: valueToLog,
            taskType: taskToLog.id,
            notes: `Logged via timer for: "${loggedTaskName}"`
        });

        toast({
            title: "Time Logged!",
            description: `${valueInMinutes.toFixed(2)} minutes logged for "${taskToLog.name}".`
        });
    };
    
    const levelInfo = getUserLevelInfo();
    const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

    const toggleMode = () => {
        setMode(current => current === 'stopwatch' ? 'timer' : 'stopwatch');
    };

    return (
        <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
            <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
            <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up">
                <div className="max-w-2xl mx-auto mt-8 relative">
                     <div className="absolute top-0 right-0">
                        <Button variant="ghost" size="icon" onClick={toggleMode} aria-label={`Switch to ${mode === 'stopwatch' ? 'Timer' : 'Stopwatch'}`}>
                            <Repeat className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                    {mode === 'stopwatch' ? (
                         <StopwatchComponent items={selectableItems} onLogTime={handleLogTime} onDoubleClick={toggleMode} />
                    ) : (
                        <TimerComponent items={selectableItems} onLogTime={handleLogTime} onDoubleClick={toggleMode} />
                    )}
                   
                     {timeBasedTasks.length === 0 && (
                        <div className="text-center p-4 border-t mt-4">
                            <p className="text-muted-foreground">No time-based tasks found.</p>
                            <Button asChild variant="link">
                                <Link href="/settings"><PlusCircle className="mr-2 h-4 w-4"/>Create a time-based task</Link>
                            </Button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
