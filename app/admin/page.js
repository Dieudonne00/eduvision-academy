import Link from "next/link";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import EnrollmentTable from "./enrollment-table";

export default async function AdminOverview() {
  const supabase = await createClient();
  const count = (q) => q.then((r) => r.count ?? 0);

  const [students, pending, active, courses, lessons, recent] = await Promise.all([
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student")),
    count(supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("status", "pending")),
    count(supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("status", "active")),
    count(supabase.from("courses").select("id", { count: "exact", head: true })),
    count(supabase.from("lessons").select("id", { count: "exact", head: true })),
    supabase
      .from("enrollments")
      .select("user_id, course_id, status, created_at, profiles (full_name, email, phone), courses (title, price, currency)")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5)
      .then((r) => r.data || []),
  ]);

  const stats = [
    { label: "Students", value: students, icon: "users", href: "/admin/students" },
    { label: "Awaiting payment", value: pending, icon: "clock", href: "/admin/enrollments", highlight: pending > 0 },
    { label: "Active enrollments", value: active, icon: "checkCircle", href: "/admin/enrollments?status=active" },
    { label: "Lessons", value: lessons, icon: "play", href: "/admin/courses", sub: `in ${courses} courses` },
  ];

  return (
    <>
      <header className="admin-head">
        <h1>Overview</h1>
        <p className="muted">What&apos;s happening at EduVision Academy.</p>
      </header>

      <div className="stat-grid">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className={`stat-card${s.highlight ? " highlight" : ""}`}>
            <span className="stat-icon"><Icon name={s.icon} size={20} /></span>
            <strong>{s.value}</strong>
            <span>{s.label}</span>
            {s.sub && <small>{s.sub}</small>}
          </Link>
        ))}
      </div>

      <section className="admin-card">
        <div className="admin-card-head">
          <h2>Waiting for payment</h2>
          <Link href="/admin/enrollments">See all</Link>
        </div>
        {recent.length ? (
          <EnrollmentTable rows={recent} returnTo="/admin" />
        ) : (
          <p className="muted">No one is waiting. New reservations will appear here.</p>
        )}
      </section>
    </>
  );
}
