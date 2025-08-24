"use client";
import React from 'react';
import Header from '@/components/layout/Header';

export default function ClientHeader() {
  const handleAddRecord = () => {
    // Add your record logic here
    console.log('Add record clicked');
  };

  const handleManageTasks = () => {
    // Add your manage tasks logic here
    console.log('Manage tasks clicked');
  };

  return <Header onAddRecordClick={handleAddRecord} onManageTasksClick={handleManageTasks} />;
}
