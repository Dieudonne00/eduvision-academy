import Link from "next/link";
import AuthForm from "../auth-form";
import { signUp } from "../actions";

export const metadata = { title: "Sign up" };

export default function SignupPage() {
  return (
    <div className="auth-card">
      <h1>Create your account</h1>
      <p className="muted">Start learning with audio &amp; video lessons.</p>
      <AuthForm action={signUp} submitLabel="Create account">
        <label>
          Full name
          <input name="full_name" autoComplete="name" placeholder="Your full name" required />
        </label>
        <label>
          Email
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="new-password" minLength={8} placeholder="At least 8 characters" required />
        </label>
      </AuthForm>
      <p className="muted small">
        Already have an account? <Link href="/login">Log in</Link>
      </p>
    </div>
  );
}
