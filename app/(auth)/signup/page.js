import Link from "next/link";
import { redirect } from "next/navigation";
import SignupForm from "./signup-form";
import { safeNext } from "@/lib/safe-next";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Sign up" };

export default async function SignupPage({ searchParams }) {
  const next = safeNext((await searchParams).next);
  const enrolling = next.startsWith("/checkout/");
  if (await getSession()) redirect(next);

  return (
    <div className="auth-card">
      <h1>Create your account</h1>
      <p className="muted">
        {enrolling ? "Create your account to enroll. It takes less than a minute." : "Start learning with audio & video lessons."}
      </p>
      <SignupForm next={next} />
      <p className="muted small">
        Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`}>Log in</Link>
      </p>
    </div>
  );
}
