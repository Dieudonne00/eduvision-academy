import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/courses";
import { reviewPayment } from "../actions";
import EnrollmentTable from "../enrollment-table";
import Flash from "../flash";

const tabs = [
  { key: "submitted", label: "To review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "waiting", label: "Reserved, not paid" },
];

const when = (d) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const wa = (phone) => `https://wa.me/${String(phone || "").replace(/\D/g, "")}`;

export default async function PaymentsPage({ searchParams }) {
  const params = await searchParams;
  const tab = tabs.some((t) => t.key === params.tab) ? params.tab : "submitted";
  const here = `/admin/payments?tab=${tab}`;
  const supabase = await createClient();

  const { count: toReview } = await supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "submitted");

  let content;
  if (tab === "waiting") {
    // Reservations with no payment sent yet (or a rejected one): follow up, or activate by hand for cash payments
    const [{ data: rows }, { data: open }] = await Promise.all([
      supabase
        .from("enrollments")
        .select("user_id, course_id, status, created_at, profiles (full_name, email, phone), courses (title, price, currency)")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase.from("payments").select("user_id, course_id").eq("status", "submitted"),
    ]);
    const reviewing = new Set((open || []).map((p) => `${p.user_id}:${p.course_id}`));
    const waiting = (rows || []).filter((r) => !reviewing.has(`${r.user_id}:${r.course_id}`));
    content = waiting.length ? (
      <>
        <p className="muted small">Students who reserved a course but haven&apos;t sent a MoMo payment. If someone paid in cash, use <strong>Activate</strong>.</p>
        <EnrollmentTable rows={waiting} returnTo={here} />
      </>
    ) : <p className="muted">No one is waiting.</p>;
  } else {
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, currency, payer_phone, payer_name, transaction_id, status, admin_note, created_at, reviewed_at, profiles!payments_user_id_fkey (full_name, email, phone), courses (title, price, currency)")
      .eq("status", tab)
      .order("created_at", { ascending: tab === "submitted" });

    content = payments?.length ? (
      <div className="pay-cards">
        {payments.map((p) => {
          const student = p.profiles || {};
          const mismatch = p.courses?.price != null && Number(p.amount) !== Number(p.courses.price);
          return (
            <article key={p.id} className={`pay-card ${p.status}`}>
              <div className="pay-card-top">
                <div>
                  <strong className="pay-amount">{formatPrice(p.amount, p.currency)}</strong>
                  <span className="muted small"> · {p.courses?.title}</span>
                </div>
                <small className="muted">{when(p.created_at)}</small>
              </div>

              <dl className="pay-details">
                <div><dt>Transaction ID</dt><dd className="txid">{p.transaction_id}</dd></div>
                <div><dt>Paid from</dt><dd>{p.payer_phone} · <a href={wa(p.payer_phone)} target="_blank" rel="noopener">WhatsApp</a></dd></div>
                <div><dt>Student</dt><dd>{student.full_name || "No name"}<small>{student.email}</small></dd></div>
                {p.payer_name && <div><dt>Name on MoMo</dt><dd>{p.payer_name}</dd></div>}
              </dl>
              {mismatch && <p className="error small">The course price has changed since this payment (now {formatPrice(p.courses.price, p.courses.currency)}).</p>}

              {p.status === "submitted" ? (
                <div className="pay-review">
                  <p className="small muted">Check your MoMo merchant account for this transaction ID and amount, then:</p>
                  <div className="pay-buttons">
                    <form action={reviewPayment}>
                      <input type="hidden" name="payment_id" value={p.id} />
                      <input type="hidden" name="decision" value="approve" />
                      <input type="hidden" name="return_to" value={here} />
                      <button type="submit" className="btn btn-approve">✓ Approve &amp; unlock course</button>
                    </form>
                    <details className="reject-box">
                      <summary className="btn btn-ghost">✕ Reject</summary>
                      <form action={reviewPayment} className="reject-form">
                        <input type="hidden" name="payment_id" value={p.id} />
                        <input type="hidden" name="decision" value="reject" />
                        <input type="hidden" name="return_to" value={here} />
                        <input name="note" placeholder="Reason, e.g. No payment found with this transaction ID" required />
                        <button type="submit" className="btn btn-danger btn-sm">Send rejection</button>
                      </form>
                    </details>
                  </div>
                </div>
              ) : (
                <p className="small muted">
                  {p.status === "approved" ? "✓ Approved" : "✕ Rejected"} {p.reviewed_at && when(p.reviewed_at)}
                  {p.admin_note && <> · <em className="note">{p.admin_note}</em></>}
                </p>
              )}
            </article>
          );
        })}
      </div>
    ) : (
      <p className="muted">{tab === "submitted" ? "No payments waiting for review. 🎉" : "Nothing here yet."}</p>
    );
  }

  return (
    <>
      <header className="admin-head">
        <h1>Payments</h1>
        <p className="muted">Students pay with your MoMo Pay code and send the transaction ID. Check it in your MoMo account, then approve.</p>
      </header>

      <Flash saved={params.saved} error={params.error} />

      <div className="tabs">
        {tabs.map((t) => (
          <Link key={t.key} href={`/admin/payments?tab=${t.key}`} className={t.key === tab ? "active" : undefined}>
            {t.label}{t.key === "submitted" && toReview ? <span className="tab-count">{toReview}</span> : null}
          </Link>
        ))}
      </div>

      <section className="admin-card">{content}</section>
    </>
  );
}
