export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({
    ok: true,
    service: "eduvision-academy",
    time: new Date().toISOString(),
    // Only reports whether settings exist, never their values
    supabaseConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  });
}
