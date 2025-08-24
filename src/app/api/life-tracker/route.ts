// src/app/api/life-tracker/route.ts

// Force dynamic runtime so this API is not statically exported
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return new Response("Life Tracker is alive!", {
    status: 200,
  });
}
