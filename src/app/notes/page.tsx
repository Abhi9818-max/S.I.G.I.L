
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { StickyNote, Trash2, PlusCircle } from 'lucide-react';
import type { Note } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const NoteCard = ({ note, onDelete, index }: { note: Note; onDelete: (id: string) => void; index: number }) => {
  // Use a cycling index for the images, assuming a certain number of images exist.
  // This will cycle through notes1.jpeg, notes2.jpeg, etc.
  const imageNumber = (index % 10) + 1; // Assuming you have at least 10 images (notes1.jpeg to notes10.jpeg)
  const imageUrl = `/notes/notes${imageNumber}.jpeg`;

  return (
    <Card className="relative aspect-[4/5] w-full overflow-hidden rounded-lg group">
        <Image 
            src={imageUrl}
            alt={`Note background for ${note.title}`}
            fill 
            className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col p-4 text-white">
            <div className="flex-grow">
                <h3 className="text-lg font-bold text-shadow">{note.title}</h3>
            </div>
            <div className="flex justify-end">
                 <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/20" onClick={() => onDelete(note.id)}>
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete note</span>
                </Button>
            </div>
        </div>
    </Card>
  );
};


export default function NotesPage() {
  const { userData } = useAuth();
  const { addNote, deleteNote } = useUserRecords();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);

  const notes = userData?.notes || [];

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addNote({ title, content });
      setTitle('');
      setContent('');
      setShowForm(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-background">
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <StickyNote className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-semibold">Notes</h1>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setShowForm(!showForm)} aria-label="Add new note">
            <PlusCircle className="h-6 w-6"/>
          </Button>
        </div>
        
        {showForm && (
          <div className="w-full max-w-lg mx-auto animate-fade-in-up">
            <form onSubmit={handleAddNote} className="space-y-4 mb-8 p-4 border rounded-lg bg-card">
              <h2 className="text-lg font-semibold">Create a New Note</h2>
              <div>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Note Title"
                  className="bg-background"
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Note
              </Button>
            </form>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {notes.map((note, index) => (
            <div
              key={note.id}
            >
              <NoteCard note={note} onDelete={deleteNote} index={index} />
            </div>
          ))}
        </div>
        
        {notes.length === 0 && !showForm && (
          <div className="text-center text-muted-foreground py-10 col-span-full">
            <p>No notes yet.</p>
            <p className="text-sm">Click the plus icon to add your first note.</p>
          </div>
        )}
      </main>
    </div>
  );
}
