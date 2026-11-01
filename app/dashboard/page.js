import Link from "next/link";
import Icon, { WhatsAppIcon } from "@/app/_components/icon";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { withDisplay } from "@/lib/courses";
import { site } from "@/lib/site";

export const metadata = { title: "My learning" };

export default async function DashboardPage({ searchParams }) {
  const params = await searchParams;
  const { user, profile } = await requireUser("/dashboard");
  const firstName = (profile?.full_name || user.email).split(" ")[0];

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("enrollments")
    .select("status, created_at, courses (id, slug, title, description)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const enrollments = (rows || [])
    .filter((r) => r.courses && r.status !== "cancelled")
    .map((r) => ({ status: r.status, course: withDisplay(r.courses) }));

  return (
    <main className="dashboard">
      <section className="dash-hero">
        <div className="container">
          <h1>Hi, {firstName} 👋</h1>
          <p>Welcome to your learning space.</p>
        </div>
      </section>

      <div className="container dash-body">
        {params.welcome && <p className="notice">Your email is confirmed. Welcome to EduVision Academy!</p>}
        {params.password && <p className="notice">Your password has been updated.</p>}
        {params.reserved && (
          <p className="notice">
            Your place is reserved! Complete your payment and we&apos;ll unlock the course. Questions? WhatsApp us on {site.phone}.
          </p>
        )}
        {params.enrolled && <p className="notice">You&apos;re enrolled. Enjoy your course!</p>}

        <h2 className="dash-title">My courses</h2>

        {enrollments.length === 0 ? (
          <div className="empty-state">
            <Icon name="book" size={36} />
            <h3>You haven&apos;t enrolled in a course yet</h3>
            <p>Pick a language or skill to get started.</p>
            <Link href="/courses" className="btn btn-primary">Browse courses</Link>
          </div>
        ) : (
          <div className="course-grid">
            {enrollments.map(({ status, course }) => (
              <article key={course.slug} className={`course-card accent-${course.accent}`}>
                <div className="course-icon"><Icon name={course.icon} size={26} /></div>
                {status === "active"
                  ? <span className="pill pill-success">Active</span>
                  : <span className="pill pill-pending">Awaiting payment</span>}
                <h3>{course.title}</h3>
                <p>{course.summary}</p>
                {status === "active" ? (
                  <span className="course-link muted-link">Lessons coming soon</span>
                ) : (
                  <div className="card-actions">
                    <Link href={`/checkout/${course.slug}`} className="btn btn-primary btn-sm">Complete payment</Link>
                    <a href={site.whatsappHref} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">
                      <WhatsAppIcon size={16} /> Help
                    </a>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
