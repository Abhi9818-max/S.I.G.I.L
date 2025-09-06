"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import type { Note } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
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
import { Trash2 } from 'lucide-react';

const ClientNotePage = ({ noteId }: { noteId: string }) => {
  const router = useRouter();
  const { getNoteById, updateNote, deleteNote, getUserLevelInfo } = useUserRecords();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    const foundNote = getNoteById(noteId);
    setNote(foundNote);
    if (foundNote) {
      setTitle(foundNote.title);
      setContent(foundNote.content);
    }
  }, [noteId, getNoteById]);

  const handleSave = () => {
    if (note) {
      updateNote({ ...note, title, content });
      toast({
        title: 'Note Saved',
        description: 'Your changes have been saved successfully.',
      });
    }
  };
  
  const handleDelete = () => {
      if (note) {
        deleteNote(note.id);
        toast({
          title: 'Note Deleted',
          description: 'The note has been permanently deleted.',
          variant: 'destructive',
        });
        router.push('/notes');
      }
  };

  const levelInfo = getUserLevelInfo();
  const pageTierClass = levelInfo ? `page-tier-group-${levelInfo.tierGroup}` : 'page-tier-group-1';

  if (note === undefined) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (note === null) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold">Note Not Found</h1>
        <Button onClick={() => router.push('/notes')} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Notes
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("min-h-screen flex flex-col", pageTierClass)}>
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => router.push('/notes')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Notes
          </Button>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your note.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save
            </Button>
          </div>
        </div>
        <div className="max-w-3xl mx-auto space-y-4">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            className="text-2xl font-bold h-12 bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors"
          />
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Your thoughts here..."
            className="min-h-[60vh] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            rows={20}
          />
        </div>
      </main>
    </div>
  );
};

export default ClientNotePage;
