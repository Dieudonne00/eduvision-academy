"use client";

import { useEffect, useRef, useState } from "react";

// Countdown for timed quizzes; sends the answers automatically when time is up.
export default function QuizTimer({ deadline, formId }) {
  const end = new Date(deadline).getTime();
  const [left, setLeft] = useState(() => Math.max(0, end - Date.now()));
  const sent = useRef(false);

  useEffect(() => {
    const tick = () => {
      const ms = Math.max(0, end - Date.now());
      setLeft(ms);
      if (ms === 0 && !sent.current) {
        sent.current = true;
        document.getElementById(formId)?.requestSubmit();
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [end, formId]);

  const mins = Math.floor(left / 60000);
  const secs = Math.floor((left % 60000) / 1000);
  return (
    <div className={`quiz-timer${left < 60000 ? " urgent" : ""}`} role="timer" aria-live="off">
      ⏱ {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}
