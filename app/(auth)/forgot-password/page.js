import Link from "next/link";
import AuthForm from "../auth-form";
import { requestPasswordReset } from "../actions";

export const metadata = { title: "Forgot password" };

export default function ForgotPasswordPage() {
  return (
    <div className="auth-card">
      <h1>Reset your password</h1>
      <p className="muted">Enter your email and we&apos;ll send you a link to choose a new password.</p>
      <AuthForm action={requestPasswordReset} submitLabel="Send reset link">
        <label>
          Email
          <input name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
        </label>
      </AuthForm>
      <p className="muted small">
        Remembered it? <Link href="/login">Back to log in</Link>
      </p>
    </div>
  );
}
