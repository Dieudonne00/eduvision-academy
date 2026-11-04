import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { deleteCourse, moveChapter, deleteChapter } from "../../actions";
import Flash from "../../flash";
import DeleteButton from "../../delete-button";
import CourseForm from "../../course-form";
import ChapterForm from "../../chapter-form";

function MoveButtons({ id, courseId, first, last }) {
  return (
    <div className="move-btns">
      {["up", "down"].map((dir) => (
        <form key={dir} action={moveChapter}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="course_id" value={courseId} />
          <input type="hidden" name="direction" value={dir} />
          <button type="submit" className="icon-btn tiny" disabled={dir === "up" ? first : last}
            aria-label={dir === "up" ? "Move up" : "Move down"}>
            {dir === "up" ? "↑" : "↓"}
          </button>
        </form>
      ))}
    </div>
  );
}

export default async function AdminCoursePage({ params, searchParams }) {
  const { id } = await params;
  const flash = await searchParams;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(`id, slug, title, description, cover_url, price, currency, published,
             modules (position, lessons (id, title, kind, position, lesson_media (youtube_id, audio_path)))`)
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const chapters = [...(course.modules || [])]
    .sort((a, b) => a.position - b.position)
    .flatMap((m) => [...(m.lessons || [])].sort((a, b) => a.position - b.position))
    .map((l) => ({ ...l, media: (Array.isArray(l.lesson_media) ? l.lesson_media[0] : l.lesson_media) || {} }));

  return (
    <>
      <header className="admin-head">
        <Link href="/admin/courses" className="back-link"><span aria-hidden="true">←</span> All courses</Link>
        <div className="admin-head-row">
          <div>
            <h1>{course.title}</h1>
            <p className="muted">
              {chapters.length} chapter{chapters.length === 1 ? "" : "s"} ·{" "}
              <span className={`pill ${course.published ? "pill-success" : "pill-muted"}`}>{course.published ? "Published" : "Hidden"}</span>
            </p>
          </div>
          <Link href={`/courses/${course.slug}`} className="btn btn-ghost btn-sm" target="_blank">View on website ↗</Link>
        </div>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      <section className="admin-card">
        <h2><span className="step-badge">1</span> Course</h2>
        <CourseForm course={course} />
      </section>

      <section className="admin-card" id="chapters">
        <h2><span className="step-badge">2</span> Chapters</h2>

        {chapters.length > 0 && (
          <ol className="chapter-rows">
            {chapters.map((ch, i) => (
              <li key={ch.id}>
                <div className="chapter-row">
                  <MoveButtons id={ch.id} courseId={course.id} first={i === 0} last={i === chapters.length - 1} />
                  <span className="chapter-n">{i + 1}</span>
                  <span className={`lesson-kind ${ch.kind}`}>
                    <Icon name={ch.kind === "video" ? "play" : "headphones"} size={14} />
                  </span>
                  <div className="lesson-info">
                    <strong>{ch.title}</strong>
                    <small>{ch.kind === "video" ? "Video" : "Audio"}</small>
                  </div>
                  {ch.kind === "video" && ch.media.youtube_id && (
                    <a href={`https://youtu.be/${ch.media.youtube_id}`} target="_blank" rel="noopener" className="small">Watch</a>
                  )}
                  <DeleteButton action={deleteChapter} id={ch.id} courseId={course.id} label={`Delete chapter ${i + 1}`}
                    confirmText={`Delete chapter ${i + 1} "${ch.title}"`} />
                </div>
                <details className="add-lesson subtle">
                  <summary>Edit</summary>
                  <ChapterForm courseId={course.id} number={i + 1} chapter={ch} />
                </details>
              </li>
            ))}
          </ol>
        )}

        <div className="add-chapter">
          <h3>Add chapter {chapters.length + 1}</h3>
          <ChapterForm key={`new-${chapters.length}`} courseId={course.id} number={chapters.length + 1} />
        </div>

        {chapters.length > 0 && !course.published && (
          <p className="publish-tip">
            Course complete? Tick <strong>Published</strong> in step 1 and click <strong>Save course</strong> to show it on the website.
          </p>
        )}
      </section>

      <section className="admin-card danger-zone">
        <h2>Delete course</h2>
        <p className="muted small">Only possible when no students are enrolled. Otherwise untick &ldquo;Published&rdquo; to hide it.</p>
        <DeleteButton action={deleteCourse} courseId={course.id} label="Delete this course" wide
          confirmText={`Delete "${course.title}" and all its chapters`} />
      </section>
    </>
  );
}
