import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

// Also checks that the database answers, so this tells us the whole stack is up.
export async function GET() {
  let database = "unreachable";
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/courses?select=id&limit=1`, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      cache: "no-store",
    });
    database = res.ok ? "ok" : `error ${res.status}`;
  } catch {}

  return Response.json({
    ok: true,
    service: "eduvision-academy",
    time: new Date().toISOString(),
    database,
    envVarsFromVercel: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  });
}
