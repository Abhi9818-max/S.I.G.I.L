
"use client";

import React from 'react';
import { Quote } from '@/lib/quotes';
import { TrendingUp } from 'lucide-react';

interface QuoteDisplayCardProps {
  quote: Quote | null;
}

const QuoteDisplayCard: React.FC<QuoteDisplayCardProps> = ({ quote }) => {
  if (!quote) {
    return null;
  }

  return (
    <div className="w-[350px] h-[500px] bg-background rounded-2xl shadow-2xl p-6 flex flex-col justify-between font-sans border border-white/10">
      <header className="flex justify-between items-center text-white/50">
        <span>Quote of the Day</span>
        <TrendingUp className="h-5 w-5" />
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <blockquote className="text-center">
          <p className="text-2xl font-semibold text-white leading-tight">
            “{quote.text}”
          </p>
          <footer className="mt-4 text-lg text-white/70">— {quote.author}</footer>
        </blockquote>
      </main>
      
      <footer className="text-center">
        <p className="font-bold text-lg text-white/90">S.I.G.I.L.</p>
        <p className="text-xs text-white/50">System of Internal Growth</p>
      </footer>
    </div>
  );
};

export default QuoteDisplayCard;
