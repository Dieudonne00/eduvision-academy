"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./config";

// Supabase client for Client Components (runs in the browser).
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
}
