
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useAlliance } from '@/components/providers/AllianceProvider';
import { useAuth } from '@/components/providers/AuthProvider';
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
import { useToast } from "@/hooks/use-toast";
import { Shield, PlusCircle, CalendarIcon, ArrowLeft, ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import Image from 'next/image';

const allianceFormSchema = z.object({
  name: z.string().min(3, "Alliance name must be at least 3 characters.").max(50, "Alliance name is too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(150, "Description is too long."),
  photoURL: z.string().min(1, "You must select an alliance image."),
  taskId: z.string().min(1, "You must select a task."),
  target: z.preprocess(
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

type AllianceFormData = z.infer<typeof allianceFormSchema>;

const allianceImages = Array.from({ length: 21 }, (_, i) => `/alliances/alliance${i + 1}.jpeg`);

export default function CreateAlliancePage() {
  const { user } = useAuth();
  const { taskDefinitions, getTaskDefinitionById } = useUserRecords();
  const { createAlliance } = useAlliance();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AllianceFormData>({
    resolver: zodResolver(allianceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      photoURL: '',
      taskId: undefined,
      target: undefined,
      dateRange: { from: new Date(), to: undefined },
    },
  });

  const onSubmit = async (data: AllianceFormData) => {
    if (!user) {
        toast({ title: 'Not Authenticated', description: 'You must be logged in to create an alliance.', variant: 'destructive'});
        return;
    }
    const task = getTaskDefinitionById(data.taskId);
    if (!task) {
        toast({ title: 'Invalid Task', description: 'The selected task could not be found.', variant: 'destructive'});
        return;
    }

    try {
        const allianceData = {
            name: data.name,
            description: data.description,
            photoURL: data.photoURL,
            taskId: data.taskId,
            taskName: task.name,
            taskColor: task.color,
            target: data.target,
            startDate: data.dateRange.from.toISOString(),
            endDate: data.dateRange.to.toISOString(),
        };
        const newAllianceId = await createAlliance(allianceData);
        toast({ title: "Alliance Formed!", description: `The alliance "${data.name}" has been created.` });
        form.reset();
        router.push(`/alliances`);
    } catch(e) {
        toast({ title: "Creation Failed", description: (e as Error).message, variant: 'destructive'});
    }
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
        return '';
      default:
        return task.unit.charAt(0).toUpperCase() + task.unit.slice(1);
    }
  }

  const watchedTaskId = form.watch('taskId');
  const unitLabel = getUnitLabelForTask(watchedTaskId);
  
  return (
    <div className={cn("min-h-screen flex flex-col")}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 animate-fade-in-up space-y-8">
        <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-semibold">Form an Alliance</h1>
            </div>
            <p className="text-muted-foreground mt-2">Create a new group objective for you and your friends to conquer.</p>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-6">
                <div>
                    <Label htmlFor="alliance-name">Alliance Name</Label>
                    <Input id="alliance-name" {...form.register('name')} className="mt-1" placeholder="e.g., The Midnight Runners" />
                    {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
                </div>
                <div>
                    <Label htmlFor="alliance-description">Description</Label>
                    <Input id="alliance-description" {...form.register('description')} className="mt-1" placeholder="A short mission statement for your alliance." />
                    {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
                </div>
                 <div>
                    <Label>Alliance Emblem</Label>
                    <Controller
                        name="photoURL"
                        control={form.control}
                        render={({ field }) => (
                            <ScrollArea className="h-48 w-full mt-1 rounded-md border p-2">
                                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                                    {allianceImages.map(img => (
                                        <button
                                            key={img}
                                            type="button"
                                            onClick={() => field.onChange(img)}
                                            className={cn(
                                                "relative aspect-square w-full rounded-md overflow-hidden border-2 transition-all",
                                                field.value === img ? "border-primary ring-2 ring-primary/50" : "border-transparent"
                                            )}
                                        >
                                            <Image src={img} alt={`Alliance image ${img}`} fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    />
                    {form.formState.errors.photoURL && <p className="text-sm text-destructive mt-1">{form.formState.errors.photoURL.message}</p>}
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="task">Shared Task</Label>
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
                  <Label htmlFor="target-value">Collective Target {unitLabel && `(${unitLabel})`}</Label>
                  <Input id="target-value" type="number" {...form.register('target')} className="mt-1" placeholder="e.g., 1000" />
                  {form.formState.errors.target && <p className="text-sm text-destructive mt-1">{form.formState.errors.target.message}</p>}
              </div>
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
                              <Calendar mode="range" selected={field.value} onSelect={field.onChange} numberOfMonths={2} disabled={(date) => date < new Date() || date > new Date(new Date().setFullYear(new Date().getFullYear() + 1))}/>
                          </PopoverContent>
                      </Popover>
                  )} />
                  {form.formState.errors.dateRange && <p className="text-sm text-destructive mt-1">{form.formState.errors.dateRange?.from?.message || form.formState.errors.dateRange?.to?.message || form.formState.errors.dateRange.message}</p>}
              </div>
            
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4"/>
              {form.formState.isSubmitting ? "Forming..." : "Form Alliance"}
            </Button>
          </form>
        </div>
      </main>
    </div>
  );
}
