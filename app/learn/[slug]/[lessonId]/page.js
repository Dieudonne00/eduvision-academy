import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { requireUser } from "@/lib/auth";
import { getCourseOutline } from "@/lib/courses";
import { audioUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "../../video-player";
import { setLessonComplete } from "../../actions";

export async function generateMetadata({ params }) {
  const course = await getCourseOutline((await params).slug);
  return { title: course ? `Learning · ${course.title}` : "Learning" };
}

export default async function ChapterPage({ params }) {
  const { slug, lessonId } = await params;
  const { user, profile } = await requireUser(`/learn/${slug}/${lessonId}`);

  const course = await getCourseOutline(slug);
  if (!course) notFound();
  const chapters = course.lessons;
  const index = chapters.findIndex((l) => l.id === lessonId);
  if (index === -1) notFound();
  const chapter = chapters[index];
  const prev = chapters[index - 1];
  const next = chapters[index + 1];

  const supabase = await createClient();
  const [{ data: enrollment }, { data: media }, { data: done }] = await Promise.all([
    supabase.from("enrollments").select("status").eq("course_id", course.id).eq("user_id", user.id).maybeSingle(),
    // Database rules only return media to enrolled students, free previews and admins
    supabase.from("lesson_media").select("youtube_id, audio_path").eq("lesson_id", lessonId).maybeSingle(),
    supabase.from("lesson_progress").select("lesson_id").eq("user_id", user.id).in("lesson_id", chapters.map((l) => l.id)),
  ]);

  const isAdmin = profile?.role === "admin";
  const enrolled = enrollment?.status === "active";
  const canWatch = Boolean(media) && (enrolled || isAdmin || chapter.is_preview);
  const audio = canWatch && chapter.kind === "audio" ? await audioUrl(supabase, media.audio_path) : null;
  const finished = new Set((done || []).map((d) => d.lesson_id));
  const isDone = finished.has(lessonId);
  const percent = chapters.length ? Math.round((finished.size / chapters.length) * 100) : 0;
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
              <small>{percent}% complete · {finished.size}/{chapters.length} chapters</small>
            </div>
          )}
        </div>
        <nav className="class-chapters" aria-label="Chapters">
          <ol>
            {chapters.map((l, i) => {
              const locked = !enrolled && !isAdmin && !l.is_preview;
              return (
                <li key={l.id}>
                  <Link href={`/learn/${course.slug}/${l.id}`}
                    className={`${l.id === lessonId ? "current" : ""} ${finished.has(l.id) ? "done" : ""}`}>
                    <span className="state">
                      {finished.has(l.id) ? <Icon name="check" size={13} strokeWidth={3} /> : locked ? "🔒" : i + 1}
                    </span>
                    <span className="grow">{l.title}</span>
                    <Icon name={l.kind === "video" ? "play" : "headphones"} size={13} />
                  </Link>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      <section className="class-main">
        {canWatch && chapter.kind === "video" && media.youtube_id ? (
          <VideoPlayer youtubeId={media.youtube_id} title={chapter.title} watermark={watermark} />
        ) : canWatch && audio ? (
          <div className="audio-stage">
            <span className="audio-art"><Icon name="headphones" size={44} /></span>
            <p className="audio-title">{chapter.title}</p>
            <audio controls controlsList="nodownload" preload="metadata" src={audio} />
            <small className="audio-mark">{watermark}</small>
          </div>
        ) : canWatch ? (
          <div className="locked-stage">
            <h2>This chapter isn&apos;t available right now</h2>
            <p>Please try again in a moment, or contact us if it keeps happening.</p>
          </div>
        ) : (
          <div className="locked-stage">
            <span className="locked-icon">🔒</span>
            <h2>This chapter is for enrolled students</h2>
            <p>
              {enrollment?.status === "pending"
                ? "Your place is reserved. As soon as your payment is confirmed, every chapter unlocks."
                : "Enroll in the course to unlock every chapter."}
            </p>
            <Link href={`/checkout/${course.slug}`} className="btn btn-primary btn-lg">
              {enrollment?.status === "pending" ? "Complete payment" : "Enroll now"}
            </Link>
          </div>
        )}

        <div className="lesson-head">
          <div>
            <span className="lesson-crumb">Chapter {index + 1} of {chapters.length}</span>
            <h1>{chapter.title}</h1>
          </div>
          {enrolled && (
            <form action={setLessonComplete}>
              <input type="hidden" name="lesson_id" value={lessonId} />
              <input type="hidden" name="slug" value={course.slug} />
              <input type="hidden" name="complete" value={isDone ? "0" : "1"} />
              {next && <input type="hidden" name="next_id" value={next.id} />}
              <button type="submit" className={`btn ${isDone ? "btn-ghost" : "btn-primary"}`}>
                {isDone ? <><Icon name="check" size={16} /> Completed</> : next ? "Complete & next chapter →" : "Mark complete"}
              </button>
            </form>
          )}
        </div>

        <div className="lesson-nav">
          {prev ? <Link href={`/learn/${course.slug}/${prev.id}`} className="btn btn-ghost">← Chapter {index}</Link> : <span />}
          {next ? <Link href={`/learn/${course.slug}/${next.id}`} className="btn btn-ghost">Chapter {index + 2} →</Link> : <span />}
        </div>
      </section>
    </main>
  );
}
