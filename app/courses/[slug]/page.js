import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { getCourseOutline, formatPrice } from "@/lib/courses";
import { getSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({ params }) {
  const course = await getCourseOutline((await params).slug);
  return course
    ? { title: course.title, description: course.summary, openGraph: course.cover_url ? { images: [course.cover_url] } : undefined }
    : {};
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
  const chapters = course.lessons;
  const videos = chapters.filter((l) => l.kind === "video").length;
  const audios = chapters.length - videos;

  return (
    <main>
      <section className={`course-hero accent-${course.accent}`}>
        <div className="container course-hero-grid">
          <div>
            <Link href="/courses" className="back-link light"><span aria-hidden="true">←</span> All courses</Link>
            {course.category && <span className="course-hero-cat">{course.category}</span>}
            <h1>{course.title}</h1>
            <p className="lead">{course.summary}</p>
            <ul className="course-facts">
              <li><Icon name="book" size={16} /> {chapters.length} chapter{chapters.length === 1 ? "" : "s"}</li>
              {videos > 0 && <li><Icon name="play" size={14} /> {videos} video{videos === 1 ? "" : "s"}</li>}
              {audios > 0 && <li><Icon name="headphones" size={16} /> {audios} audio</li>}
            </ul>
          </div>

          <aside className="enroll-card">
            {course.cover_url && (
              <div className="enroll-thumb">
                <Image src={course.cover_url} alt="" fill sizes="(max-width: 900px) 100vw, 420px" priority />
              </div>
            )}
            <div className="enroll-body">
              <span className="enroll-label">Course fee</span>
              <strong className="enroll-price">{price || "Price on request"}</strong>
              {enrolled ? (
                <Link href={`/learn/${course.slug}`} className="btn btn-primary btn-lg btn-block">Continue learning</Link>
              ) : (
                <Link href={`/checkout/${course.slug}`} className="btn btn-primary btn-lg btn-block">Enroll now</Link>
              )}
              <ul className="summary-list">
                <li><Icon name="smartphone" size={16} /> Learn on phone or computer</li>
                <li><Icon name="clock" size={16} /> Study at your own pace</li>
                <li><Icon name="checkCircle" size={16} /> Track your progress</li>
              </ul>
            </div>
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
          <h2>Chapters</h2>
          {chapters.length === 0 ? (
            <div className="empty-state"><Icon name="book" size={32} /><h3>Chapters are being prepared</h3><p>Enroll now and start as soon as they&apos;re ready.</p></div>
          ) : (
            <ol className="chapter-list">
              {chapters.map((ch, i) => (
                <li key={ch.id}>
                  <span className="chapter-num">{i + 1}</span>
                  <span className="grow">
                    <strong>{ch.title}</strong>
                    <small>{ch.kind === "video" ? "Video" : "Audio"}</small>
                  </span>
                  <Icon name={ch.kind === "video" ? "play" : "headphones"} size={16} />
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
}
