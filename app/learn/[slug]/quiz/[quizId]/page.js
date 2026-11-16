import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getCourseOutline } from "@/lib/courses";
import { getClassroom } from "@/lib/learn";
import { createClient } from "@/lib/supabase/server";
import ClassSidebar from "../../../class-sidebar";
import { startQuiz } from "../../../actions";

export const metadata = { title: "Quiz" };

const when = (d) => new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export default async function QuizIntro({ params, searchParams }) {
  const { slug, quizId } = await params;
  const { error } = await searchParams;
  const { user, profile } = await requireUser(`/learn/${slug}/quiz/${quizId}`);
  const isAdmin = profile?.role === "admin";

  const course = await getCourseOutline(slug);
  if (!course) notFound();
  const supabase = await createClient();
  const classroom = await getClassroom(supabase, course, user.id, isAdmin);
  const quiz = classroom.items.find((i) => i.id === quizId && i.type !== "chapter");
  if (!quiz) notFound();

  const [{ count: questionCount }, { data: attempts }] = await Promise.all([
    supabase.from("questions").select("id", { count: "exact", head: true }).eq("quiz_id", quizId),
    supabase.from("quiz_attempts").select("id, started_at, submitted_at, percent, passed")
      .eq("quiz_id", quizId).eq("user_id", user.id).order("started_at", { ascending: false }),
  ]);
  const submitted = (attempts || []).filter((a) => a.submitted_at);
  const open = (attempts || []).find((a) => !a.submitted_at);
  const used = (attempts || []).length;
  const attemptsLeft = quiz.max_attempts ? Math.max(0, quiz.max_attempts - used) : null;
  const isExam = quiz.type === "exam";
  const examLocked = isExam && !classroom.allChaptersDone && !isAdmin;
  const passedExam = isExam && submitted.some((a) => a.passed);

  let action;
  if (!classroom.canLearn) {
    action = <Link href={`/checkout/${course.slug}`} className="btn btn-primary btn-lg">Enroll to take this {isExam ? "exam" : "quiz"}</Link>;
  } else if (examLocked) {
    action = <p className="pay-note">🔒 Complete every chapter to unlock the final exam ({classroom.finished.size} of {course.lessons.length} done).</p>;
  } else if (passedExam && classroom.certificate) {
    action = <Link href={`/certificates/${classroom.certificate}`} className="btn btn-primary btn-lg">🎓 View your certificate</Link>;
  } else if (attemptsLeft === 0 && !open) {
    action = <p className="pay-note">You&apos;ve used all {quiz.max_attempts} attempts. Contact us if you need another try.</p>;
  } else {
    action = (
      <form action={startQuiz}>
        <input type="hidden" name="slug" value={course.slug} />
        <input type="hidden" name="quiz_id" value={quizId} />
        <button type="submit" className="btn btn-primary btn-lg">
          {open ? "Continue where you left off →" : submitted.length ? "Try again →" : `Start ${isExam ? "exam" : "quiz"} →`}
        </button>
      </form>
    );
  }

  return (
    <main className="classroom">
      <ClassSidebar course={course} classroom={classroom} currentId={quizId} isAdmin={isAdmin} />
      <section className="class-main">
        <div className="quiz-intro">
          <span className="quiz-badge">{isExam ? "🎓 Final exam" : "📝 Quiz"}</span>
          <h1>{quiz.title}</h1>
          <ul className="quiz-facts">
            <li><strong>{questionCount ?? "–"}</strong><span>questions</span></li>
            <li><strong>{quiz.pass_mark}%</strong><span>to pass</span></li>
            <li><strong>{quiz.time_limit_minutes ? `${quiz.time_limit_minutes} min` : "No"}</strong><span>time limit</span></li>
            <li><strong>{attemptsLeft ?? "∞"}</strong><span>attempts left</span></li>
          </ul>
          {isExam && <p className="muted">Pass this exam to receive your EduVision Academy certificate for {course.title}.</p>}
          {quiz.time_limit_minutes && <p className="small muted">⏱ The timer starts when you click Start and your answers are sent automatically when time runs out.</p>}
          {error && <p className="error">{error}</p>}
          <div className="quiz-action">{action}</div>
        </div>

        {submitted.length > 0 && (
          <div className="lesson-notes">
            <h3>Your results</h3>
            <ul className="review-list">
              {submitted.map((a) => (
                <li key={a.id}>
                  <div><strong>{Math.round(a.percent)}%</strong> <small>{when(a.submitted_at)}</small></div>
                  <span className={`pill ${a.passed ? "pill-success" : "pill-danger"}`}>{a.passed ? "Passed" : "Not passed"}</span>
                  <Link href={`/learn/${course.slug}/quiz/${quizId}/${a.id}`} className="small">See answers</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </main>
  );
}
