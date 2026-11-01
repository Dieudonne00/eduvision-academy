// Supabase project URL and publishable key.
// Both are public by design (they ship to the browser); data is protected by
// Row Level Security in the database. Environment variables override them.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://axslztfouboyqpwckfrr.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_9heJZFGxa53LS3ARe-8m7w_404sR6kP";
