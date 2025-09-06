
"use client";

import React, { useState } from 'react';
import Header from '@/components/layout/Header';
import { useUserRecords } from '@/components/providers/UserRecordsProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StickyNote, Trash2, PlusCircle, Search, X } from 'lucide-react';
import type { Note } from '@/types';
import { useAuth } from '@/components/providers/AuthProvider';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const NoteCard = ({ note, onDelete, index }: { note: Note; onDelete: (id: string) => void; index: number }) => {
  const imageNumber = (index % 29) + 1;
  const imageUrl = `/notes/notes${imageNumber}.jpeg`;

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    onDelete(note.id);
  };

  return (
    <Link href={`/notes/${note.id}`} passHref>
      <Card className="relative aspect-[4/5] w-full overflow-hidden rounded-lg group cursor-pointer note-card-glow">
          <Image 
              src={imageUrl}
              alt={`Note background for ${note.title}`}
              fill 
              className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex flex-col p-4 text-white">
              <div className="flex-grow flex justify-end">
                  <Button variant="ghost" size="icon" className="text-white/70 hover:text-white hover:bg-white/20 z-10" onClick={handleDeleteClick}>
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete note</span>
                  </Button>
              </div>
              <div className="text-shadow">
                  <h3 className="text-lg font-bold">{note.title}</h3>
              </div>
          </div>
      </Card>
    </Link>
  );
};


export default function NotesPage() {
  const { userData } = useAuth();
  const { addNote, deleteNote } = useUserRecords();
  const [title, setTitle] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const allNotes = userData?.notes || [];

  const filteredNotes = allNotes.filter(note => 
    note.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addNote({ title, content: '' }); 
      setTitle('');
      setShowForm(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-background">
      <Header onAddRecordClick={() => {}} onManageTasksClick={() => {}} />
      <main className="flex-grow container mx-auto p-4 md:p-8 space-y-8">
        <div className="flex items-center justify-between">
          {showSearch ? (
            <div className="w-full flex items-center gap-2 animate-fade-in">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes by title or content..."
                className="bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 flex-grow"
                autoFocus
              />
              <Button variant="ghost" size="icon" onClick={() => {setShowSearch(false); setSearchQuery('');}} aria-label="Close search">
                <X className="h-6 w-6"/>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowSearch(true)} aria-label="Search notes">
                  <Search className="h-6 w-6"/>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setShowForm(!showForm)} aria-label="Add new note">
                  <PlusCircle className="h-6 w-6"/>
                </Button>
              </div>
            </>
          )}
        </div>
        
        {showForm && !showSearch && (
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
          {filteredNotes.map((note, index) => (
            <div
              key={note.id}
            >
              <NoteCard note={note} onDelete={deleteNote} index={index} />
            </div>
          ))}
        </div>
        
        {filteredNotes.length === 0 && !showForm && (
          <div className="text-center text-muted-foreground py-10 col-span-full">
            <p>No notes found.</p>
            <p className="text-sm">{searchQuery ? 'Try a different search term.' : 'Click the plus icon to add your first note.'}</p>
          </div>
        )}
      </main>
    </div>
  );
}
