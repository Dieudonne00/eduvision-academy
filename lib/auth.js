import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns { user, profile } for the signed-in visitor, or null.
export async function getSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, role")
    .eq("id", user.id)
    .single();

  return { user, profile };
}

export async function requireUser(next = "/dashboard") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  return session;
}

export async function requireAdmin() {
  const session = await requireUser("/admin");
  if (session.profile?.role !== "admin") redirect("/dashboard");
  return session;
}
