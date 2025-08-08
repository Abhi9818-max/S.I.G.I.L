
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

// Generate paths for avatars from avatar1.jpeg to avatar12.jpeg
const ORIGINAL_AVATARS = Array.from(
  { length: 12 },
  (_, i) => `/avatars/avatar${i + 1}.jpeg`
);

// Generate paths for avatars from avatar1.png to avatar20.png in a different directory
const NEW_AVATARS = Array.from(
  { length: 20 },
  (_, i) => `/images/avatars/avatar${i + 1}.png`
);

const PREDEFINED_AVATARS = [...ORIGINAL_AVATARS, ...NEW_AVATARS];


interface AvatarSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (url: string) => void;
  currentAvatar?: string | null;
}

const AvatarSelectionDialog: React.FC<AvatarSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  onSelect,
  currentAvatar,
}) => {
  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
          <DialogDescription>
            Select a new profile picture from the gallery.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] md:h-[400px]">
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
            {PREDEFINED_AVATARS.map((url) => {
                const isSelected = currentAvatar === url;
                return (
                <div key={url} className="relative">
                    <button
                    onClick={() => handleSelect(url)}
                    className={cn(
                        'w-full aspect-square rounded-full overflow-hidden border-2 transition-all',
                        isSelected
                        ? 'border-primary ring-2 ring-primary/50'
                        : 'border-transparent hover:border-primary/50'
                    )}
                    >
                    <Avatar className="w-full h-full">
                        <AvatarImage src={url} alt={`Avatar option`} />
                        <AvatarFallback>?</AvatarFallback>
                    </Avatar>
                    </button>
                    {isSelected && (
                    <div className="absolute -bottom-1 -right-1 bg-background/70 rounded-full pointer-events-none">
                        <CheckCircle className="h-6 w-6 text-primary" />
                    </div>
                    )}
                </div>
                );
            })}
            </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelectionDialog;
