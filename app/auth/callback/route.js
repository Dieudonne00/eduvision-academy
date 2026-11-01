import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Fallback for links using Supabase's default email template (?code=...).
// Our branded templates use /auth/confirm instead.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }

  const message = encodeURIComponent("That link is invalid or has expired. Please log in, or request a new link.");
  return NextResponse.redirect(`${origin}/login?error=${message}`);
}
