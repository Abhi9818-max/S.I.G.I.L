
'use server';
import { DARES } from '@/lib/dares';

export async function generateDare(taskName: string): Promise<string> {
  const randomIndex = Math.floor(Math.random() * DARES.length);
  return DARES[randomIndex];
}
