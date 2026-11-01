import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Landing point for links in Supabase emails (confirm sign-up, reset password).
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${safeNext}`);
  }

  const message = encodeURIComponent("That link is invalid or has expired. Please log in or sign up again.");
  return NextResponse.redirect(`${origin}/login?error=${message}`);
}
