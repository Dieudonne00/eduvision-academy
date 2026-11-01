import Image from "next/image";
import Icon from "../_components/icon";
import examPhoto from "@/public/images/exam-room.webp";

// Split layout for login and sign-up: form on the left, brand photo on the right.
export default function AuthLayout({ children }) {
  return (
    <main className="auth-page">
      <div className="auth-form-side">{children}</div>
      <aside className="auth-photo-side">
        <Image src={examPhoto} alt="" fill placeholder="blur" sizes="(max-width: 900px) 0px, 50vw" />
        <div className="auth-photo-overlay">
          <p className="auth-quote">Come to learn, <em>go to serve.</em></p>
          <ul>
            <li><Icon name="play" size={14} /> Video &amp; audio lessons</li>
            <li><Icon name="checkCircle" size={16} /> Quizzes marked instantly</li>
            <li><Icon name="award" size={16} /> Certificate when you pass</li>
          </ul>
        </div>
      </aside>
    </main>
  );
}
