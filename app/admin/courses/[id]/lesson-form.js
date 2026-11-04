"use client";

import { useState } from "react";
import { addLesson, updateLesson } from "../../actions";

// Add or edit a lesson. Shows the YouTube field for video lessons and the audio link for audio lessons.
export default function LessonForm({ courseId, moduleId, lesson }) {
  const editing = Boolean(lesson);
  const [kind, setKind] = useState(lesson?.kind || "video");
  const media = lesson?.media || {};

  return (
    <form action={editing ? updateLesson : addLesson} className="lesson-form">
      <input type="hidden" name="course_id" value={courseId} />
      {editing ? <input type="hidden" name="id" value={lesson.id} /> : <input type="hidden" name="module_id" value={moduleId} />}

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
          <input name="title" defaultValue={lesson?.title} placeholder="e.g. Greetings and introductions" required />
        </label>
        <label className="narrow">
          Minutes
          <input name="minutes" type="number" min="0" step="1" placeholder="10"
            defaultValue={lesson?.duration_seconds ? Math.round(lesson.duration_seconds / 60) : ""} />
        </label>
      </div>

      {kind === "video" ? (
        <label>
          YouTube video ID or link
          <input name="youtube" defaultValue={media.youtube_id || ""} placeholder="https://youtu.be/…  or the 11-character ID" required />
          <small className="hint">Upload the video to YouTube as <strong>Unlisted</strong>, then paste its link here.</small>
        </label>
      ) : (
        <label>
          Audio file link
          <input name="audio_url" type="url" defaultValue={media.audio_path || ""} placeholder="https://…/lesson-1.mp3" required />
          <small className="hint">Direct audio upload is coming soon. For now, paste an https link to an MP3.</small>
        </label>
      )}

      <label>
        Lesson notes <span className="hint">(optional: key words, summary, homework; shown under the lesson)</span>
        <textarea name="content" rows={4} defaultValue={media.notes || ""} />
      </label>

      <div className="form-row between">
        <label className="check">
          <input type="checkbox" name="is_preview" defaultChecked={lesson?.is_preview} /> Free preview (visible before paying)
        </label>
        <button type="submit" className="btn btn-primary btn-sm">{editing ? "Save lesson" : "Add lesson"}</button>
      </div>
    </form>
  );
}
