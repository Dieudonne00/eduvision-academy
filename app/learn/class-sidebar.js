import Link from "next/link";
import Icon from "@/app/_components/icon";

// Course path on the left of the classroom: chapters, quizzes and the final exam.
export default function ClassSidebar({ course, classroom, currentId, isAdmin, chapterPreviews = {} }) {
  const { items, finished, best, enrolled, percent, allChaptersDone, certificate } = classroom;
  const chapterCount = items.filter((i) => i.type === "chapter").length;

  return (
    <aside className="class-side">
      <div className="class-course">
        <Link href={`/courses/${course.slug}`} className="small">← Course page</Link>
        <h2>{course.title}</h2>
        {enrolled && (
          <div className="progress">
            <div className="progress-bar"><span style={{ width: `${percent}%` }} /></div>
            <small>{percent}% complete · {finished.size}/{chapterCount} chapters</small>
          </div>
        )}
        {certificate && (
          <Link href={`/certificates/${certificate}`} className="btn btn-primary btn-sm cert-link">🎓 View your certificate</Link>
        )}
      </div>
      <nav className="class-chapters" aria-label="Course content">
        <ol>
          {items.map((it) => {
            const current = it.id === currentId ? "current" : "";
            if (it.type === "chapter") {
              const locked = !enrolled && !isAdmin && !chapterPreviews[it.id];
              const done = finished.has(it.id);
              return (
                <li key={it.id}>
                  <Link href={it.href} className={`${current} ${done ? "done" : ""}`}>
                    <span className="state">{done ? <Icon name="check" size={13} strokeWidth={3} /> : locked ? "🔒" : it.number}</span>
                    <span className="grow">{it.title}</span>
                    <Icon name={it.kind === "video" ? "play" : "headphones"} size={13} />
                  </Link>
                </li>
              );
            }
            const passed = best[it.id]?.passed;
            const examLocked = it.type === "exam" && !allChaptersDone && !isAdmin;
            return (
              <li key={it.id} className={it.type === "exam" ? "exam-item" : "quiz-item"}>
                <Link href={it.href} className={`${current} ${passed ? "done" : ""}`}>
                  <span className="state">{passed ? <Icon name="check" size={13} strokeWidth={3} /> : examLocked ? "🔒" : it.type === "exam" ? "🎓" : "📝"}</span>
                  <span className="grow">{it.title}{!it.published ? " (draft)" : ""}</span>
                  {best[it.id] && <small>{Math.round(best[it.id].percent)}%</small>}
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </aside>
  );
}
