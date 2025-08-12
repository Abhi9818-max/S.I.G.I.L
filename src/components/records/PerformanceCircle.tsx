
"use client";

import React from 'react';

interface PerformanceCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  progressColor?: string; // New optional prop for custom progress color
}

const PerformanceCircle: React.FC<PerformanceCircleProps> = ({
  percentage,
  size = 100,
  strokeWidth = 10,
  label,
  progressColor,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const arcColorClass = progressColor ? '' : 'text-primary';
  const arcColorStyle = progressColor ? { color: progressColor } : {};

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        {/* Background Track */}
        <circle
          className="text-muted/30" // Use Tailwind for muted color with opacity
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Arc */}
        <circle
          className={arcColorClass}
          style={arcColorStyle}
          stroke="currentColor"
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-foreground">
          {`${Math.round(percentage)}%`}
        </span>
        {label && <span className="text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  );
};

export default React.memo(PerformanceCircle);
