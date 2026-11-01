import Link from "next/link";
import AuthForm from "../auth-form";
import { signUp } from "../actions";

export const metadata = { title: "Sign up · EduVision Academy" };

export default function SignupPage() {
  return (
    <main className="auth-page">
      <div className="card">
        <h1>Create your account</h1>
        <p className="muted">Start learning with audio &amp; video lessons.</p>
        <AuthForm action={signUp} submitLabel="Sign up">
          <label>
            Full name
            <input name="full_name" autoComplete="name" required />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input name="password" type="password" autoComplete="new-password" minLength={8} required />
          </label>
        </AuthForm>
        <p className="muted small">
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </div>
    </main>
  );
}
