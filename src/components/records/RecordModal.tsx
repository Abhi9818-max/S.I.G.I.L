
"use client";

import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Trash2, Pencil, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, isValid } from 'date-fns';
import type { RecordEntry } from '@/types';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const recordSchema = z.object({
  id: z.string().optional(), // For identifying which record to update
  date: z.date({ required_error: "Date is required." }),
  value: z.preprocess(
    (val) => (val === "" || val === undefined || val === null ? undefined : Number(val)),
    z.number({ invalid_type_error: "Record value must be a number." }).min(0, "Record value must be non-negative.")
  ),
  taskType: z.string().min(1, "Task type is required."),
  notes: z.string().optional(),
});

type RecordFormData = z.infer<typeof recordSchema>;

interface RecordModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedDate: string | null; // YYYY-MM-DD
  defaultTaskTypeId?: string | null;
}

const RecordModal: React.FC<RecordModalProps> = ({ 
  isOpen, 
  onOpenChange, 
  selectedDate, 
  defaultTaskTypeId 
}) => {
  const { 
    addRecord, 
    updateRecord, 
    deleteRecord, 
    getRecordsByDate, 
    taskDefinitions,
    getTaskDefinitionById,
  } = useUserRecords();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  const dailyRecords = selectedDate ? getRecordsByDate(selectedDate) : [];

  const form = useForm<RecordFormData>({
    resolver: zodResolver(recordSchema),
  });

  const resetAndPrepareForm = (record: RecordEntry | null = null) => {
    if (record) { // Editing an existing record
      setEditingRecordId(record.id);
      form.reset({
        id: record.id,
        date: selectedDate ? parseISO(selectedDate) : new Date(),
        value: record.value,
        taskType: record.taskType,
        notes: record.notes,
      });
    } else { // Preparing for a new record
      setEditingRecordId(null);
      form.reset({
        id: undefined,
        date: selectedDate ? parseISO(selectedDate) : new Date(),
        value: undefined,
        taskType: defaultTaskTypeId ?? taskDefinitions[0]?.id,
        notes: '',
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      resetAndPrepareForm(null); // Always start with the 'new record' form
    }
  }, [isOpen, selectedDate, defaultTaskTypeId]);

  const onSubmit = (data: RecordFormData) => {
    if (!selectedDate) return;

    const recordData = {
      date: format(data.date, 'yyyy-MM-dd'),
      value: data.value,
      taskType: data.taskType,
      notes: data.notes,
    };

    if (editingRecordId) {
      updateRecord({ ...recordData, id: editingRecordId });
      toast({ title: "Record Updated", description: `Record for ${recordData.date} updated.` });
    } else {
      addRecord(recordData);
      toast({ title: "Record Added", description: `New record for ${recordData.date} added.` });
    }
    resetAndPrepareForm(null); // Reset form for another new entry
  };

  const handleDelete = (recordId: string) => {
    setIsDeleting(recordId);
    deleteRecord(recordId);
    toast({ title: "Record Deleted", description: `Record deleted successfully.`, variant: "destructive" });
    setIsDeleting(null);
    if (editingRecordId === recordId) {
      resetAndPrepareForm(null);
    }
  };
  
  if (!isOpen) return null;

  const titleDate = selectedDate ? format(parseISO(selectedDate), 'MMMM d, yyyy') : 'New Record';
  
  const watchedTaskType = form.watch('taskType');
  const getUnitLabel = (taskId: string | undefined): string => {
    if (!taskId) return 'Record Value';
    const task = getTaskDefinitionById(taskId);
    if (!task || !task.unit) return 'Value';
    
    switch (task.unit) {
      case 'custom':
        return task.customUnitName || 'Value';
      case 'count':
      case 'generic':
        return 'Value';
      default:
        // Capitalize first letter
        return task.unit.charAt(0).toUpperCase() + task.unit.slice(1);
    }
  };

  const unitLabel = getUnitLabel(watchedTaskType);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Records for {titleDate}</DialogTitle>
          <DialogDescription>
            Manage all your records for this day. You can add multiple entries for different tasks.
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(100vh-250px)]">
          <div className="px-6 pb-4">
            {dailyRecords.length > 0 && (
              <>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Existing Records</h3>
                <div className="space-y-2 mb-4">
                  {dailyRecords.map((rec) => {
                    const task = rec.taskType ? getTaskDefinitionById(rec.taskType) : null;
                    return (
                      <div key={rec.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 rounded-full" style={{backgroundColor: task?.color ?? 'gray'}}/>
                           <span className="text-sm font-medium">{task?.name ?? 'Unassigned'}:</span>
                           <span className="text-sm">{rec.value}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => resetAndPrepareForm(rec)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                           <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:text-destructive" 
                              onClick={() => handleDelete(rec.id)}
                              disabled={isDeleting === rec.id}
                            >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
                <Separator />
              </>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">
                {editingRecordId ? "Editing Record" : "Add New Record"}
              </h3>
              
              <Controller
                  name="date"
                  control={form.control}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />

              <div>
                <Label htmlFor="value">{unitLabel}</Label>
                <Input
                  id="value"
                  type="number"
                  step="any"
                  className="mt-1"
                  {...form.register('value')}
                  placeholder="e.g., 5, 30, 1.5"
                />
                {form.formState.errors.value && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.value.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="taskType">Task Type</Label>
                <Controller
                  name="taskType"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value || ""} defaultValue={field.value || ""}>
                      <SelectTrigger className="w-full mt-1">
                        <SelectValue placeholder="Select a task type" />
                      </SelectTrigger>
                      <SelectContent>
                        {taskDefinitions.length === 0 && <SelectItem value="" disabled>No tasks defined</SelectItem>}
                        {taskDefinitions.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.taskType && (
                  <p className="text-sm text-destructive mt-1">{form.formState.errors.taskType.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  className="mt-1"
                  {...form.register('notes')}
                  placeholder="Add any relevant notes..."
                />
              </div>

              <DialogFooter className="sm:justify-end pt-2 sticky bottom-0 bg-background py-4">
                {editingRecordId && (
                  <Button type="button" variant="outline" onClick={() => resetAndPrepareForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                     New Record
                  </Button>
                )}
                <Button type="submit" disabled={form.formState.isSubmitting || taskDefinitions.length === 0}>
                  {form.formState.isSubmitting ? "Saving..." : (editingRecordId ? 'Save Changes' : 'Add Record')}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default RecordModal;
