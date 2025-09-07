
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import Image from 'next/image';

const allianceImages = Array.from({ length: 21 }, (_, i) => `/alliances/alliance${i + 1}.jpeg`);

interface AllianceImageSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSelect: (url: string) => void;
  currentPhotoURL?: string | null;
}

const AllianceImageSelectionDialog: React.FC<AllianceImageSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  onSelect,
  currentPhotoURL,
}) => {
  const handleSelect = (url: string) => {
    onSelect(url);
    onOpenChange(false);
  };

  const renderImageGrid = (imageUrls: string[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
      {imageUrls.map((url) => {
        const isSelected = currentPhotoURL === url;
        return (
          <div key={url} className="relative">
            <button
              onClick={() => handleSelect(url)}
              className={cn(
                'w-full aspect-square rounded-lg overflow-hidden border-2 transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary/50'
                  : 'border-transparent hover:border-primary/50'
              )}
            >
              <Image src={url} alt={`Alliance emblem option`} fill className="object-cover" />
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Alliance Emblem</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh] md:h-[400px] mt-4">
          {renderImageGrid(allianceImages)}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default AllianceImageSelectionDialog;
