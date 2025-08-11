
'use server';
import { ALLIANCE_DARES } from '@/lib/alliance-dares';

export async function generateAllianceDare(allianceName: string): Promise<string> {
  const randomIndex = Math.floor(Math.random() * ALLIANCE_DARES.length);
  return ALLIANCE_DARES[randomIndex];
}
