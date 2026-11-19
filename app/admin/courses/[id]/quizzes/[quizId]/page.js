import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateQuiz, deleteQuiz, deleteQuestion } from "@/app/admin/quiz-actions";
import Flash from "@/app/admin/flash";
import DeleteButton from "@/app/admin/delete-button";
import QuestionForm from "./question-form";

const TYPE_LABEL = { single: "Multiple choice", multiple: "Select all", true_false: "True / False", fill_blank: "Fill in the blank", matching: "Matching" };

function correctText(q, key) {
  const choices = q.options?.choices || [];
  const label = (id) => choices.find((c) => c.id === id)?.text ?? id;
  if (!key) return "";
  if (q.type === "fill_blank") return (key.accepted || []).join(" / ");
  if (q.type === "multiple") return (key.correct || []).map(label).join(", ");
  return label(key.correct);
}

export default async function QuizEditor({ params, searchParams }) {
  const { id: courseId, quizId } = await params;
  const flash = await searchParams;
  const supabase = await createClient();

  const [{ data: quiz }, { data: course }] = await Promise.all([
    supabase.from("quizzes")
      .select("id, title, kind, after_lesson_id, pass_mark, time_limit_minutes, max_attempts, shuffle, published, questions (id, type, prompt, options, points, audio_path, position, question_keys (answer, explanation))")
      .eq("id", quizId).eq("course_id", courseId).maybeSingle(),
    supabase.from("courses").select("id, title, modules (position, lessons (id, title, position))").eq("id", courseId).maybeSingle(),
  ]);
  if (!quiz || !course) notFound();

  const chapters = [...(course.modules || [])].sort((a, b) => a.position - b.position)
    .flatMap((m) => [...(m.lessons || [])].sort((a, b) => a.position - b.position));
  const questions = [...(quiz.questions || [])].sort((a, b) => a.position - b.position)
    .map((q) => ({ ...q, key: Array.isArray(q.question_keys) ? q.question_keys[0] : q.question_keys }));
  const totalPoints = questions.reduce((s, q) => s + Number(q.points), 0);
  const isExam = quiz.kind === "exam";

  return (
    <>
      <header className="admin-head">
        <Link href={`/admin/courses/${courseId}#quizzes`} className="back-link"><span aria-hidden="true">←</span> {course.title}</Link>
        <div className="admin-head-row">
          <div>
            <h1>{isExam ? "🎓" : "📝"} {quiz.title}</h1>
            <p className="muted">
              {questions.length} questions · {totalPoints} points ·{" "}
              <span className={`pill ${quiz.published ? "pill-success" : "pill-muted"}`}>{quiz.published ? "Published" : "Draft"}</span>
            </p>
          </div>
        </div>
      </header>

      {!flash.at && <Flash saved={flash.saved} error={flash.error} />}

      <section className="admin-card" id="questions">
        <h2>Questions</h2>
        {flash.at === "questions" && <Flash saved={flash.saved} error={flash.error} />}
        {questions.length > 0 && (
          <ol className="question-list">
            {questions.map((q, i) => (
              <li key={q.id}>
                <div className="question-head">
                  <span className="chapter-n">{i + 1}</span>
                  <div className="lesson-info">
                    <strong>{q.prompt}</strong>
                    <small>{TYPE_LABEL[q.type]} · {q.points} pt{Number(q.points) === 1 ? "" : "s"}{q.audio_path ? " · 🎧 audio" : ""}</small>
                  </div>
                  <DeleteButton action={deleteQuestion} id={q.id} courseId={courseId} fields={{ quiz_id: quiz.id }}
                    label={`Delete question ${i + 1}`} confirmText={`Delete question ${i + 1}`} />
                </div>
                {q.options?.choices && q.type !== "true_false" && (
                  <ul className="choice-preview">
                    {q.options.choices.map((c) => {
                      const right = q.type === "multiple" ? q.key?.answer?.correct?.includes(c.id) : q.key?.answer?.correct === c.id;
                      return <li key={c.id} className={right ? "right" : undefined}>{right ? "✓" : "○"} {c.text}</li>;
                    })}
                  </ul>
                )}
                {(q.type === "true_false" || q.type === "fill_blank") && (
                  <p className="small answer-preview">✓ {correctText(q, q.key?.answer)}</p>
                )}
                {q.key?.explanation && <p className="small muted">💡 {q.key.explanation}</p>}
              </li>
            ))}
          </ol>
        )}

        <div className="add-chapter">
          <h3>Add question {questions.length + 1}</h3>
          <QuestionForm key={`q-${questions.length}`} courseId={courseId} quizId={quiz.id} number={questions.length + 1} />
        </div>
      </section>

      <section className="admin-card" id="settings">
        <h2>Settings</h2>
        {flash.at === "settings" && <Flash saved={flash.saved} error={flash.error} />}
        <form action={updateQuiz} className="admin-form">
          <input type="hidden" name="id" value={quiz.id} />
          <input type="hidden" name="course_id" value={courseId} />
          <input type="hidden" name="kind" value={quiz.kind} />
          <div className="form-row">
            <label className="grow">Title<input name="title" defaultValue={quiz.title} /></label>
            {!isExam && (
              <label className="grow">
                Place it after
                <select name="after_lesson_id" defaultValue={quiz.after_lesson_id || ""}>
                  {chapters.map((c, i) => <option key={c.id} value={c.id}>Chapter {i + 1}: {c.title}</option>)}
                </select>
              </label>
            )}
          </div>
          <div className="form-row">
            <label className="narrow">Pass mark (%)<input name="pass_mark" type="number" min="0" max="100" defaultValue={quiz.pass_mark} /></label>
            <label className="narrow">Time limit (min)<input name="time_limit_minutes" type="number" min="1" defaultValue={quiz.time_limit_minutes ?? ""} placeholder="None" /></label>
            <label className="narrow">Max attempts<input name="max_attempts" type="number" min="1" defaultValue={quiz.max_attempts ?? ""} placeholder="Unlimited" /></label>
          </div>
          <label className="check"><input type="checkbox" name="shuffle" defaultChecked={quiz.shuffle} /> Shuffle question order for each student</label>
          <div className="form-row between">
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={quiz.published} /> Published (students can take it)
            </label>
            <button type="submit" className="btn btn-primary">Save settings</button>
          </div>
        </form>
      </section>

      <section className="admin-card danger-zone">
        <h2>Delete {isExam ? "final exam" : "quiz"}</h2>
        <p className="muted small">Removes its questions and all student results. Certificates already issued are kept.</p>
        <DeleteButton action={deleteQuiz} id={quiz.id} courseId={courseId} wide
          label={`Delete this ${isExam ? "exam" : "quiz"}`} confirmText={`Delete "${quiz.title}" and all its results`} />
      </section>
    </>
  );
}
