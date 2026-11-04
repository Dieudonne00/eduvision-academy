import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import EnrollmentTable from "../enrollment-table";
import Flash from "../flash";

const tabs = [
  { status: "pending", label: "Awaiting payment" },
  { status: "active", label: "Active" },
  { status: "cancelled", label: "Cancelled" },
];

export default async function EnrollmentsPage({ searchParams }) {
  const params = await searchParams;
  const status = tabs.some((t) => t.status === params.status) ? params.status : "pending";

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("enrollments")
    .select("user_id, course_id, status, created_at, profiles (full_name, email, phone), courses (title, price, currency)")
    .eq("status", status)
    .order("created_at", { ascending: false });

  return (
    <>
      <header className="admin-head">
        <h1>Payments</h1>
        <p className="muted">
          When a student has paid, click <strong>Confirm payment</strong>. The course unlocks for them immediately.
        </p>
      </header>

      <Flash saved={params.saved} error={params.error} />

      <div className="tabs">
        {tabs.map((t) => (
          <Link key={t.status} href={`/admin/enrollments?status=${t.status}`} className={t.status === status ? "active" : undefined}>
            {t.label}
          </Link>
        ))}
      </div>

      <section className="admin-card">
        {rows?.length ? (
          <EnrollmentTable rows={rows} returnTo={`/admin/enrollments?status=${status}`} />
        ) : (
          <p className="muted">Nothing here yet.</p>
        )}
      </section>
    </>
  );
}
