import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "./admin-nav";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }) {
  const { profile, user } = await requireAdmin();
  const supabase = await createClient();
  const { count: toReview } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted");

  return (
    <div className="admin">
      <aside className="admin-side">
        <div className="admin-who">
          <span className="admin-avatar">{(profile.full_name || user.email)[0].toUpperCase()}</span>
          <div>
            <strong>{profile.full_name || "Admin"}</strong>
            <small>{user.email}</small>
          </div>
        </div>
        <AdminNav toReview={toReview || 0} />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
