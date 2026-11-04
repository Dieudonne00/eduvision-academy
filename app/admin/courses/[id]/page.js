import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { updateCourse, addModule, deleteModule, deleteLesson } from "../../actions";
import Flash from "../../flash";
import DeleteButton from "../../delete-button";
import LessonForm from "./lesson-form";

export default async function AdminCoursePage({ params, searchParams }) {
  const { id } = await params;
  const flash = await searchParams;

  const supabase = await createClient();
  const { data: course } = await supabase
    .from("courses")
    .select(`id, slug, title, description, level, price, currency, published,
             modules (id, title, position, lessons (id, title, kind, is_preview, duration_seconds, position, lesson_media (youtube_id, audio_path)))`)
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const modules = [...(course.modules || [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({ ...m, lessons: [...(m.lessons || [])].sort((a, b) => a.position - b.position) }));

  return (
    <>
      <header className="admin-head">
        <Link href="/admin/courses" className="back-link"><span aria-hidden="true">←</span> All courses</Link>
        <h1>{course.title}</h1>
        <p className="muted">
          Public page: <Link href={`/checkout/${course.slug}`}>/checkout/{course.slug}</Link>
        </p>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      {/* ── Details & price ── */}
      <section className="admin-card">
        <h2>Details &amp; price</h2>
        <form action={updateCourse} className="admin-form">
          <input type="hidden" name="id" value={course.id} />
          <div className="form-row">
            <label className="grow">Title<input name="title" defaultValue={course.title} required /></label>
            <label className="grow">Level<input name="level" defaultValue={course.level} placeholder="e.g. Beginner, All levels" /></label>
          </div>
          <label>Description<textarea name="description" rows={3} defaultValue={course.description} /></label>
          <div className="form-row">
            <label className="grow">
              Price
              <input name="price" inputMode="numeric" defaultValue={course.price ?? ""} placeholder="Empty = price on request, 0 = free" />
            </label>
            <label className="narrow">Currency<input name="currency" defaultValue={course.currency || "RWF"} /></label>
          </div>
          <div className="form-row between">
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={course.published} /> Published (visible to students)
            </label>
            <button type="submit" className="btn btn-primary">Save course</button>
          </div>
        </form>
      </section>

      {/* ── Units & lessons ── */}
      <section className="admin-card">
        <h2>Units &amp; lessons</h2>
        <p className="muted small">Organise the course into units (e.g. &ldquo;Unit 1: Greetings&rdquo;), then add video or audio lessons to each.</p>

        {modules.map((m, i) => (
          <div key={m.id} className="unit">
            <div className="unit-head">
              <h3><span className="unit-num">Unit {i + 1}</span> {m.title}</h3>
              <DeleteButton action={deleteModule} id={m.id} courseId={course.id} label={`Delete unit ${m.title}`}
                confirmText="Delete this unit and all its lessons" />
            </div>

            {m.lessons.length > 0 && (
              <ol className="lesson-list">
                {m.lessons.map((l) => {
                  const media = Array.isArray(l.lesson_media) ? l.lesson_media[0] : l.lesson_media;
                  return (
                    <li key={l.id}>
                      <span className={`lesson-kind ${l.kind}`}>
                        <Icon name={l.kind === "video" ? "play" : "headphones"} size={14} />
                      </span>
                      <div className="lesson-info">
                        <strong>{l.title}</strong>
                        <small>
                          {l.kind === "video" ? `YouTube: ${media?.youtube_id || "?"}` : "Audio"}
                          {l.duration_seconds ? ` · ${Math.round(l.duration_seconds / 60)} min` : ""}
                          {l.is_preview ? " · Free preview" : ""}
                        </small>
                      </div>
                      {l.kind === "video" && media?.youtube_id && (
                        <a href={`https://www.youtube.com/watch?v=${media.youtube_id}`} target="_blank" rel="noopener" className="small">Check video</a>
                      )}
                      <DeleteButton action={deleteLesson} id={l.id} courseId={course.id} label={`Delete lesson ${l.title}`}
                        confirmText="Delete this lesson" />
                    </li>
                  );
                })}
              </ol>
            )}

            <details className="add-lesson">
              <summary><Icon name="play" size={12} /> Add a lesson to this unit</summary>
              <LessonForm courseId={course.id} moduleId={m.id} />
            </details>
          </div>
        ))}

        <form action={addModule} className="form-row add-unit">
          <input type="hidden" name="course_id" value={course.id} />
          <label className="grow">
            New unit
            <input name="title" placeholder={`e.g. Unit ${modules.length + 1}: Everyday conversations`} required />
          </label>
          <button type="submit" className="btn btn-ghost">Add unit</button>
        </form>
      </section>

      <section className="admin-card soon">
        <h2>Quizzes &amp; exam</h2>
        <p className="muted">The quiz builder is next. Questions will be marked automatically when students submit.</p>
      </section>
    </>
  );
}
