import Link from "next/link";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/courses";
import { getPaymentSettings } from "@/lib/payments";

export default async function AdminOverview() {
  const supabase = await createClient();
  const count = (q) => q.then((r) => r.count ?? 0);

  const [students, toReview, active, chapters, approved, recent, settings] = await Promise.all([
    count(supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student")),
    count(supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted")),
    count(supabase.from("enrollments").select("user_id", { count: "exact", head: true }).eq("status", "active")),
    count(supabase.from("lessons").select("id", { count: "exact", head: true })),
    supabase.from("payments").select("amount").eq("status", "approved").then((r) => r.data || []),
    supabase
      .from("payments")
      .select("id, amount, currency, transaction_id, created_at, profiles!payments_user_id_fkey (full_name), courses (title)")
      .eq("status", "submitted")
      .order("created_at")
      .limit(5)
      .then((r) => r.data || []),
    getPaymentSettings(),
  ]);
  const revenue = approved.reduce((s, p) => s + Number(p.amount || 0), 0);

  const stats = [
    { label: "Payments to review", value: toReview, icon: "clock", href: "/admin/payments", highlight: toReview > 0 },
    { label: "Students", value: students, icon: "users", href: "/admin/students" },
    { label: "Active enrollments", value: active, icon: "checkCircle", href: "/admin/payments?tab=approved" },
    { label: "Revenue confirmed", value: formatPrice(revenue, "RWF") || "0 RWF", icon: "wallet", href: "/admin/payments?tab=approved", sub: `${chapters} chapters online` },
  ];

  return (
    <>
      <header className="admin-head">
        <h1>Overview</h1>
        <p className="muted">What&apos;s happening at EduVision Academy.</p>
      </header>

      {!settings.momo_pay_code && (
        <p className="error admin-flash">
          Students can&apos;t pay online yet: <Link href="/admin/settings">add your MoMo Pay code in Settings</Link>.
        </p>
      )}

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
          <h2>Waiting for your approval</h2>
          <Link href="/admin/payments">Open payments</Link>
        </div>
        {recent.length ? (
          <ul className="review-list">
            {recent.map((p) => (
              <li key={p.id}>
                <div>
                  <strong>{p.profiles?.full_name || "Student"}</strong>
                  <small>{p.courses?.title} · TxID {p.transaction_id}</small>
                </div>
                <strong>{formatPrice(p.amount, p.currency)}</strong>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">Nothing to review. New MoMo payments will appear here.</p>
        )}
      </section>
    </>
  );
}
