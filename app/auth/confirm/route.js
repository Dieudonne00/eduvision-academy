import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

// Landing point for links in our emails (confirm sign-up, reset password).
// Uses token_hash so the link works even when opened on a different phone or browser.
//   /auth/confirm?token_hash=...&type=email&next=https://eduvisionacademy.com/checkout/english
export async function GET(request) {
  const url = new URL(request.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");

  // "next" may arrive as a full URL from the email template; keep only our own path
  let next = url.searchParams.get("next") || "/dashboard";
  try {
    const parsed = new URL(next, url.origin);
    next = parsed.origin === url.origin ? parsed.pathname + parsed.search : "/dashboard";
  } catch {
    next = "/dashboard";
  }
  next = safeNext(next);
  if (type === "recovery") next = "/reset-password";

  if (tokenHash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      const target = new URL(next, url.origin);
      if (type !== "recovery") target.searchParams.set("welcome", "1");
      return NextResponse.redirect(target);
    }
  }

  const message = encodeURIComponent("That link is invalid or has expired. Please log in, or request a new link.");
  return NextResponse.redirect(new URL(`/login?error=${message}`, url.origin));
}
