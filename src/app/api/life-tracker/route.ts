// src/app/api/life-tracker/route.ts

// Allow ISR with revalidate to work with static HTML export
export const revalidate = 0;

export async function GET(request: Request) {
  return new Response("Life Tracker is alive!", {
    status: 200,
  });
}
