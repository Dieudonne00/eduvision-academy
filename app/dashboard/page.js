import { requireUser } from "@/lib/auth";

export const metadata = { title: "My learning · EduVision Academy" };

export default async function DashboardPage() {
  const { user, profile } = await requireUser("/dashboard");
  const name = profile?.full_name || user.email;

  return (
    <main className="page">
      <h1>Hi, {name} 👋</h1>
      <p className="muted">Your courses will appear here once you enroll.</p>
    </main>
  );
}
