
"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Image from 'next/image';

const tourSteps = [
  {
    title: 'Welcome to S.I.G.I.L.',
    description: "Your journey of self-mastery begins now. Let's take a quick look at the core features that will help you track your growth.",
    image: '/tour/welcome.png'
  },
  {
    title: 'The Contribution Calendar',
    description: "This is your personal history. Like GitHub's graph, each square represents a day. The more you accomplish, the brighter it glows. Double-click any day to add or view records.",
    image: '/tour/calendar.png'
  },
  {
    title: 'Pacts & Tasks',
    description: "Create 'Pacts'—your daily to-do list. Each pact is a promise. Fulfill them to build discipline. Log your efforts against 'Tasks' like 'Work' or 'Exercise' to fuel your progress.",
    image: '/tour/tasks.png'
  },
  {
    title: 'Level Up Your Life',
    description: "Completing tasks and pacts earns you XP, raising your Level. As you advance, you'll unlock new Tiers, Titles, and Skills in the Constellations.",
    image: '/tour/levels.png'
  },
  {
    title: 'Alliances & Friends',
    description: "You are not alone. Connect with friends, view their progress, and form Alliances to conquer shared goals together. Your strength is multiplied.",
    image: '/tour/alliances.png'
  },
];

const LOCAL_STORAGE_KEY_TOUR_SEEN = 'sigil-tour-seen';

export default function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Only run on the client
    const tourStatus = localStorage.getItem(LOCAL_STORAGE_KEY_TOUR_SEEN);
    if (tourStatus === 'pending') {
      setIsOpen(true);
    }
  }, []);

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(prev => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY_TOUR_SEEN, 'true');
    setIsOpen(false);
  };
  
  if (!isOpen) {
      return null;
  }

  const currentStep = tourSteps[step];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleFinish(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{currentStep.title}</DialogTitle>
           <DialogDescription className="text-center min-h-[60px]">{currentStep.description}</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center items-center my-4">
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                <Image src={currentStep.image} alt={currentStep.title} layout="fill" objectFit="cover" />
            </div>
        </div>
        <div className="flex items-center justify-center space-x-2 my-4">
            {tourSteps.map((_, index) => (
                <div key={index} className={`h-2 w-2 rounded-full transition-all ${index === step ? 'bg-primary w-4' : 'bg-muted'}`} />
            ))}
        </div>
        <DialogFooter className="sm:justify-between">
          {step > 0 ? (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          ) : <div />}
          <Button onClick={handleNext}>
            {step === tourSteps.length - 1 ? 'Finish' : 'Next'}
            {step < tourSteps.length - 1 ? <ArrowRight className="ml-2 h-4 w-4" /> : <CheckCircle className="ml-2 h-4 w-4" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
