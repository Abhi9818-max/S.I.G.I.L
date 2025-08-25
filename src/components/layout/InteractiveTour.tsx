"use client";

import React, { useState, useEffect, useCallback, useMemo, RefObject } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type TourStep = {
  elementRef: RefObject<HTMLElement>;
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
};

interface InteractiveTourProps {
  isActive: boolean;
  onComplete: () => void;
  refs: { [key: string]: RefObject<HTMLElement> };
}

const tourStepsConfig = [
  {
    key: 'header',
    title: 'Your Level & Progress',
    content: "This is your current Level. Click it to see details about your tier and progress to the next level.",
    placement: 'bottom' as const,
  },
  {
    key: 'stats',
    title: 'Stats At a Glance',
    content: "Quickly see your recent activity, current streak, and consistency. These cards update as you add records.",
    placement: 'bottom' as const,
  },
  {
    key: 'calendar',
    title: 'Contribution Calendar',
    content: "Each square is a day. The more you accomplish, the brighter it glows. Double-click any day to log your progress.",
    placement: 'top' as const,
  },
  {
    key: 'pacts',
    title: 'Daily Pacts',
    content: "These are your daily promises. Check them off to build discipline. Fail, and you might face a dare!",
    placement: 'right' as const,
  },
  {
    key: 'charts',
    title: 'Deeper Insights',
    content: "Visualize your progress over time with these charts. They help you understand your habits.",
    placement: 'left' as const,
  },
] as const;

const InteractiveTour: React.FC<InteractiveTourProps> = ({ isActive, onComplete, refs }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const isMobile = useIsMobile();
  
  const steps: TourStep[] = useMemo(
    () =>
      tourStepsConfig
        .map(config => ({
          ...config,
          elementRef: refs[config.key],
        }))
        .filter(step => step.elementRef && step.elementRef.current),
    [refs]
  );

  const updateTargetRect = useCallback(() => {
    if (isActive && steps.length > 0 && steps[stepIndex]) {
      const currentRef = steps[stepIndex].elementRef;
      if (currentRef.current) {
        setTargetRect(currentRef.current.getBoundingClientRect());
      }
    } else {
      setTargetRect(null);
    }
  }, [isActive, stepIndex, steps]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [updateTargetRect]);

  const handleNext = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex(stepIndex - 1);
    }
  };

  if (!isActive || !targetRect) return null;

  const currentStep = steps[stepIndex];
  if (!currentStep) return null;

  const getPopoverPosition = () => {
    const popoverHeight = 150; // Estimated popover height
    const popoverWidth = 288; // w-72
    const gap = 16;
    let top = 0, left = 0;

    switch (currentStep.placement) {
      case 'top':
        top = targetRect.top - popoverHeight - gap;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        left = targetRect.left - popoverWidth - gap;
        break;
      case 'right':
        top = targetRect.top + targetRect.height / 2 - popoverHeight / 2;
        left = targetRect.right + gap;
        break;
      case 'bottom':
      default:
        top = targetRect.bottom + gap;
        left = targetRect.left + targetRect.width / 2 - popoverWidth / 2;
        break;
    }

    // Adjust if off-screen
    if (left < gap) left = gap;
    if (left + popoverWidth > window.innerWidth - gap) left = window.innerWidth - popoverWidth - gap;
    if (top < gap) top = gap;
    if (top + popoverHeight > window.innerHeight - gap) top = window.innerHeight - popoverHeight - gap;

    return { top, left };
  };

  const { top, left } = getPopoverPosition();

  const spotlightStyle: React.CSSProperties = {
    position: 'fixed',
    top: `${targetRect.top - 8}px`,
    left: `${targetRect.left - 8}px`,
    width: `${targetRect.width + 16}px`,
    height: `${targetRect.height + 16}px`,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.7)',
    borderRadius: '12px',
    transition: 'all 0.3s ease-in-out',
    pointerEvents: 'none',
    zIndex: 100,
  };

  return (
    <div className="fixed inset-0 z-50">
      <div style={spotlightStyle}></div>
      <div
        style={{ top, left }}
        className="fixed w-72 bg-card p-4 rounded-lg shadow-2xl z-[101] border border-primary/20 animate-fade-in"
      >
        <h3 className="font-bold text-lg mb-2">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground">{currentStep.content}</p>
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-muted-foreground">
            {stepIndex + 1} / {steps.length}
          </div>
          <div className="flex gap-2">
            {stepIndex > 0 && (
              <Button variant="ghost" size="sm" onClick={handlePrev}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Prev
              </Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {stepIndex === steps.length - 1 ? 'Finish' : 'Next'}
              {stepIndex < steps.length - 1 ? (
                <ArrowRight className="ml-1 h-4 w-4" />
              ) : (
                <CheckCircle className="ml-1 h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveTour;
