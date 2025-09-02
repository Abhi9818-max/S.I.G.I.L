
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { PlusCircle, StickyNote, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';

const NoteCard = ({ note, onDelete }: { note: Note, onDelete: (id: string) => void }) => {
  return (
    <Card className="flex flex-col h-full shadow-lg">
      <CardHeader>
        <CardTitle>{note.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
      </CardContent>
      <CardFooter>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(note.id)}>
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete note</span>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function NotesPage() {
  const { userData } = useAuth();
  const { addNote, deleteNote } = useUserRecords();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const notes = userData?.notes || [];

  const handleAddNote = () => {
    if (title.trim() && content.trim()) {
      addNote({ title, content });
      setTitle('');
      setContent('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Notes</h1>
        </div>
        
        <Card className="p-4">
          <div className="space-y-4">
            <Input 
              placeholder="Note Title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea 
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <Button onClick={handleAddNote} disabled={!title.trim() || !content.trim()}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          </div>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {notes.map((note) => (
            <div
              key={note.id}
              className="animate-fade-in-up"
            >
              <NoteCard note={note} onDelete={deleteNote} />
            </div>
          ))}
        </div>
        
        {notes.length === 0 && (
          <div className="text-center text-muted-foreground py-10">
            <p>No notes yet.</p>
            <p className="text-sm">Use the form above to add your first note.</p>
          </div>
        )}
      </main>
    </div>
  );
}
