
"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define avatar number arrays directly here for categorization
const MALE_AVATAR_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
const FEMALE_AVATAR_NUMBERS = [13, 15, 16, 17, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53];

const MALE_AVATARS = MALE_AVATAR_NUMBERS.map(n => `/avatars/avatar${n}.jpeg`);
const FEMALE_AVATARS = FEMALE_AVATAR_NUMBERS.map(n => `/avatars/avatar${n}.jpeg`);

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

  const renderAvatarGrid = (avatarUrls: string[]) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 p-1">
      {avatarUrls.map((url) => {
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
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Your Avatar</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="male" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="male">Male</TabsTrigger>
            <TabsTrigger value="female">Female</TabsTrigger>
          </TabsList>
          <ScrollArea className="h-[60vh] md:h-[400px] mt-4">
            <TabsContent value="male">
                {renderAvatarGrid(MALE_AVATARS)}
            </TabsContent>
            <TabsContent value="female">
                {renderAvatarGrid(FEMALE_AVATARS)}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarSelectionDialog;
