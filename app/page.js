import Link from "next/link";
import Image from "next/image";
import Icon, { WhatsAppIcon } from "./_components/icon";
import CourseCard from "./_components/course-card";
import { site, courses } from "@/lib/site";

import heroPhoto from "@/public/images/class-photography.webp";
import instructorPhoto from "@/public/images/instructor-studio.webp";
import lessonPhoto from "@/public/images/lesson-shot-types.webp";
import examPhoto from "@/public/images/exam-room.webp";
import storefrontPhoto from "@/public/images/storefront.webp";

const steps = [
  { icon: "book", title: "Choose your course", text: "Pick a language or skill and enroll in a few clicks." },
  { icon: "play", title: "Watch & listen", text: "Learn from short video and audio lessons, on any device." },
  { icon: "checkCircle", title: "Practise with quizzes", text: "Test yourself after each unit. Results appear instantly." },
  { icon: "award", title: "Pass & get certified", text: "Take the final exam and earn your EduVision certificate." },
];

const reasons = [
  { icon: "users", title: "Skilled trainers", text: "Learn from experienced teachers who know how to make lessons stick." },
  { icon: "clock", title: "Flexible schedule", text: "Study online any time, or join our classes in Kigali." },
  { icon: "hands", title: "Practical, hands-on", text: "Real conversations, real cameras, real road signs. Not just theory." },
  { icon: "wallet", title: "Affordable fees", text: "Quality education priced for students and working people." },
];

export default function Home() {
  return (
    <main>
      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-bg" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow"><span className="dot" /> Now enrolling · Online &amp; in Kigali</span>
            <h1>
              Unlock your skills.<br />
              <span className="underline">Shape your future.</span>
            </h1>
            <p className="lead">
              Learn English, French, Swahili, Chinese, photography and traffic rules through
              video and audio lessons, quizzes that mark themselves, and exams that prove your progress.
            </p>
            <div className="hero-actions">
              <Link href="/courses" className="btn btn-primary btn-lg">
                Browse courses <Icon name="arrowRight" size={18} />
              </Link>
              <Link href="/#how-it-works" className="btn btn-ghost btn-lg">
                <span className="play-dot"><Icon name="play" size={12} /></span> How it works
              </Link>
            </div>
            <ul className="hero-points">
              <li><Icon name="check" size={18} /> Learn on your phone</li>
              <li><Icon name="check" size={18} /> Instant quiz results</li>
              <li><Icon name="check" size={18} /> Certificate on completion</li>
            </ul>
          </div>

          <div className="hero-visual">
            <div className="hero-photo">
              <Image
                src={heroPhoto}
                alt="An EduVision instructor teaching a photography class"
                priority
                placeholder="blur"
                sizes="(max-width: 900px) 100vw, 560px"
              />
            </div>
            <div className="float-card float-a">
              <span className="float-icon teal"><Icon name="play" size={16} /></span>
              <div><strong>Video &amp; audio</strong><small>Lessons you can replay</small></div>
            </div>
            <div className="float-card float-b">
              <span className="float-icon orange"><Icon name="checkCircle" size={18} /></span>
              <div><strong>Quiz passed · 85%</strong><small>Marked instantly</small></div>
            </div>
            <div className="float-card float-c">
              <span className="float-icon teal"><Icon name="award" size={18} /></span>
              <div><strong>Certified</strong><small>After your final exam</small></div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Highlights strip ─────────────────────────────── */}
      <section className="strip">
        <div className="container strip-grid">
          <div><strong>6</strong><span>courses to choose from</span></div>
          <div><strong>4</strong><span>languages taught</span></div>
          <div><strong>24/7</strong><span>online access</span></div>
          <div><strong>100%</strong><span>automatic quiz marking</span></div>
        </div>
      </section>

      {/* ── Courses ─────────────────────────────────────── */}
      <section className="section" id="courses">
        <div className="container">
          <div className="section-head">
            <span className="kicker">Our courses</span>
            <h2>Professional short courses for real life</h2>
            <p>Every course combines lessons you can watch or listen to, practice quizzes and a final exam.</p>
          </div>
          <div className="course-grid">
            {courses.map((c) => <CourseCard key={c.slug} course={c} />)}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="section section-tint" id="how-it-works">
        <div className="container">
          <div className="section-head">
            <span className="kicker">How it works</span>
            <h2>From your first lesson to your certificate</h2>
          </div>
          <ol className="steps">
            {steps.map((s, i) => (
              <li key={s.title} className="step">
                <span className="step-num">{String(i + 1).padStart(2, "0")}</span>
                <span className="step-icon"><Icon name={s.icon} size={24} /></span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Video & audio lessons ───────────────────────── */}
      <section className="section">
        <div className="container split">
          <div className="split-media media-stack">
            <div className="media-main">
              <Image src={instructorPhoto} alt="EduVision instructor recording a video lesson" placeholder="blur"
                sizes="(max-width: 900px) 80vw, 380px" />
            </div>
            <div className="media-overlap">
              <Image src={lessonPhoto} alt="A visual lesson slide explaining camera shot types" placeholder="blur"
                sizes="(max-width: 900px) 70vw, 340px" />
            </div>
            <div className="badge-card">
              <span className="float-icon orange"><Icon name="headphones" size={18} /></span>
              <div><strong>Audio lessons</strong><small>Learn on the bus, at work, anywhere</small></div>
            </div>
          </div>
          <div className="split-copy">
            <span className="kicker">Learn your way</span>
            <h2>Lessons recorded by our trainers, made for your phone</h2>
            <p>
              Every lesson is a video you can watch or an audio track you can listen to, so you can keep learning
              even with a slow connection or a busy day.
            </p>
            <ul className="check-list">
              <li><Icon name="check" size={18} /> HD video that adjusts to your internet speed</li>
              <li><Icon name="check" size={18} /> Audio lessons for practising listening &amp; pronunciation</li>
              <li><Icon name="check" size={18} /> Pick up exactly where you left off</li>
              <li><Icon name="check" size={18} /> Your progress saved for every lesson</li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── Quizzes & exams ─────────────────────────────── */}
      <section className="section section-tint">
        <div className="container split reverse">
          <div className="split-copy">
            <span className="kicker">Quizzes &amp; exams</span>
            <h2>Know exactly how you&apos;re doing, the moment you finish</h2>
            <p>
              Practise after every unit and sit a final exam at the end of the course. Your answers are marked
              automatically, with the right answer and an explanation for every question.
            </p>
            <ul className="check-list">
              <li><Icon name="check" size={18} /> Multiple choice, true/false, fill-in &amp; listening questions</li>
              <li><Icon name="check" size={18} /> Score, pass/fail and corrections straight away</li>
              <li><Icon name="check" size={18} /> Timed exams with a certificate when you pass</li>
            </ul>
          </div>
          <div className="split-media result-wrap">
            <div className="photo-frame">
              <Image src={examPhoto} alt="Students sitting an exam at EduVision Academy" placeholder="blur"
                sizes="(max-width: 900px) 100vw, 520px" />
            </div>
            <div className="result-card" aria-label="Example of a quiz result">
              <div className="result-top">
                <span className="result-label">Unit 3 quiz · French</span>
                <span className="pill pill-success">Passed</span>
              </div>
              <div className="result-score">
                <div className="ring" style={{ "--p": 85 }}><span>85%</span></div>
                <div>
                  <strong>17 / 20 correct</strong>
                  <small>Pass mark 70%</small>
                </div>
              </div>
              <ul className="result-lines">
                <li className="ok"><Icon name="check" size={14} /> &laquo; Bonjour &raquo; → Hello</li>
                <li className="bad"><Icon name="close" size={14} /> &laquo; Bonsoir &raquo; → Good evening</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why us ──────────────────────────────────────── */}
      <section className="section why" id="why-us">
        <div className="why-wave" aria-hidden="true" />
        <div className="container">
          <div className="section-head light">
            <span className="kicker">Why choose us</span>
            <h2>Come to learn, <em>go to serve</em></h2>
            <p>We train people with skills they can use the very next day: at work, on the road and around the world.</p>
          </div>
          <div className="why-grid">
            {reasons.map((r) => (
              <div key={r.title} className="why-card">
                <span className="why-icon"><Icon name={r.icon} size={24} /></span>
                <h3>{r.title}</h3>
                <p>{r.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── International certificates ──────────────────── */}
      <section className="section">
        <div className="container cert-band">
          <div>
            <span className="kicker">Going abroad?</span>
            <h2>We help you prepare for international certificates</h2>
            <p>Targeted English practice and mock tests for the exams universities and employers ask for.</p>
          </div>
          <div className="cert-badges">
            <span>IELTS</span>
            <span>TOEFL</span>
            <span>Duolingo</span>
          </div>
        </div>
      </section>

      {/* ── Visit us ────────────────────────────────────── */}
      <section className="section section-tint">
        <div className="container split">
          <div className="split-media">
            <div className="photo-frame tall">
              <Image src={storefrontPhoto} alt="EduVision Academy offices in Kigali" placeholder="blur"
                sizes="(max-width: 900px) 100vw, 460px" />
            </div>
          </div>
          <div className="split-copy">
            <span className="kicker">Visit us</span>
            <h2>Online everywhere. At home in Kigali.</h2>
            <p>Prefer learning in a classroom, or have questions before you enroll? Come and see us, or send us a message.</p>
            <div className="contact-cards">
              <a href={site.phoneHref} className="contact-card">
                <Icon name="phone" /><div><small>Call us</small><strong>{site.phone}</strong></div>
              </a>
              <a href={site.whatsappHref} target="_blank" rel="noopener" className="contact-card">
                <WhatsAppIcon /><div><small>WhatsApp</small><strong>Chat with us</strong></div>
              </a>
              <a href={`mailto:${site.email}`} className="contact-card">
                <Icon name="mail" /><div><small>Email</small><strong>{site.email}</strong></div>
              </a>
              <a href={site.mapHref} target="_blank" rel="noopener" className="contact-card">
                <Icon name="pin" /><div><small>Find us</small><strong>{site.address}</strong></div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────── */}
      <section className="cta">
        <div className="container cta-inner">
          <div>
            <h2>Your journey starts today.</h2>
            <p>Create your free account and start your first lesson in minutes.</p>
          </div>
          <div className="cta-actions">
            <Link href="/signup" className="btn btn-light btn-lg">Create free account</Link>
            <Link href="/courses" className="btn btn-outline-light btn-lg">See all courses</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
