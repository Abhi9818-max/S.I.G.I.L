
'use client';

import React from 'react';
import type { Quote } from '@/lib/quotes';
import { Skeleton } from '@/components/ui/skeleton';

interface QuoteCardProps {
  quote: Quote | null;
}

const QuoteCard: React.FC<QuoteCardProps> = ({ quote }) => {
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
    <div className="container mx-auto px-4 md:px-8 py-4 animate-fade-in-up">
      <blockquote className="italic text-muted-foreground">
        <p className="text-lg text-center text-foreground/90">"{quote.text}"</p>
        <footer className="mt-2 text-sm text-right">— {quote.author}</footer>
      </blockquote>
    </div>
  );
};

export default QuoteCard;
