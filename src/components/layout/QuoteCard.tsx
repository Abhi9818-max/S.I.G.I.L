
'use client';

import React, { useState } from 'react';
import type { Quote } from '@/lib/quotes';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface QuoteCardProps {
  quote: Quote | null;
  onDownload: () => void;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote, onDownload }) => {
  const [clickCount, setClickCount] = useState(0);
  const { toast } = useToast();

  const handleClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount === 3) {
      toast({
        title: "Generating Image...",
        description: "Your quote card is being prepared for download.",
      });
      onDownload();
      setClickCount(0); // Reset after triggering
    }
  };

  if (!quote) {
    return (
      <div className="container mx-auto px-4 md:px-8 py-4">
        <div className="text-center italic text-muted-foreground p-4">
          <Skeleton className="h-5 w-3/4 mx-auto mb-2" />
          <Skeleton className="h-4 w-1/4 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-8 py-4 animate-fade-in-up cursor-pointer" onClick={handleClick}>
      <blockquote className="italic text-muted-foreground">
        <p className="text-lg text-center text-foreground/90">"{quote.text}"</p>
        <footer className="mt-2 text-sm text-right">— {quote.author}</footer>
      </blockquote>
    </div>
  );
};

export default QuoteCard;
