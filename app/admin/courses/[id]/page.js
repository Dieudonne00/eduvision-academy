import Link from "next/link";
import { notFound } from "next/navigation";
import Icon from "@/app/_components/icon";
import { createClient } from "@/lib/supabase/server";
import { COURSE_ICONS, formatDuration } from "@/lib/courses";
import {
  updateCourse, deleteCourse, addChapter, updateChapter, moveChapter, deleteChapter, moveLesson, deleteLesson,
} from "../../actions";
import Flash from "../../flash";
import DeleteButton from "../../delete-button";
import LessonForm from "./lesson-form";

function MoveButtons({ action, id, courseId, first, last }) {
  return (
    <div className="move-btns">
      {["up", "down"].map((dir) => (
        <form key={dir} action={action}>
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
    .select(`id, slug, title, description, category, language, level, price, currency, icon, accent, outcomes, published,
             modules (id, title, description, position,
               lessons (id, title, kind, is_preview, duration_seconds, position, lesson_media (youtube_id, audio_path, notes)))`)
    .eq("id", id)
    .maybeSingle();
  if (!course) notFound();

  const chapters = [...(course.modules || [])]
    .sort((a, b) => a.position - b.position)
    .map((m) => ({
      ...m,
      lessons: [...(m.lessons || [])]
        .sort((a, b) => a.position - b.position)
        .map((l) => ({ ...l, media: (Array.isArray(l.lesson_media) ? l.lesson_media[0] : l.lesson_media) || {} })),
    }));
  const lessonCount = chapters.reduce((n, c) => n + c.lessons.length, 0);
  const total = formatDuration(chapters.flatMap((c) => c.lessons).reduce((s, l) => s + (l.duration_seconds || 0), 0));

  return (
    <>
      <header className="admin-head">
        <Link href="/admin/courses" className="back-link"><span aria-hidden="true">←</span> All courses</Link>
        <div className="admin-head-row">
          <div>
            <h1>{course.title}</h1>
            <p className="muted">
              {chapters.length} chapters · {lessonCount} lessons{total ? ` · ${total}` : ""} ·{" "}
              <span className={`pill ${course.published ? "pill-success" : "pill-muted"}`}>{course.published ? "Published" : "Hidden"}</span>
            </p>
          </div>
          {course.published && (
            <Link href={`/courses/${course.slug}`} className="btn btn-ghost btn-sm" target="_blank">View on website ↗</Link>
          )}
        </div>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      {/* ── Chapters & lessons ── */}
      <section className="admin-card">
        <h2>Chapters &amp; lessons</h2>
        <p className="muted small">Build the course chapter by chapter. Students go through the lessons in this order.</p>

        {chapters.length === 0 && (
          <div className="empty-hint">No chapters yet. Add the first chapter below, e.g. &ldquo;Chapter 1: Getting started&rdquo;.</div>
        )}

        {chapters.map((ch, i) => (
          <div key={ch.id} className="unit">
            <div className="unit-head">
              <MoveButtons action={moveChapter} id={ch.id} courseId={course.id} first={i === 0} last={i === chapters.length - 1} />
              <div className="unit-title">
                <span className="unit-num">Chapter {i + 1}</span>
                <h3>{ch.title}</h3>
                {ch.description && <p className="small muted">{ch.description}</p>}
              </div>
              <DeleteButton action={deleteChapter} id={ch.id} courseId={course.id} label={`Delete chapter ${ch.title}`}
                confirmText={`Delete "${ch.title}" and all ${ch.lessons.length} of its lessons`} />
            </div>

            <details className="add-lesson subtle">
              <summary>Edit chapter</summary>
              <form action={updateChapter} className="lesson-form">
                <input type="hidden" name="id" value={ch.id} />
                <input type="hidden" name="course_id" value={course.id} />
                <label>Chapter title<input name="title" defaultValue={ch.title} required /></label>
                <label>Short description<textarea name="description" rows={2} defaultValue={ch.description} /></label>
                <div><button type="submit" className="btn btn-primary btn-sm">Save chapter</button></div>
              </form>
            </details>

            {ch.lessons.length > 0 && (
              <ol className="lesson-list">
                {ch.lessons.map((l, j) => (
                  <li key={l.id}>
                    <div className="lesson-row">
                      <MoveButtons action={moveLesson} id={l.id} courseId={course.id} first={j === 0} last={j === ch.lessons.length - 1} />
                      <span className={`lesson-kind ${l.kind}`}>
                        <Icon name={l.kind === "video" ? "play" : "headphones"} size={14} />
                      </span>
                      <div className="lesson-info">
                        <strong>{i + 1}.{j + 1} {l.title}</strong>
                        <small>
                          {l.kind === "video" ? "Video" : "Audio"}
                          {l.duration_seconds ? ` · ${Math.round(l.duration_seconds / 60)} min` : ""}
                          {l.is_preview ? " · Free preview" : ""}
                          {l.media.notes ? " · Has notes" : ""}
                        </small>
                      </div>
                      {l.kind === "video" && l.media.youtube_id && (
                        <a href={`https://www.youtube.com/watch?v=${l.media.youtube_id}`} target="_blank" rel="noopener" className="small">Check video</a>
                      )}
                      <DeleteButton action={deleteLesson} id={l.id} courseId={course.id} label={`Delete lesson ${l.title}`}
                        confirmText={`Delete the lesson "${l.title}"`} />
                    </div>
                    <details className="add-lesson subtle">
                      <summary>Edit lesson</summary>
                      <LessonForm courseId={course.id} lesson={l} />
                    </details>
                  </li>
                ))}
              </ol>
            )}

            <details className="add-lesson">
              <summary>+ Add a lesson to this chapter</summary>
              <LessonForm courseId={course.id} moduleId={ch.id} />
            </details>
          </div>
        ))}

        <form action={addChapter} className="add-unit">
          <input type="hidden" name="course_id" value={course.id} />
          <h3>Add a chapter</h3>
          <div className="form-row">
            <label className="grow">
              Chapter title
              <input name="title" placeholder={`e.g. Chapter ${chapters.length + 1}: Everyday conversations`} required />
            </label>
            <label className="grow">
              Short description <span className="hint">(optional)</span>
              <input name="description" placeholder="What students will cover in this chapter" />
            </label>
            <button type="submit" className="btn btn-primary">Add chapter</button>
          </div>
        </form>
      </section>

      {/* ── Course details ── */}
      <section className="admin-card">
        <h2>Course details &amp; price</h2>
        <form action={updateCourse} className="admin-form">
          <input type="hidden" name="id" value={course.id} />
          <div className="form-row">
            <label className="grow">Title<input name="title" defaultValue={course.title} required /></label>
            <label className="grow">Category<input name="category" defaultValue={course.category} placeholder="e.g. Languages" /></label>
          </div>
          <label>Short description<textarea name="description" rows={2} defaultValue={course.description} /></label>
          <label>
            What students will learn <span className="hint">(one point per line)</span>
            <textarea name="outcomes" rows={4} defaultValue={(course.outcomes || []).join("\n")}
              placeholder={"Hold everyday conversations\nUnderstand basic grammar"} />
          </label>
          <div className="form-row">
            <label className="grow">Language taught<input name="language" defaultValue={course.language} placeholder="e.g. French" /></label>
            <label className="grow">Level<input name="level" defaultValue={course.level} placeholder="e.g. Beginner" /></label>
          </div>
          <div className="form-row">
            <label className="grow">
              Price
              <input name="price" inputMode="numeric" defaultValue={course.price ?? ""} placeholder="Empty = price on request, 0 = free" />
            </label>
            <label className="narrow">Currency<input name="currency" defaultValue={course.currency || "RWF"} /></label>
            <label className="narrow">
              Icon
              <select name="icon" defaultValue={course.icon}>
                {COURSE_ICONS.map((ic) => <option key={ic} value={ic}>{ic}</option>)}
              </select>
            </label>
            <label className="narrow">
              Colour
              <select name="accent" defaultValue={course.accent}>
                <option value="teal">Teal</option>
                <option value="orange">Orange</option>
              </select>
            </label>
          </div>
          <div className="form-row between">
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={course.published} /> Published (visible on the website)
            </label>
            <button type="submit" className="btn btn-primary">Save course</button>
          </div>
        </form>
      </section>

      <section className="admin-card soon">
        <h2>Quizzes &amp; final exam</h2>
        <p className="muted">The quiz builder comes next: a quiz after each chapter and a final exam, marked automatically.</p>
      </section>

      <section className="admin-card danger-zone">
        <h2>Delete course</h2>
        <p className="muted small">Only possible when no students are enrolled. Otherwise untick &ldquo;Published&rdquo; to hide it.</p>
        <DeleteButton action={deleteCourse} courseId={course.id} label="Delete this course" wide
          confirmText={`Delete "${course.title}" with all its chapters and lessons`} />
      </section>
    </>
  );
}
