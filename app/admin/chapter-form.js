"use client";

import { useState } from "react";
import FileUpload from "./file-upload";
import { addChapter, updateChapter } from "./actions";

// One chapter = a title + a video (YouTube link) or an audio (uploaded file).
export default function ChapterForm({ courseId, number, chapter }) {
  const editing = Boolean(chapter);
  const [kind, setKind] = useState(chapter?.kind || "video");
  const [uploading, setUploading] = useState(false);

  return (
    <form action={editing ? updateChapter : addChapter} className="chapter-form">
      <input type="hidden" name="course_id" value={courseId} />
      {editing && <input type="hidden" name="id" value={chapter.id} />}

      <label>
        Chapter {number} title
        <input name="title" defaultValue={chapter?.title} placeholder="e.g. Greetings and introductions" required />
      </label>

      <div className="kind-toggle" role="radiogroup" aria-label="Chapter type">
        {["video", "audio"].map((k) => (
          <label key={k} className={kind === k ? "active" : undefined}>
            <input type="radio" name="kind" value={k} checked={kind === k} onChange={() => setKind(k)} />
            {k === "video" ? "🎬 Video" : "🎧 Audio"}
          </label>
        ))}
      </div>

      {kind === "video" ? (
        <label>
          YouTube link
          <input name="youtube" defaultValue={chapter?.media?.youtube_id ? `https://youtu.be/${chapter.media.youtube_id}` : ""}
            placeholder="https://youtu.be/…" required />
          <small className="hint">Upload the video to YouTube as <strong>Unlisted</strong>, then paste its link.</small>
        </label>
      ) : (
        <div>
          <span className="field-label">Audio file</span>
          <FileUpload kind="audio" name="audio_path" folder={courseId}
            defaultValue={chapter?.media?.audio_path || ""} onBusyChange={setUploading} />
          <small className="hint">MP3 or M4A, up to 50 MB.</small>
        </div>
      )}

      <div>
        <button type="submit" className="btn btn-primary" disabled={uploading}>
          {uploading ? "Wait for upload…" : editing ? "Save chapter" : `Add chapter ${number}`}
        </button>
      </div>
    </form>
  );
}
