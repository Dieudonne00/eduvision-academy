import Link from "next/link";
import { notFound } from "next/navigation";
import Icon, { WhatsAppIcon } from "@/app/_components/icon";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { withDisplay, formatPrice } from "@/lib/courses";
import { site } from "@/lib/site";
import { reserveCourse } from "../actions";

export const metadata = { title: "Enroll" };

export default async function CheckoutPage({ params, searchParams }) {
  const { slug } = await params;
  const { error } = await searchParams;
  const { user, profile } = await requireUser(`/checkout/${slug}`);

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("courses")
    .select("id, slug, title, description, level, price, currency")
    .eq("slug", slug)
    .maybeSingle();
  if (!row) notFound();

  const course = withDisplay(row);
  const price = formatPrice(course.price, course.currency);

  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("status")
    .eq("course_id", course.id)
    .eq("user_id", user.id)
    .maybeSingle();

  const whatsappText = encodeURIComponent(
    `Hello EduVision Academy, I'd like to pay for the ${course.title} course. My name is ${profile?.full_name || ""}.`
  );

  return (
    <main className="checkout">
      <div className="container checkout-grid">
        <section className="checkout-main">
          <Link href="/courses" className="back-link"><span aria-hidden="true">←</span> All courses</Link>
          <h1>Enroll in {course.title}</h1>
          <p className="muted">You&apos;re one step away from your first lesson.</p>

          {error && <p className="error">{error}</p>}

          {enrollment?.status === "active" ? (
            <div className="status-box success">
              <Icon name="checkCircle" size={28} />
              <div>
                <h3>You&apos;re already enrolled</h3>
                <p>Your course is waiting for you in My learning.</p>
              </div>
              <Link href="/dashboard" className="btn btn-primary">Go to My learning</Link>
            </div>
          ) : enrollment?.status === "pending" ? (
            <div className="status-box pending">
              <Icon name="clock" size={28} />
              <div>
                <h3>Your place is reserved</h3>
                <p>Complete your payment and we&apos;ll unlock the course straight away.</p>
              </div>
            </div>
          ) : null}

          {enrollment?.status !== "active" && (
            <>
              <h2 className="checkout-step"><span>1</span> Payment</h2>
              <div className="pay-methods">
                <div className="pay-method"><strong>MTN MoMo</strong><small>Coming soon online</small></div>
                <div className="pay-method"><strong>Airtel Money</strong><small>Coming soon online</small></div>
                <div className="pay-method"><strong>Card</strong><small>Coming soon online</small></div>
              </div>
              <p className="pay-note">
                Online payment is launching soon. For now, reserve your place below, then pay through our team.
                We&apos;ll activate your course as soon as payment is received.
              </p>

              <div className="checkout-actions">
                {!enrollment && (
                  <form action={reserveCourse}>
                    <input type="hidden" name="course_id" value={course.id} />
                    <input type="hidden" name="slug" value={course.slug} />
                    <button type="submit" className="btn btn-primary btn-lg">
                      Reserve my place <Icon name="arrowRight" size={18} />
                    </button>
                  </form>
                )}
                <a href={`${site.whatsappHref}?text=${whatsappText}`} target="_blank" rel="noopener" className="btn btn-ghost btn-lg">
                  <WhatsAppIcon size={20} /> Pay via WhatsApp
                </a>
              </div>
            </>
          )}
        </section>

        <aside className={`checkout-summary accent-${course.accent}`}>
          <div className="course-icon"><Icon name={course.icon} size={26} /></div>
          <span className="course-category">{course.category}</span>
          <h3>{course.title}</h3>
          <p>{course.summary}</p>
          <ul className="summary-list">
            <li><Icon name="play" size={14} /> Video lessons</li>
            <li><Icon name="headphones" size={16} /> Audio lessons</li>
            <li><Icon name="checkCircle" size={16} /> Quizzes marked instantly</li>
            <li><Icon name="award" size={16} /> Final exam &amp; certificate</li>
          </ul>
          <div className="summary-price">
            <span>Course fee</span>
            <strong>{price || "Price on request"}</strong>
          </div>
          {!price && <small className="muted">Our team will confirm the fee with you on {profile?.phone || "your phone"}.</small>}
        </aside>
      </div>
    </main>
  );
}
