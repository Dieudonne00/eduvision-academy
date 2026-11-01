"use client";

import { useActionState } from "react";

// Shared form shell for login and sign-up: shows errors and a busy state.
export default function AuthForm({ action, submitLabel, children }) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.message) {
    return <p className="notice">{state.message}</p>;
  }

  return (
    <form action={formAction} className="stack">
      {children}
      {state?.error && <p className="error">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={pending}>
        {pending ? "Please wait…" : submitLabel}
      </button>
    </form>
  );
}
