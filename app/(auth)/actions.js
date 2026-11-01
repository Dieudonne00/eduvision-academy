"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";
import { safeNext } from "@/lib/safe-next";

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") || `https://${h.get("host")}`;
}

export async function signUp(_prev, formData) {
  const fullName = String(formData.get("full_name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const phone = normalizePhone(formData.get("phone"));
  const password = String(formData.get("password") || "");
  const next = safeNext(formData.get("next"));

  const values = { full_name: fullName, email, phone: String(formData.get("phone") || "") };
  if (!fullName || !email) return { error: "Please enter your name and email.", values };
  if (!phone) return { error: "Please enter a valid phone number, e.g. 0788 123 456.", values };
  if (password.length < 8) return { error: "Password must be at least 8 characters.", values };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, phone },
      // The confirmation email links back here, then on to where they were going
      emailRedirectTo: `${await siteOrigin()}${next}`,
    },
  });
  if (error) return { error: error.message, values };

  // Email confirmation on: no session yet, ask them to check their inbox
  if (!data.session) {
    return {
      message: `Almost done! We sent a confirmation link to ${email}. Open it to activate your account. Check your spam folder if you don't see it within a few minutes.`,
    };
  }
  redirect(next);
}

export async function signIn(_prev, formData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    let message = error.message;
    if (message === "Invalid login credentials") message = "Wrong email or password.";
    if (message === "Email not confirmed") message = "Please confirm your email first. Check your inbox for our link.";
    return { error: message, values: { email } };
  }
  redirect(safeNext(formData.get("next")));
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordReset(_prev, formData) {
  const email = String(formData.get("email") || "").trim();
  if (!email) return { error: "Please enter your email." };

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/reset-password`,
  });
  // Same answer whether or not the account exists, so emails can't be probed
  return { message: `If an account exists for ${email}, we've sent a link to reset your password.` };
}

export async function updatePassword(_prev, formData) {
  const password = String(formData.get("password") || "");
  const confirm = String(formData.get("confirm") || "");
  if (password.length < 8) return { error: "Password must be at least 8 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/dashboard?password=updated");
}
