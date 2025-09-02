
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Button } from '@/components/ui/button';
import { StickyNote, Trash2, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Note } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';

const NoteCard = ({ note, onDelete }: { note: Note; onDelete: (id: string) => void }) => {
  return (
    <div className="bg-white dark:bg-card rounded-3xl shadow-lg overflow-hidden flex flex-col w-full max-w-sm mx-auto">
      <div className="relative h-56">
        <Image
          src={`https://picsum.photos/seed/${note.id}/600/400`}
          alt={note.title}
          fill
          className="object-cover"
          data-ai-hint="mountain landscape"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4 w-full flex justify-between items-end">
            <div>
                <h3 className="text-white text-xl font-bold">{note.title}</h3>
                <p className="text-white/80 text-sm">Silverpine Mountains</p>
            </div>
            <Button variant="secondary" size="sm" className="bg-white/90 text-black hover:bg-white">Start Route</Button>
        </div>
      </div>
      <div className="p-6 flex-grow">
          <h4 className="font-bold text-lg">Embercrest Summit Trail</h4>
          <p className="text-xs text-muted-foreground">1886 by Helen Rowe & Elias Mendez</p>
          <div className="flex justify-between items-center my-4">
              <div className="text-center">
                  <p className="font-bold text-lg">12.4km</p>
                  <p className="text-xs text-muted-foreground">Distance</p>
              </div>
               <div className="text-center">
                  <p className="font-bold text-lg">870m</p>
                  <p className="text-xs text-muted-foreground">Elevation</p>
              </div>
               <div className="text-center">
                  <p className="font-bold text-lg">4h 45m</p>
                  <p className="text-xs text-muted-foreground">Duration</p>
              </div>
               <div className="w-24 h-16 bg-muted rounded-lg flex items-center justify-center">
                  <svg width="60" height="30" viewBox="0 0 100 50" className="stroke-current text-muted-foreground/50" strokeWidth="3" fill="none">
                      <path d="M 0 40 C 10 50, 20 30, 30 40 S 50 60, 60 40 S 80 20, 90 30, 100 40, 100 40" />
                  </svg>
               </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {note.content}
          </p>
      </div>
      <div className="flex justify-between items-center p-4 border-t dark:border-border">
         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(note.id)}>
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete note</span>
        </Button>
        <Button variant="ghost" size="icon">
            <ChevronUp className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};


export default function NotesPage() {
  const { userData } = useAuth();
  const { addNote, deleteNote } = useUserRecords();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const notes = userData?.notes || [];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-background">
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center gap-2">
          <StickyNote className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Notes</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {notes.map((note) => (
            <div
              key={note.id}
            >
              <NoteCard note={note} onDelete={deleteNote} />
            </div>
          ))}
        </div>
        
        {notes.length === 0 && (
          <div className="text-center text-muted-foreground py-10 col-span-full">
            <p>No notes yet.</p>
            <p className="text-sm">Use the form above to add your first note.</p>
          </div>
        )}
      </main>
    </div>
  );
}
