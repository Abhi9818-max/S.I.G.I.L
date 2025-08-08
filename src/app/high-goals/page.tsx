
"use client";

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { v4 as uuidv4 } from 'uuid';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from '@/components/ui/progress';
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, PlusCircle, Edit, Trash2, CalendarIcon, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { HighGoal, TaskDefinition } from '@/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const highGoalFormSchema = z.object({
  name: z.string().min(3, "Goal name must be at least 3 characters.").max(100, "Goal name is too long."),
  taskId: z.string().min(1, "You must select a task."),
  targetValue: z.preprocess(
    val => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number().positive("Target value must be a positive number.")
  ),
  dateRange: z.object({
    from: z.date({ required_error: "Start date is required." }),
    to: z.date({ required_error: "End date is required." }),
  }),
}).refine(data => {
  if (!data.dateRange.from || !data.dateRange.to) {
      return true;
  }
  return data.dateRange.to > data.dateRange.from
}, {
  message: "End date must be after the start date.",
  path: ["dateRange"],
});

type HighGoalFormData = z.infer<typeof highGoalFormSchema>;

export default function HighGoalsPage() {
  const { 
    taskDefinitions, 
    highGoals, 
    addHighGoal, 
    updateHighGoal, 
    deleteHighGoal,
    getHighGoalProgress,
    getTaskDefinitionById,
    getUserLevelInfo
  } = useUserRecords();
  const { toast } = useToast();
  const [editingGoal, setEditingGoal] = useState<HighGoal | null>(null);

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';
  
  const form = useForm<HighGoalFormData>({
    resolver: zodResolver(highGoalFormSchema),
    defaultValues: {
      name: '',
      taskId: undefined,
      targetValue: undefined,
      dateRange: { from: undefined, to: undefined },
    },
  });

  const handleSetEditing = (goal: HighGoal | null) => {
    setEditingGoal(goal);
    if (goal) {
      form.reset({
        name: goal.name,
        taskId: goal.taskId,
        targetValue: goal.targetValue,
        dateRange: {
          from: parseISO(goal.startDate),
          to: parseISO(goal.endDate),
        },
      });
    } else {
      form.reset({
        name: '',
        taskId: undefined,
        targetValue: undefined,
        dateRange: { from: undefined, to: undefined },
      });
    }
  };

  const onSubmit = (data: HighGoalFormData) => {
    const goalData = {
      name: data.name,
      taskId: data.taskId,
      targetValue: data.targetValue,
      startDate: data.dateRange.from.toISOString(),
      endDate: data.dateRange.to.toISOString(),
    };
    if (editingGoal) {
      updateHighGoal({ ...goalData, id: editingGoal.id });
      toast({ title: "High Goal Updated", description: `Your goal "${data.name}" has been saved.` });
    } else {
      addHighGoal(goalData);
      toast({ title: "High Goal Set!", description: `New goal "${data.name}" has been created.` });
    }
    handleSetEditing(null);
  };
  
  const getUnitLabelForTask = (taskId: string | undefined): string => {
    if (!taskId) return 'Value';
    const task = getTaskDefinitionById(taskId);
    if (!task || !task.unit) return 'Value';
    
    switch (task.unit) {
      case 'custom':
        return task.customUnitName || 'Value';
      case 'count':
      case 'generic':
        return ''; // No unit for simple counts
      default:
        // Capitalize first letter
        return task.unit.charAt(0).toUpperCase() + task.unit.slice(1);
    }
  }

  const watchedTaskId = form.watch('taskId');
  const unitLabel = getUnitLabelForTask(watchedTaskId);

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="w-full max-w-4xl mx-auto">
          <div className="p-6 md:p-0 pt-6">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <h3 className="text-lg font-medium">{editingGoal ? 'Edit High Goal' : 'Create New High Goal'}</h3>
                {editingGoal && (
                  <Button variant="outline" size="sm" onClick={() => handleSetEditing(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create New
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <Label htmlFor="goal-name">Goal Name</Label>
                    <Input id="goal-name" {...form.register('name')} className="mt-1" placeholder="e.g., Complete Q3 Project" />
                    {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                  <Label htmlFor="task">Task</Label>
                  <Controller name="taskId" control={form.control} render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="task" className="mt-1"><SelectValue placeholder="Select a task..." /></SelectTrigger>
                      <SelectContent>
                        {taskDefinitions.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )} />
                   {form.formState.errors.taskId && <p className="text-sm text-destructive mt-1">{form.formState.errors.taskId.message}</p>}
                </div>
                <div>
                    <Label htmlFor="target-value">Target {unitLabel && `(${unitLabel})`}</Label>
                    <Input id="target-value" type="number" {...form.register('targetValue')} className="mt-1" placeholder="e.g., 500" />
                    {form.formState.errors.targetValue && <p className="text-sm text-destructive mt-1">{form.formState.errors.targetValue.message}</p>}
                </div>
                <div>
                   <Label htmlFor="date-range">Date Range</Label>
                    <Controller name="dateRange" control={form.control} render={({ field }) => (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date-range" variant="outline" className={cn("w-full justify-start text-left font-normal mt-1", !field.value?.from && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {field.value?.from ? (
                                        field.value.to ? `${format(field.value.from, "LLL dd, y")} - ${format(field.value.to, "LLL dd, y")}` : format(field.value.from, "LLL dd, y")
                                    ) : (<span>Pick a date range</span>)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar mode="range" selected={field.value} onSelect={field.onChange} numberOfMonths={2} />
                            </PopoverContent>
                        </Popover>
                    )} />
                    {form.formState.errors.dateRange && <p className="text-sm text-destructive mt-1">{form.formState.errors.dateRange?.from?.message || form.formState.errors.dateRange?.to?.message || form.formState.errors.dateRange.message}</p>}
                </div>
              </div>
              
              <Button type="submit" className="w-full">{editingGoal ? 'Save Changes' : 'Create Goal'}</Button>
            </form>
          </div>
        </div>
        
        <div className="space-y-4 max-w-4xl mx-auto px-6 md:px-0">
          {highGoals.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              <p>No high goals set yet.</p>
              <p className="text-sm">Use the form above to create your first long-term objective.</p>
            </div>
          ) : (
            highGoals.map((goal, index) => {
              const task = getTaskDefinitionById(goal.taskId);
              const progress = getHighGoalProgress(goal);
              const percentage = Math.min((progress / goal.targetValue) * 100, 100);
              const unit = getUnitLabelForTask(goal.taskId);
              
              return (
                <div
                  key={goal.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <Card className="shadow-lg">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="flex items-center gap-2" style={{ color: task?.color }}>
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: task?.color }}></div>
                            {goal.name}
                          </CardTitle>
                          <CardDescription>Task: {task?.name || 'Unknown'} | Target: {goal.targetValue.toLocaleString()} {unit}</CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSetEditing(goal)}><Edit className="h-4 w-4" /></Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>This action will permanently delete your high goal "{goal.name}".</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteHighGoal(goal.id)}>Delete</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-2">
                          <Progress value={percentage} indicatorClassName="transition-all duration-500" style={{'--tw-bg-opacity': '1', backgroundColor: task?.color}} />
                          <div className="flex justify-between text-sm text-muted-foreground">
                              <span>{progress.toLocaleString()} / {goal.targetValue.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                              <span>{format(parseISO(goal.startDate), 'MMM d, yyyy')} - {format(parseISO(goal.endDate), 'MMM d, yyyy')}</span>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })
          )}
        </div>
      </main>
    </div>
  );
}
