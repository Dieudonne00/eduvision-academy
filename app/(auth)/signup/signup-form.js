"use client";

import AuthForm from "../auth-form";
import { signUp } from "../actions";

export default function SignupForm({ next }) {
  return (
    <AuthForm action={signUp} submitLabel="Create account">
      {(values) => (
        <>
          <input type="hidden" name="next" value={next} />
          <label>
            Full name
            <input name="full_name" autoComplete="name" placeholder="Your full name"
              defaultValue={values.full_name} required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" placeholder="you@example.com"
              defaultValue={values.email} required />
          </label>
          <label>
            Phone number
            <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0788 123 456"
              defaultValue={values.phone} required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="new-password" minLength={8}
              placeholder="At least 8 characters" required />
          </label>
        </>
      )}
    </AuthForm>
  );
}
