import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseOutline } from "@/lib/courses";
import { getClassroom, nextItem } from "@/lib/learn";
import { audioUrl } from "@/lib/media";
import { createClient } from "@/lib/supabase/server";
import ClassSidebar from "../../../../class-sidebar";
import QuizTimer from "../../../../quiz-timer";
import { submitQuiz } from "../../../../actions";

export const metadata = { title: "Quiz" };

// Turn stored answer ids into readable text
function describe(question, value) {
  if (value === null || value === undefined || value === "" || (Array.isArray(value) && !value.length)) return "No answer";
  const choices = question?.options?.choices || [];
  const label = (id) => choices.find((c) => c.id === id)?.text ?? String(id);
  if (Array.isArray(value)) return value.map(label).join(", ");
  return choices.length ? label(value) : String(value);
}

function correctAnswer(question, key) {
  if (!key) return "";
  if (key.accepted) return key.accepted.join(" / ");
  return describe(question, key.correct);
}

export default async function AttemptPage({ params, searchParams }) {
  const { slug, quizId, attemptId } = await params;
  const { error } = await searchParams;
  const here = `/learn/${slug}/quiz/${quizId}/${attemptId}`;
  const { user, profile } = await requireUser(here);
  const isAdmin = profile?.role === "admin";

  const course = await getCourseOutline(slug);
  if (!course) notFound();
  const supabase = await createClient();

  const [classroom, { data: attempt }, { data: quiz }] = await Promise.all([
    getClassroom(supabase, course, user.id, isAdmin),
    supabase.from("quiz_attempts").select("*").eq("id", attemptId).eq("user_id", user.id).maybeSingle(),
    supabase.from("quizzes").select("id, title, kind, pass_mark, time_limit_minutes").eq("id", quizId).maybeSingle(),
  ]);
  if (!attempt || !quiz || attempt.quiz_id !== quizId) notFound();

  const { data: rows } = await supabase
    .from("questions").select("id, type, prompt, options, points, audio_path").in("id", attempt.question_ids);
  const byId = Object.fromEntries((rows || []).map((q) => [q.id, q]));
  const questions = attempt.question_ids.map((id) => byId[id]).filter(Boolean);
  const isExam = quiz.kind === "exam";

  // ── Results ──────────────────────────────────────────────
  if (attempt.submitted_at) {
    const percent = Math.round(Number(attempt.percent));
    const next = nextItem(classroom.items, quizId);
    return (
      <main className="classroom">
        <ClassSidebar course={course} classroom={classroom} currentId={quizId} isAdmin={isAdmin} />
        <section className="class-main">
          <div className={`result-hero ${attempt.passed ? "pass" : "fail"}`}>
            <div className="ring big" style={{ "--p": percent }}><span>{percent}%</span></div>
            <div>
              <span className="quiz-badge">{isExam ? "🎓 Final exam" : "📝 Quiz"} · {quiz.title}</span>
              <h1>{attempt.passed ? (isExam ? "Congratulations, you passed! 🎉" : "Well done, you passed!") : "Not quite yet"}</h1>
              <p>
                {Number(attempt.score)} / {Number(attempt.max_score)} points · pass mark {quiz.pass_mark}%
                {!attempt.passed && " · review the answers below and try again"}
              </p>
              <div className="result-actions">
                {isExam && attempt.passed && classroom.certificate && (
                  <Link href={`/certificates/${classroom.certificate}`} className="btn btn-light">🎓 Get your certificate</Link>
                )}
                {!attempt.passed && <Link href={`/learn/${slug}/quiz/${quizId}`} className="btn btn-light">Try again</Link>}
                {next && <Link href={next.href} className="btn btn-outline-light">Continue: {next.type === "chapter" ? `Chapter ${next.number}` : next.title} →</Link>}
              </div>
            </div>
          </div>

          <ol className="answer-review">
            {(attempt.results || []).map((r, i) => {
              const q = byId[r.question_id];
              return (
                <li key={r.question_id} className={r.correct ? "right" : Number(r.earned) > 0 ? "partial" : "wrong"}>
                  <div className="answer-top">
                    <span className="answer-mark">{r.correct ? "✓" : Number(r.earned) > 0 ? "½" : "✕"}</span>
                    <strong>{i + 1}. {q?.prompt || "Question"}</strong>
                    <small>{Number(r.earned)}/{Number(r.points)}</small>
                  </div>
                  <p><span className="muted">Your answer:</span> {describe(q, r.given)}</p>
                  {!r.correct && <p><span className="muted">Correct answer:</span> <strong>{correctAnswer(q, r.correct_answer)}</strong></p>}
                  {r.explanation && <p className="explain">💡 {r.explanation}</p>}
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    );
  }

  // ── Taking the quiz ──────────────────────────────────────
  const audio = Object.fromEntries(await Promise.all(
    questions.filter((q) => q.audio_path).map(async (q) => [q.id, await audioUrl(supabase, q.audio_path)])
  ));
  const deadline = quiz.time_limit_minutes
    ? new Date(new Date(attempt.started_at).getTime() + quiz.time_limit_minutes * 60000).toISOString()
    : null;
  const formId = `quiz-${attemptId}`;

  return (
    <main className="classroom">
      <ClassSidebar course={course} classroom={classroom} currentId={quizId} isAdmin={isAdmin} />
      <section className="class-main">
        <div className="quiz-take-head">
          <div>
            <span className="quiz-badge">{isExam ? "🎓 Final exam" : "📝 Quiz"}</span>
            <h1>{quiz.title}</h1>
            <p className="muted small">{questions.length} questions · pass mark {quiz.pass_mark}%</p>
          </div>
          {deadline && <QuizTimer deadline={deadline} formId={formId} />}
        </div>
        {error && <p className="error">{error}</p>}

        <form id={formId} action={submitQuiz} className="quiz-form">
          <input type="hidden" name="slug" value={slug} />
          <input type="hidden" name="quiz_id" value={quizId} />
          <input type="hidden" name="attempt_id" value={attemptId} />
          <input type="hidden" name="question_ids" value={questions.map((q) => q.id).join(",")} />

          {questions.map((q, i) => (
            <fieldset key={q.id} className="quiz-q">
              <input type="hidden" name={`type_${q.id}`} value={q.type} />
              <legend><span className="q-num">{i + 1}</span> {q.prompt}</legend>
              {audio[q.id] && <audio controls controlsList="nodownload" preload="none" src={audio[q.id]} className="q-audio" />}
              {q.type === "multiple" && <p className="hint">Select all that apply</p>}

              {q.type === "fill_blank" ? (
                <input name={`q_${q.id}`} className="q-text" placeholder="Type your answer" autoComplete="off" />
              ) : (
                <div className="q-choices">
                  {(q.options?.choices || []).map((c) => (
                    <label key={c.id} className="q-choice">
                      <input type={q.type === "multiple" ? "checkbox" : "radio"} name={`q_${q.id}`} value={c.id} />
                      <span>{c.text}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
          ))}

          <div className="quiz-submit">
            <button type="submit" className="btn btn-primary btn-lg">Submit answers</button>
            <small className="muted">You&apos;ll see your score and the correct answers straight away.</small>
          </div>
        </form>
      </section>
    </main>
  );
}
