import type { Achievement } from '@/types';
import {
  Gem,
  Swords,
  Zap,
  Star,
  BookOpen,
  Crown,
  Sparkles,
  Award as AwardIcon,
  BookUser,
  BrainCircuit,
  Dumbbell,
} from 'lucide-react';

export const ACHIEVEMENTS: Achievement[] = [
  // Level Achievements
  {
    id: 'level-10',
    name: 'Vowbreaker',
    description: 'Reach Level 10 and enter the Vowbreakers tier.',
    category: 'level',
    icon: Swords,
    check: ({ levelInfo }) => levelInfo.currentLevel >= 10,
  },
  {
    id: 'level-25',
    name: 'Silent Name',
    description: 'Reach Level 25, a whisper in the void.',
    category: 'level',
    icon: Gem,
    check: ({ levelInfo }) => levelInfo.currentLevel >= 25,
  },
  {
    id: 'level-50',
    name: 'Ancient Kin',
    description: 'Reach Level 50 and join the ranks of the ancients.',
    category: 'level',
    icon: Crown,
    check: ({ levelInfo }) => levelInfo.currentLevel >= 50,
  },
  {
    id: 'level-100',
    name: 'Final Form',
    description: 'Reach the pinnacle, Level 100. You are Endborne.',
    category: 'level',
    icon: AwardIcon,
    check: ({ levelInfo }) => levelInfo.isMaxLevel,
  },

  // Streak Achievements
  {
    id: 'streak-7',
    name: 'Week of Will',
    description: 'Maintain any streak for 7 consecutive days.',
    category: 'streak',
    icon: Zap,
    check: ({ streaks }) => Object.values(streaks).some((s) => s >= 7),
  },
  {
    id: 'streak-30',
    name: 'Month of Iron',
    description: 'Maintain any streak for 30 consecutive days.',
    category: 'streak',
    icon: Zap,
    check: ({ streaks }) => Object.values(streaks).some((s) => s >= 30),
  },

  // Skill / Constellation Achievements
  {
    id: 'skill-1',
    name: 'First Spark',
    description: 'Unlock your first skill node in any constellation.',
    category: 'skills',
    icon: Sparkles,
    check: ({ unlockedSkillCount }) => unlockedSkillCount >= 1,
  },
  {
    id: 'skill-5',
    name: 'Adept',
    description: 'Unlock 5 total skill nodes.',
    category: 'skills',
    icon: Star,
    check: ({ unlockedSkillCount }) => unlockedSkillCount >= 5,
  },

  // Creation / AI Achievements
  {
    id: 'lore-1',
    name: 'First Chapter',
    description: 'Generate your first lore entry.',
    category: 'creation',
    icon: BookOpen,
    check: ({ loreEntryCount }) => loreEntryCount >= 1,
  },
  {
    id: 'lore-5',
    name: 'Lorekeeper',
    description: 'Generate 5 lore entries.',
    category: 'creation',
    icon: BookOpen,
    isSecret: true,
    check: ({ loreEntryCount }) => loreEntryCount >= 5,
  },
  
  // Titles
  {
    id: 'title-scholar',
    name: 'Scholar',
    description: 'Log over 1,000 pages read.',
    category: 'title',
    icon: BookUser,
    isTitle: true,
    check: ({ getAggregateSumForTask }) => getAggregateSumForTask('reading') >= 1000,
  },
  {
    id: 'title-initiate',
    name: 'Initiate',
    description: 'Log over 100 hours of learning.',
    category: 'title',
    icon: BrainCircuit,
    isTitle: true,
    check: ({ getAggregateSumForTask }) => getAggregateSumForTask('learning') >= 100,
  },
  {
    id: 'title-athlete',
    name: 'Athlete',
    description: 'Log over 100 hours of exercise.',
    category: 'title',
    icon: Dumbbell,
    isTitle: true,
    check: ({ getAggregateSumForTask }) => getAggregateSumForTask('exercise') >= 100,
  },
];
