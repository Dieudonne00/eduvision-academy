import { requireAdmin } from "@/lib/auth";
import AdminNav from "./admin-nav";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }) {
  const { profile, user } = await requireAdmin();

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
        <AdminNav />
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
