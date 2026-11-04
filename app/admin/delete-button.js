"use client";

import Icon from "@/app/_components/icon";

// Small delete button that asks for confirmation before submitting.
export default function DeleteButton({ action, id, courseId, label, confirmText }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(`${confirmText}? This can't be undone.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="course_id" value={courseId} />
      <button type="submit" className="icon-btn danger" aria-label={label} title={confirmText}>
        <Icon name="close" size={16} />
      </button>
    </form>
  );
}
