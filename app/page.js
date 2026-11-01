import ServerStatus from "./server-status";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", textAlign: "center", padding: 16 }}>
      <div>
        <h1 style={{ fontSize: "clamp(2rem, 6vw, 3.5rem)", margin: "0 0 .5rem" }}>EduVision Academy</h1>
        <p style={{ color: "var(--muted)", margin: ".25rem 0" }}>
          Learn languages through audio &amp; video lessons, quizzes and exams.
        </p>
        <p style={{ color: "var(--muted)", margin: ".25rem 0" }}>Coming soon.</p>
        <ServerStatus />
      </div>
    </main>
  );
}
