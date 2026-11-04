import Link from "next/link";
import Image from "next/image";
import Icon, { WhatsAppIcon } from "./_components/icon";
import { site } from "@/lib/site";
import { getPublishedCourses } from "@/lib/courses";
import logo from "@/public/images/logo.png";

export default async function SiteFooter() {
  const courses = await getPublishedCourses();

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="footer-logo">
            <Image src={logo} alt="EduVision Academy" width={180} />
          </div>
          <p>
            Audio and video lessons, practice quizzes and exams for languages and practical skills,
            from our classrooms in Kigali to your phone.
          </p>
        </div>

        <div>
          <h3>Courses</h3>
          <ul>
            {courses.map((c) => (
              <li key={c.slug}><Link href={`/courses/${c.slug}`}>{c.title}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Academy</h3>
          <ul>
            <li><Link href="/#how-it-works">How it works</Link></li>
            <li><Link href="/#why-us">Why choose us</Link></li>
            <li><Link href="/contact">Contact</Link></li>
            <li><Link href="/signup">Create an account</Link></li>
            <li><Link href="/login">Log in</Link></li>
          </ul>
        </div>

        <div>
          <h3>Get in touch</h3>
          <ul className="contact-list">
            <li><Icon name="phone" size={18} /><a href={site.phoneHref}>{site.phone}</a></li>
            <li><WhatsAppIcon size={18} /><a href={site.whatsappHref} target="_blank" rel="noopener">WhatsApp us</a></li>
            <li><Icon name="mail" size={18} /><a href={`mailto:${site.email}`}>{site.email}</a></li>
            <li><Icon name="pin" size={18} /><span>{site.address}</span></li>
          </ul>
        </div>
      </div>

      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} EduVision Academy. All rights reserved.</span>
        <span className="tagline">{site.tagline}</span>
      </div>
    </footer>
  );
}
