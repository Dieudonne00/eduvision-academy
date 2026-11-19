"use client";

import { useFormStatus } from "react-dom";

// Submit button that shows progress while the server works, and can't be double-clicked.
export default function SubmitButton({ children, pendingText = "Saving…", disabled = false, className = "btn btn-primary" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || disabled} aria-busy={pending}>
      {pending ? <><span className="spinner" aria-hidden="true" /> {pendingText}</> : children}
    </button>
  );
}
