
'use server';
import { ALLIANCE_DARES } from '@/lib/alliance-dares';
import { DARES_18_PLUS } from '@/lib/dares-18-plus';
import { DARES_SERIOUS } from '@/lib/dares-serious';
import type { DareCategory } from '@/types';

const getDareList = (category: DareCategory = 'standard') => {
  switch (category) {
    case '18+':
      // Using 18+ dares as they are more group-oriented
      return DARES_18_PLUS;
    case 'serious':
      // Fallback to standard for now, as serious dares are individual
      return ALLIANCE_DARES;
    case 'standard':
    default:
      return ALLIANCE_DARES;
  }
}

export async function generateAllianceDare(allianceName: string, category: DareCategory = 'standard'): Promise<string> {
  const dareList = getDareList(category);
  const randomIndex = Math.floor(Math.random() * dareList.length);
  return dareList[randomIndex];
}
