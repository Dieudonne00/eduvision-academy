import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { requireUser } from "@/lib/auth";
import { getCourseOutline } from "@/lib/courses";
import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "../../video-player";
import { setLessonComplete } from "../../actions";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const course = await getCourseOutline(slug);
  return { title: course ? `Learning · ${course.title}` : "Learning" };
}

export default async function LessonPage({ params }) {
  const { slug, lessonId } = await params;
  const { user, profile } = await requireUser(`/learn/${slug}/${lessonId}`);

  const course = await getCourseOutline(slug);
  if (!course) notFound();
  const index = course.lessons.findIndex((l) => l.id === lessonId);
  if (index === -1) notFound();
  const lesson = course.lessons[index];
  const chapterIndex = course.chapters.findIndex((c) => c.lessons.some((l) => l.id === lessonId));
  const chapter = course.chapters[chapterIndex];
  const prev = course.lessons[index - 1];
  const next = course.lessons[index + 1];

  const supabase = await createClient();
  const [{ data: enrollment }, { data: media }, { data: done }] = await Promise.all([
    supabase.from("enrollments").select("status").eq("course_id", course.id).eq("user_id", user.id).maybeSingle(),
    // Database rules only return media and notes to enrolled students, free previews and admins
    supabase.from("lesson_media").select("youtube_id, audio_path, notes").eq("lesson_id", lessonId).maybeSingle(),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).in("lesson_id", course.lessons.map((l) => l.id)),
  ]);

  const isAdmin = profile?.role === "admin";
  const enrolled = enrollment?.status === "active";
  const canWatch = Boolean(media) && (enrolled || isAdmin || lesson.is_preview);
  const finished = new Set((done || []).map((d) => d.lesson_id));
  const isDone = finished.has(lessonId);
  const percent = course.lessons.length ? Math.round((finished.size / course.lessons.length) * 100) : 0;
  const watermark = `${profile?.full_name || ""} · ${user.email}`;

  return (
    <main className="classroom">
      <aside className="class-side">
        <div className="class-course">
          <Link href={`/courses/${course.slug}`} className="small">← Course page</Link>
          <h2>{course.title}</h2>
          {enrolled && (
            <div className="progress">
              <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
              <small>{percent}% complete · {finished.size}/{course.lessons.length} lessons</small>
            </div>
          )}
        </div>
        <nav className="class-chapters" aria-label="Course content">
          {course.chapters.map((ch, i) => (
            <details key={ch.id} open={i === chapterIndex}>
              <summary><span>Chapter {i + 1}</span> {ch.title}</summary>
              <ol>
                {ch.lessons.map((l) => {
                  const locked = !enrolled && !isAdmin && !l.is_preview;
                  return (
                    <li key={l.id}>
                      <Link href={`/learn/${course.slug}/${l.id}`}
                        className={`${l.id === lessonId ? "current" : ""} ${finished.has(l.id) ? "done" : ""}`}>
                        <span className="state">
                          {finished.has(l.id) ? <Icon name="check" size={13} strokeWidth={3} />
                            : locked ? "🔒" : <Icon name={l.kind === "video" ? "play" : "headphones"} size={12} />}
                        </span>
                        <span className="grow">{l.title}</span>
                        {l.duration_seconds ? <small>{Math.round(l.duration_seconds / 60)}m</small> : null}
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </details>
          ))}
        </nav>
      </aside>

      <section className="class-main">
        {canWatch ? (
          lesson.kind === "video" && media.youtube_id ? (
            <VideoPlayer youtubeId={media.youtube_id} title={lesson.title} watermark={watermark} />
          ) : (
            <div className="audio-stage">
              <span className="audio-art"><Icon name="headphones" size={44} /></span>
              <p className="audio-title">{lesson.title}</p>
              <audio controls controlsList="nodownload" preload="metadata" src={media.audio_path} />
              <small className="audio-mark">{watermark}</small>
            </div>
          )
        ) : (
          <div className="locked-stage">
            <span className="locked-icon">🔒</span>
            <h2>This lesson is for enrolled students</h2>
            <p>
              {enrollment?.status === "pending"
                ? "Your place is reserved. As soon as your payment is confirmed, every lesson unlocks."
                : "Enroll in the course to unlock all lessons, quizzes and the final exam."}
            </p>
            <Link href={`/checkout/${course.slug}`} className="btn btn-primary btn-lg">
              {enrollment?.status === "pending" ? "Complete payment" : "Enroll now"}
            </Link>
          </div>
        )}

        <div className="lesson-head">
          <div>
            <span className="lesson-crumb">Chapter {chapterIndex + 1} · {chapter.title}</span>
            <h1>{lesson.title}</h1>
          </div>
          {enrolled && (
            <form action={setLessonComplete}>
              <input type="hidden" name="lesson_id" value={lessonId} />
              <input type="hidden" name="slug" value={course.slug} />
              <input type="hidden" name="complete" value={isDone ? "0" : "1"} />
              {next && <input type="hidden" name="next_id" value={next.id} />}
              <button type="submit" className={`btn ${isDone ? "btn-ghost" : "btn-primary"}`}>
                {isDone ? <><Icon name="check" size={16} /> Completed</> : next ? "Complete & continue →" : "Mark complete"}
              </button>
            </form>
          )}
        </div>

        {media?.notes && canWatch && (
          <article className="lesson-notes">
            <h3>Lesson notes</h3>
            {media.notes.split(/\n{2,}/).map((para, i) => (
              <p key={i}>{para.split("\n").map((line, j) => <span key={j}>{j > 0 && <br />}{line}</span>)}</p>
            ))}
          </article>
        )}

        <div className="lesson-nav">
          {prev ? <Link href={`/learn/${course.slug}/${prev.id}`} className="btn btn-ghost">← {prev.title}</Link> : <span />}
          {next ? <Link href={`/learn/${course.slug}/${next.id}`} className="btn btn-ghost">{next.title} →</Link> : <span />}
        </div>
      </section>
    </main>
  );
}
