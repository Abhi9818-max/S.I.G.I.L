
"use client";

import React from 'react';
import { Quote } from '@/lib/quotes';

interface QuoteDisplayCardProps {
  quote: Quote | null;
}

const QuoteDisplayCard: React.FC<QuoteDisplayCardProps> = ({ quote }) => {
  if (!quote) {
    return null;
  }

  return (
    <div className="w-[400px] h-[400px] bg-[#F5F5F3] p-6 flex flex-col justify-center items-center font-serif">
      <p className="text-xl text-center text-[#1C1C1C]">
        {quote.text}
      </p>
    </div>
  );
};

export default QuoteDisplayCard;
