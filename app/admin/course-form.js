"use client";

import { useState } from "react";
import FileUpload from "./file-upload";
import SubmitButton from "./submit-button";
import { createCourse, updateCourse } from "./actions";

// Course title, description, thumbnail and price. Used on the New course page and to edit a course.
export default function CourseForm({ course }) {
  const editing = Boolean(course);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={editing ? updateCourse : createCourse} className="course-form">
      {editing && <input type="hidden" name="id" value={course.id} />}

      <div className="course-form-grid">
        <div className="course-form-thumb">
          <span className="field-label">Thumbnail <span className="hint">(optional)</span></span>
          <FileUpload kind="image" name="cover_url" defaultValue={course?.cover_url || ""} onBusyChange={setUploading} />
          <small className="hint">Shown on the home page and course list. A landscape JPG or PNG works best.</small>
        </div>

        <div className="course-form-fields">
          <label>
            Title <span className="req">*</span>
            <input name="title" defaultValue={course?.title} placeholder="e.g. German for Beginners" required />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} defaultValue={course?.description}
              placeholder="What will students learn in this course?" />
          </label>
          <label>
            Price (RWF)
            <input name="price" inputMode="numeric" defaultValue={course?.price ?? ""} placeholder="e.g. 70000  (leave empty = price on request, 0 = free)" />
          </label>
          {editing && (
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={course.published} /> Published: show this course on the website
            </label>
          )}
          <div>
            <SubmitButton disabled={uploading} pendingText={editing ? "Saving…" : "Creating course…"}>
              {uploading ? "Wait for the image to upload…" : editing ? "Save course" : "Create course & add chapters →"}
            </SubmitButton>
          </div>
        </div>
      </div>
    </form>
  );
}
