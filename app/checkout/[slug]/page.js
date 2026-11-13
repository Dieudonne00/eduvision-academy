import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Icon, { WhatsAppIcon } from "@/app/_components/icon";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { withDisplay, formatPrice } from "@/lib/courses";
import { getPaymentSettings, latestPayments, momoUssd, momoDialHref } from "@/lib/payments";
import { site } from "@/lib/site";
import { reserveCourse } from "../actions";
import PaymentForm from "../payment-form";
import CopyButton from "../copy-button";

export const metadata = { title: "Enroll" };

export default async function CheckoutPage({ params, searchParams }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { user, profile } = await requireUser(`/checkout/${slug}`);

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("courses")
    .select("id, slug, title, description, category, icon, accent, cover_url, price, currency")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) notFound();
  const course = withDisplay(row);

  const [{ data: enrollment }, settings, payments] = await Promise.all([
    supabase.from("enrollments").select("status").eq("course_id", course.id).eq("user_id", user.id).maybeSingle(),
    getPaymentSettings(),
    latestPayments(supabase, user.id, [course.id]),
  ]);
  const payment = payments[course.id];
  const price = formatPrice(course.price, course.currency);
  const isPaid = course.price !== null && Number(course.price) > 0;
  const code = settings.momo_pay_code;
  const ussd = isPaid && code ? momoUssd(code, course.price) : null;

  const whatsappText = encodeURIComponent(
    `Hello EduVision Academy, I'd like to pay for the ${course.title} course. My name is ${profile?.full_name || ""}.`
  );

  let body;
  if (enrollment?.status === "active") {
    body = (
      <div className="status-box success">
        <Icon name="checkCircle" size={28} />
        <div><h3>You&apos;re enrolled</h3><p>Your course is ready. Enjoy learning!</p></div>
        <Link href={`/learn/${course.slug}`} className="btn btn-primary">Start learning</Link>
      </div>
    );
  } else if (payment?.status === "submitted") {
    body = (
      <div className="status-box pending">
        <Icon name="clock" size={28} />
        <div>
          <h3>We&apos;re checking your payment</h3>
          <p>
            Transaction <strong>{payment.transaction_id}</strong> · {formatPrice(payment.amount, payment.currency)}.
            Your course unlocks as soon as we confirm it, usually within a few hours.
          </p>
        </div>
      </div>
    );
  } else if (course.price !== null && Number(course.price) === 0) {
    body = (
      <form action={reserveCourse} className="checkout-actions">
        <input type="hidden" name="course_id" value={course.id} />
        <input type="hidden" name="slug" value={course.slug} />
        <button type="submit" className="btn btn-primary btn-lg">Start this free course →</button>
      </form>
    );
  } else if (!isPaid || !code) {
    body = (
      <>
        <p className="pay-note">
          {!isPaid ? "The fee for this course will be confirmed by our team." : "Online payment details are being set up."}{" "}
          Reserve your place and we&apos;ll contact you on {profile?.phone || "your phone"}, or message us on WhatsApp.
        </p>
        <div className="checkout-actions">
          {!enrollment && (
            <form action={reserveCourse}>
              <input type="hidden" name="course_id" value={course.id} />
              <input type="hidden" name="slug" value={course.slug} />
              <button type="submit" className="btn btn-primary btn-lg">Reserve my place</button>
            </form>
          )}
          <a href={`${site.whatsappHref}?text=${whatsappText}`} target="_blank" rel="noopener" className="btn btn-ghost btn-lg">
            <WhatsAppIcon size={20} /> WhatsApp us
          </a>
        </div>
      </>
    );
  } else {
    body = (
      <>
        {payment?.status === "rejected" && (
          <div className="status-box rejected">
            <Icon name="close" size={26} />
            <div>
              <h3>We couldn&apos;t confirm your last payment</h3>
              <p><strong>Reason:</strong> {payment.admin_note}</p>
              <p className="small">Fix the details below and send them again, or WhatsApp us if you need help.</p>
            </div>
          </div>
        )}

        <h2 className="checkout-step"><span>1</span> Pay with MTN MoMo</h2>
        <div className="momo-box">
          <div className="momo-rows">
            <div><small>MoMo Pay code</small><strong className="momo-code">{code}</strong></div>
            <div><small>Merchant</small><strong>{settings.momo_account_name}</strong></div>
            <div><small>Amount</small><strong>{price}</strong></div>
          </div>
          <a href={momoDialHref(code, course.price)} className="btn btn-momo btn-lg btn-block">📱 Dial to pay now</a>
          <p className="momo-ussd">
            Or dial <code>{ussd}</code> <CopyButton text={ussd} />, then enter your MoMo PIN.
          </p>
          {settings.payment_note && <p className="small muted">{settings.payment_note}</p>}
        </div>

        <h2 className="checkout-step"><span>2</span> Confirm your payment</h2>
        <p className="muted small">
          After paying you&apos;ll get an SMS from MoMo with a <strong>transaction ID</strong>. Enter it here and we&apos;ll unlock your course.
        </p>
        <PaymentForm courseId={course.id} slug={course.slug} defaultPhone={profile?.phone || ""} />

        <p className="small muted help-line">
          Need help? <a href={`${site.whatsappHref}?text=${whatsappText}`} target="_blank" rel="noopener">WhatsApp us</a> or call {site.phone}.
        </p>
      </>
    );
  }

  return (
    <main className="checkout">
      <div className="container checkout-grid">
        <section className="checkout-main">
          <Link href={`/courses/${course.slug}`} className="back-link"><span aria-hidden="true">←</span> Back to course</Link>
          <h1>Enroll in {course.title}</h1>
          {error && <p className="error">{error}</p>}
          {body}
        </section>

        <aside className={`checkout-summary accent-${course.accent}`}>
          {course.cover_url ? (
            <div className="summary-thumb"><Image src={course.cover_url} alt="" fill sizes="400px" /></div>
          ) : (
            <div className="course-icon"><Icon name={course.icon} size={26} /></div>
          )}
          <h3>{course.title}</h3>
          <p>{course.summary}</p>
          <div className="summary-price">
            <span>Course fee</span>
            <strong>{price || "Price on request"}</strong>
          </div>
        </aside>
      </div>
    </main>
  );
}
