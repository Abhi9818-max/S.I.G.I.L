
"use client";

import React, { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useFriends } from '@/components/providers/FriendProvider';
import { useAuth } from '@/components/providers/AuthProvider';
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
import { useToast } from "@/hooks/use-toast";
import { Shield, PlusCircle, CalendarIcon, Users, ArrowRight, Swords, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TaskDefinition, Alliance } from '@/types';
import Link from 'next/link';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useRouter } from 'next/navigation';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Separator } from '@/components/ui/separator';


const allianceFormSchema = z.object({
  name: z.string().min(3, "Alliance name must be at least 3 characters.").max(50, "Alliance name is too long."),
  description: z.string().min(10, "Description must be at least 10 characters.").max(150, "Description is too long."),
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


export default function AlliancesPage() {
  const { user } = useAuth();
  const { taskDefinitions, getTaskDefinitionById } = useUserRecords();
  const { createAlliance, userAlliances, searchAlliances, sendAllianceChallenge } = useFriends();
  const { toast } = useToast();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Alliance[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const form = useForm<AllianceFormData>({
    resolver: zodResolver(allianceFormSchema),
    defaultValues: {
      name: '',
      description: '',
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
        router.push(`/alliances/${newAllianceId}`);
    } catch(e) {
        toast({ title: "Creation Failed", description: (e as Error).message, variant: 'destructive'});
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchAlliances(searchQuery);
      setSearchResults(results.filter(a => !userAlliances.some(ua => ua.id === a.id) && a.creatorId !== user?.uid));
    } catch (e) {
      toast({ title: "Search Failed", description: (e as Error).message, variant: 'destructive' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleChallenge = async (challengedAlliance: Alliance) => {
    // Find an alliance created by the current user to send the challenge from
    const myAlliance = userAlliances.find(a => a.creatorId === user?.uid);
    if (!myAlliance) {
      toast({ title: "No Alliance Found", description: "You must be the creator of an alliance to send challenges.", variant: "destructive" });
      return;
    }

    try {
      await sendAllianceChallenge(myAlliance, challengedAlliance);
      toast({ title: "Challenge Sent!", description: `Your challenge has been sent to ${challengedAlliance.name}.` });
    } catch (e) {
      toast({ title: "Challenge Failed", description: (e as Error).message, variant: 'destructive' });
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="form-alliance">
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-semibold">Form an Alliance</h1>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
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
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <Separator />
            
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <Swords className="h-6 w-6 text-primary" />
                  <h2 className="text-2xl font-semibold">Challenge an Alliance</h2>
              </div>
              <div className="flex gap-2">
                <Input 
                  placeholder="Search for an alliance by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isSearching}>
                  <Search className="h-4 w-4 mr-2" />
                  {isSearching ? 'Searching...' : 'Search'}
                </Button>
              </div>
              {searchResults.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Search Results</h3>
                  {searchResults.map(result => (
                    <Card key={result.id} className="p-3">
                       <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{result.name}</p>
                            <p className="text-xs text-muted-foreground">{result.memberIds.length} members</p>
                          </div>
                          <Button size="sm" onClick={() => handleChallenge(result)}>
                            <Swords className="h-4 w-4 mr-2"/>
                            Challenge
                          </Button>
                       </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

          </div>

           <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Your Alliances</h2>
              </div>
                {userAlliances.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">You are not part of any alliance.</p>
                ) : (
                    <ScrollArea className="h-[40vh] mt-4">
                        <div className="space-y-3 pr-4">
                            {userAlliances.map((alliance, index) => (
                                <div
                                  key={alliance.id}
                                  className="animate-fade-in-up"
                                  style={{ animationDelay: `${index * 50}ms` }}
                                >
                                  <Link href={`/alliances/${alliance.id}`}>
                                      <Card className="p-3 bg-card hover:bg-muted/50 transition-colors cursor-pointer">
                                        <CardHeader className="p-2">
                                           <div className="flex justify-between items-start">
                                                <div>
                                                    <CardTitle className="text-md flex items-center gap-2">
                                                        <Shield className="h-4 w-4" />
                                                        {alliance.name}
                                                    </CardTitle>
                                                    <CardDescription className="text-xs mt-1">{alliance.description}</CardDescription>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                           </div>
                                        </CardHeader>
                                      </Card>
                                  </Link>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>
      </main>
    </div>
  );
}
