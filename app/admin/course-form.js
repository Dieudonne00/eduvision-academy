"use client";

import { useState } from "react";
import FileUpload from "./file-upload";
import { createCourse, updateCourse } from "./actions";

// Step 1 of a course: title, description, thumbnail, price.
export default function CourseForm({ course }) {
  const editing = Boolean(course);
  const [uploading, setUploading] = useState(false);

  return (
    <form action={editing ? updateCourse : createCourse} className="course-form">
      {editing && <input type="hidden" name="id" value={course.id} />}

      <div className="course-form-grid">
        <div className="course-form-thumb">
          <span className="field-label">Thumbnail</span>
          <FileUpload kind="image" name="cover_url" defaultValue={course?.cover_url || ""} onBusyChange={setUploading} />
          <small className="hint">Shown on the home page and course list. A landscape photo works best.</small>
        </div>

        <div className="course-form-fields">
          <label>
            Title
            <input name="title" defaultValue={course?.title} placeholder="e.g. German for Beginners" required />
          </label>
          <label>
            Description
            <textarea name="description" rows={4} defaultValue={course?.description}
              placeholder="What will students learn in this course?" />
          </label>
          <label>
            Price (RWF)
            <input name="price" inputMode="numeric" defaultValue={course?.price ?? ""} placeholder="e.g. 25000  (0 = free)" />
          </label>
          {editing && (
            <label className="check">
              <input type="checkbox" name="published" defaultChecked={course.published} /> Published: show this course on the website
            </label>
          )}
          <div>
            <button type="submit" className="btn btn-primary" disabled={uploading}>
              {uploading ? "Wait for upload…" : editing ? "Save course" : "Create course & add chapters →"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
