"use client";

import Icon from "@/app/_components/icon";

// Delete button that asks for confirmation before submitting.
export default function DeleteButton({ action, id, courseId, label, confirmText, wide = false }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`${confirmText}? This can't be undone.`)) e.preventDefault();
      }}
    >
      {id && <input type="hidden" name="id" value={id} />}
      <input type="hidden" name="course_id" value={courseId} />
      {wide ? (
        <button type="submit" className="btn btn-sm btn-danger">{label}</button>
      ) : (
        <button type="submit" className="icon-btn danger" aria-label={label} title={confirmText}>
          <Icon name="close" size={16} />
        </button>
      )}
    </form>
  );
}
