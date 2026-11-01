import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Admin · EduVision Academy" };

export default async function AdminPage() {
  const { profile } = await requireAdmin();

  return (
    <main className="page">
      <h1>Admin</h1>
      <p className="muted">Signed in as {profile.full_name || "admin"}. Course management is coming next.</p>
    </main>
  );
}
