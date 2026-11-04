import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { getCourseOutline, formatPrice, formatDuration } from "@/lib/courses";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const course = await getCourseOutline((await params).slug);
  return course ? { title: course.title, description: course.summary } : {};
}

export default async function CoursePage({ params }) {
  const { slug } = await params;
  const [course, session] = await Promise.all([getCourseOutline(slug), getSession()]);
  const isAdmin = session?.profile?.role === "admin";
  if (!course || (!course.published && !isAdmin)) notFound();

  let enrolled = false;
  if (session) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("enrollments").select("status")
      .eq("course_id", course.id).eq("user_id", session.user.id).maybeSingle();
    enrolled = data?.status === "active" || isAdmin;
  }

  const price = formatPrice(course.price, course.currency);
  const total = formatDuration(course.totalSeconds);
  const videos = course.lessons.filter((l) => l.kind === "video").length;
  const audios = course.lessons.length - videos;

  return (
    <main>
      <section className={`course-hero accent-${course.accent}`}>
        <div className="container course-hero-grid">
          <div>
            <Link href="/courses" className="back-link light"><span aria-hidden="true">←</span> All courses</Link>
            <span className="course-hero-cat">{course.category}</span>
            <h1>{course.title}</h1>
            <p className="lead">{course.summary}</p>
            <ul className="course-facts">
              <li><Icon name="book" size={16} /> {course.chapters.length} chapters</li>
              <li><Icon name="play" size={14} /> {course.lessons.length} lessons</li>
              {total && <li><Icon name="clock" size={16} /> {total}</li>}
              {course.level && <li><Icon name="award" size={16} /> {course.level}</li>}
            </ul>
          </div>

          <aside className="enroll-card">
            <span className="enroll-label">Course fee</span>
            <strong className="enroll-price">{price || "Price on request"}</strong>
            {enrolled ? (
              <Link href={`/learn/${course.slug}`} className="btn btn-primary btn-lg btn-block">Continue learning</Link>
            ) : (
              <Link href={`/checkout/${course.slug}`} className="btn btn-primary btn-lg btn-block">Enroll now</Link>
            )}
            <ul className="summary-list">
              {videos > 0 && <li><Icon name="play" size={14} /> {videos} video lessons</li>}
              {audios > 0 && <li><Icon name="headphones" size={16} /> {audios} audio lessons</li>}
              <li><Icon name="checkCircle" size={16} /> Quizzes marked instantly</li>
              <li><Icon name="award" size={16} /> Certificate when you pass</li>
              <li><Icon name="smartphone" size={16} /> Learn on phone or computer</li>
            </ul>
          </aside>
        </div>
      </section>

      <div className="container course-body">
        {course.outcomes?.length > 0 && (
          <section className="learn-box">
            <h2>What you&apos;ll learn</h2>
            <ul className="check-list two-col">
              {course.outcomes.map((o) => <li key={o}><Icon name="check" size={18} /> {o}</li>)}
            </ul>
          </section>
        )}

        <section>
          <h2>Course content</h2>
          <p className="muted">
            {course.chapters.length} chapters · {course.lessons.length} lessons{total ? ` · ${total} total` : ""}
          </p>

          {course.chapters.length === 0 ? (
            <div className="empty-state"><Icon name="book" size={32} /><h3>Lessons are being prepared</h3><p>Enroll now and you&apos;ll be notified when they&apos;re ready.</p></div>
          ) : (
            <div className="curriculum">
              {course.chapters.map((ch, i) => {
                const chTotal = formatDuration(ch.lessons.reduce((s, l) => s + (l.duration_seconds || 0), 0));
                return (
                  <details key={ch.id} className="chapter" open={i === 0}>
                    <summary>
                      <span className="chapter-num">{i + 1}</span>
                      <span className="chapter-title">
                        <strong>{ch.title}</strong>
                        <small>{ch.lessons.length} lessons{chTotal ? ` · ${chTotal}` : ""}</small>
                      </span>
                      <span className="chev" aria-hidden="true">⌄</span>
                    </summary>
                    {ch.description && <p className="chapter-desc">{ch.description}</p>}
                    <ul className="chapter-lessons">
                      {ch.lessons.map((l) => (
                        <li key={l.id}>
                          <Icon name={l.kind === "video" ? "play" : "headphones"} size={14} />
                          <span className="grow">{l.title}</span>
                          {l.is_preview && (
                            <Link href={`/learn/${course.slug}/${l.id}`} className="preview-tag">Free preview</Link>
                          )}
                          {l.duration_seconds ? <small>{Math.round(l.duration_seconds / 60)} min</small> : null}
                        </li>
                      ))}
                    </ul>
                  </details>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
