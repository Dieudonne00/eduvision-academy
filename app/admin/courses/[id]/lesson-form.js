"use client";

import { useState } from "react";
import { addLesson } from "../../actions";

// Add-lesson form; shows the YouTube field for video lessons and the audio link for audio lessons.
export default function LessonForm({ courseId, moduleId }) {
  const [kind, setKind] = useState("video");

  return (
    <form action={addLesson} className="lesson-form">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="module_id" value={moduleId} />

      <div className="kind-toggle" role="radiogroup" aria-label="Lesson type">
        {["video", "audio"].map((k) => (
          <label key={k} className={kind === k ? "active" : undefined}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
            {k === "video" ? "🎬 Video" : "🎧 Audio"}
          </label>
        ))}
      </div>

      <div className="form-row">
        <label className="grow">
          Lesson title
          <input name="title" placeholder="e.g. Greetings and introductions" required />
        </label>
        <label className="narrow">
          Minutes
          <input name="minutes" type="number" min="0" step="1" placeholder="10" />
        </label>
      </div>

      {kind === "video" ? (
        <label>
          YouTube video ID or link
          <input name="youtube" placeholder="dQw4w9WgXcQ  or  https://youtu.be/dQw4w9WgXcQ" required />
          <small className="hint">Upload the video to YouTube as <strong>Unlisted</strong>, then paste its link here.</small>
        </label>
      ) : (
        <label>
          Audio file link
          <input name="audio_url" type="url" placeholder="https://…/lesson-1.mp3" required />
          <small className="hint">Direct audio upload is coming soon. For now, paste an https link to an MP3.</small>
        </label>
      )}

      <div className="form-row between">
        <label className="check">
          <input type="checkbox" name="is_preview" /> Free preview (anyone can watch)
        </label>
        <button type="submit" className="btn btn-primary btn-sm">Add lesson</button>
      </div>
    </form>
  );
}
