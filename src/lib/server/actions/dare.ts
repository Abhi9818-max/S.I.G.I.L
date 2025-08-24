
'use server';
import { DARES as STANDARD_DARES } from '@/lib/dares';
import { DARES_18_PLUS } from '@/lib/dares-18-plus';
import { DARES_SERIOUS } from '@/lib/dares-serious';
import type { DareCategory } from '@/types';

const getDareList = (category: DareCategory = 'standard') => {
  switch (category) {
    case '18+':
      return DARES_18_PLUS;
    case 'serious':
      return DARES_SERIOUS;
    case 'standard':
    default:
      return STANDARD_DARES;
  }
}

export async function generateDare(taskName: string, category: DareCategory = 'standard'): Promise<string> {
  const dareList = getDareList(category);
  const randomIndex = Math.floor(Math.random() * dareList.length);
  return dareList[randomIndex];
}
