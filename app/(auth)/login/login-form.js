"use client";

import Link from "next/link";
import AuthForm from "../auth-form";
import { signIn } from "../actions";

export default function LoginForm({ next }) {
  return (
    <AuthForm action={signIn} submitLabel="Log in">
      {(values) => (
        <>
          <input type="hidden" name="next" value={next} />
          <label>
            Email
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com"
              defaultValue={values.email} required />
          </label>
          <label>
            <span className="label-row">
              Password
              <Link href="/forgot-password" className="small">Forgot password?</Link>
            </span>
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
        </>
      )}
    </AuthForm>
  );
}
