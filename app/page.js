import Link from "next/link";

export default function Home() {
  return (
    <main className="hero">
      <div>
        <h1>EduVision Academy</h1>
        <p className="muted">Learn languages through audio &amp; video lessons, quizzes and exams.</p>
        <div className="actions">
          <Link href="/signup" className="btn">Start learning</Link>
          <Link href="/login" className="btn btn-outline">Log in</Link>
        </div>
      </div>
    </main>
  );
}
