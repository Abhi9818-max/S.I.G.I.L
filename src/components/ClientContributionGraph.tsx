"use client";
import React from 'react';
import ContributionGraph from '@/components/records/ContributionGraph';

type DisplayMode = "full" | "current_month" | undefined;

type Props = {
  year: number;
  selectedTaskFilterId: string | null;
  records: any[];
  taskDefinitions: any[];
  displayMode?: DisplayMode;
};

export default function ClientContributionGraph({ 
  year, 
  selectedTaskFilterId, 
  records, 
  taskDefinitions, 
  displayMode = "full" 
}: Props) {
  const handleDayClick = () => {
    console.log('Day clicked');
  };

  const handleDayDoubleClick = () => {
    console.log('Day double clicked');
  };

  return (
    <ContributionGraph
      year={year}
      onDayClick={handleDayClick}
      onDayDoubleClick={handleDayDoubleClick}
      selectedTaskFilterId={selectedTaskFilterId}
      records={records}
      taskDefinitions={taskDefinitions}
      displayMode={displayMode}
    />
  );
}
