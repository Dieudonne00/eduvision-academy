import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { requireUser } from "@/lib/auth";
import { getCourseOutline } from "@/lib/courses";
import { getClassroom, nextItem } from "@/lib/learn";
import { audioUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import VideoPlayer from "../../video-player";
import ClassSidebar from "../../class-sidebar";
import { setLessonComplete } from "../../actions";

export async function generateMetadata({ params }) {
  const course = await getCourseOutline((await params).slug);
  return { title: course ? `Learning · ${course.title}` : "Learning" };
}

export default async function ChapterPage({ params }) {
  const { slug, lessonId } = await params;
  const { user, profile } = await requireUser(`/learn/${slug}/${lessonId}`);
  const isAdmin = profile?.role === "admin";

  const course = await getCourseOutline(slug);
  if (!course) notFound();
  const chapters = course.lessons;
  const index = chapters.findIndex((l) => l.id === lessonId);
  if (index === -1) notFound();
  const chapter = chapters[index];

  const supabase = await createClient();
  const [classroom, { data: media }] = await Promise.all([
    getClassroom(supabase, course, user.id, isAdmin),
    // Database rules only return media to enrolled students, free previews and admins
    supabase.from("lesson_media").select("youtube_id, audio_path").eq("lesson_id", lessonId).maybeSingle(),
  ]);
  const { enrolled, finished } = classroom;
  const { data: enrollment } = enrolled ? { data: { status: "active" } }
    : await supabase.from("enrollments").select("status").eq("course_id", course.id).eq("user_id", user.id).maybeSingle();

  const canWatch = Boolean(media) && (enrolled || isAdmin || chapter.is_preview);
  const audio = canWatch && chapter.kind === "audio" ? await audioUrl(supabase, media.audio_path) : null;
  const isDone = finished.has(lessonId);
  const next = nextItem(classroom.items, lessonId);
  const prev = chapters[index - 1];
  const watermark = `${profile?.full_name || ""} · ${user.email}`;
  const previews = Object.fromEntries(chapters.filter((c) => c.is_preview).map((c) => [c.id, true]));
  const nextLabel = !next ? null : next.type === "chapter" ? `Chapter ${next.number}` : next.title;

  return (
    <main className="classroom">
      <ClassSidebar course={course} classroom={classroom} currentId={lessonId} isAdmin={isAdmin} chapterPreviews={previews} />

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
              {next && <input type="hidden" name="next_url" value={next.href} />}
              <button type="submit" className={`btn ${isDone ? "btn-ghost" : "btn-primary"}`}>
                {isDone ? <><Icon name="check" size={16} /> Completed</> : next ? `Complete & continue to ${nextLabel} →` : "Mark complete"}
              </button>
            </form>
          )}
        </div>

        <div className="lesson-nav">
          {prev ? <Link href={`/learn/${course.slug}/${prev.id}`} className="btn btn-ghost">← Chapter {index}</Link> : <span />}
          {next ? <Link href={next.href} className="btn btn-ghost">{nextLabel} →</Link> : <span />}
        </div>
      </section>
    </main>
  );
}
