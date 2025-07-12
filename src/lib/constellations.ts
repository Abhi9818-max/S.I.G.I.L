
import type { Constellation } from '@/types';
import { TASK_DEFINITIONS } from './config';

// Find default task definitions to link constellations
const workTask = TASK_DEFINITIONS.find(t => t.id === 'work')!;
const exerciseTask = TASK_DEFINITIONS.find(t => t.id === 'exercise')!;
const learningTask = TASK_DEFINITIONS.find(t => t.id === 'learning')!;

export const CONSTELLATIONS: Constellation[] = [
  {
    taskId: workTask.id,
    taskName: workTask.name,
    taskColor: workTask.color,
    nodes: [
      { id: 'work-1', name: 'Focused Start', description: 'Begin the journey of dedicated effort.', cost: 50 },
      { id: 'work-2', name: 'Deep Work Initiate', description: 'Unlock the ability to concentrate for extended periods.', cost: 150 },
      { id: 'work-3', name: 'Productivity Spark', description: 'A glimmer of true efficiency.', cost: 300 },
      { id: 'work-4', name: 'Overtime Resilience', description: 'Pushing beyond the normal limits.', cost: 500 },
      { id: 'work-5', name: 'Flow State', description: 'The pinnacle of focus, where work becomes effortless.', cost: 1000 },
    ]
  },
  {
    taskId: exerciseTask.id,
    taskName: exerciseTask.name,
    taskColor: exerciseTask.color,
    nodes: [
      { id: 'exercise-1', name: 'First Step', description: 'The journey of a thousand miles begins with a single step.', cost: 50 },
      { id: 'exercise-2', name: 'Endurance I', description: 'Conditioning the body for longer trials.', cost: 150 },
      { id: 'exercise-3', name: 'Strength I', description: 'The foundation of physical power.', cost: 300 },
      { id: 'exercise-4', name: 'Endurance II', description: 'Pushing past previous limits of stamina.', cost: 500 },
      { id: 'exercise-5', name: 'Peak Physique', description: 'Mastery over one\'s own physical form.', cost: 1000 },
    ]
  },
    {
    taskId: learningTask.id,
    taskName: learningTask.name,
    taskColor: learningTask.color,
    nodes: [
      { id: 'learning-1', name: 'Open Mind', description: 'The first step to knowledge is admitting you know nothing.', cost: 50 },
      { id: 'learning-2', name: 'Curious Mind', description: 'Actively seeking new information and perspectives.', cost: 150 },
      { id: 'learning-3', name: 'Studious Habit', description: 'Building the discipline of regular learning.', cost: 300 },
      { id: 'learning-4', name: 'Knowledge Synthesis', description: 'Connecting disparate ideas into a coherent whole.', cost: 500 },
      { id: 'learning-5', name: 'Sage-like Wisdom', description: 'A deep and profound understanding.', cost: 1000 },
    ]
  },
];
