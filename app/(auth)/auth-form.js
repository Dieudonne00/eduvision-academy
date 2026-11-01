"use client";

import { useActionState } from "react";

// Shared form shell for the auth pages: shows errors, a busy state, and keeps
// typed values after an error. `children` may be a function receiving those values.
export default function AuthForm({ action, submitLabel, children }) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.message) {
    return <p className="notice">{state.message}</p>;
  }

  const values = state?.values || {};

  return (
    <form action={formAction} className="stack">
      {typeof children === "function" ? children(values) : children}
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
