
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import Header from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, Trash2, Edit, X } from 'lucide-react';
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

const ClientNotePage = ({ noteId }: { noteId: string }) => {
  const router = useRouter();
  const { getNoteById, updateNote, deleteNote, getUserLevelInfo } = useUserRecords();
  const { toast } = useToast();

  const [note, setNote] = useState<Note | null | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const resetState = useCallback((noteToSet: Note | null | undefined) => {
    if (noteToSet) {
      setTitle(noteToSet.title);
      setContent(noteToSet.content);
    }
  }, []);

  useEffect(() => {
    const foundNote = getNoteById(noteId);
    setNote(foundNote);
    resetState(foundNote);
  }, [noteId, getNoteById, resetState]);

  const handleSave = () => {
    if (note) {
      updateNote({ ...note, title, content });
      toast({
        title: 'Note Saved',
        description: 'Your changes have been saved successfully.',
      });
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    resetState(note);
    setIsEditing(false);
  }

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
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-6 flex flex-col">
        <div className="max-w-3xl mx-auto space-y-4 flex-grow w-full">
          {isEditing ? (
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note Title"
              className="text-2xl font-bold h-12 bg-transparent border-0 border-b-2 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 focus:border-primary transition-colors"
            />
          ) : (
            <h1 className="text-2xl font-bold h-12 py-2 border-b-2 border-transparent">{title}</h1>
          )}
          {isEditing ? (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Your thoughts here..."
              className="min-h-[60vh] bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              rows={20}
            />
          ) : (
             <div className="min-h-[60vh] py-2 whitespace-pre-wrap">{content || <p className="text-muted-foreground italic">No content yet. Click edit to start writing.</p>}</div>
          )}
        </div>
      </main>
       <footer className="sticky bottom-0 bg-background/80 backdrop-blur-sm border-t py-2">
            <div className="container mx-auto flex items-center justify-end">
                <div className="flex items-center gap-2">
                    {isEditing ? (
                    <>
                        <Button variant="ghost" onClick={handleCancelEdit}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                        </Button>
                        <Button onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" /> Save
                        </Button>
                    </>
                    ) : (
                    <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="mr-2 h-4 w-4" /> Edit
                        </Button>
                    )}
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon" className="h-10 w-10">
                        <Trash2 className="h-4 w-4" />
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
                </div>
            </div>
       </footer>
    </div>
  );
};

export default ClientNotePage;
