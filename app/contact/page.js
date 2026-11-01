import Image from "next/image";
import Icon, { WhatsAppIcon } from "../_components/icon";
import { site } from "@/lib/site";
import deskPhoto from "@/public/images/front-desk.webp";

export const metadata = {
  title: "Contact",
  description: "Call, WhatsApp, email or visit EduVision Academy in Nyarugenge, Kigali.",
};

export default function ContactPage() {
  return (
    <main>
      <section className="page-hero">
        <div className="container">
          <span className="kicker">Contact</span>
          <h1>We&apos;re here to help</h1>
          <p>Questions about courses, levels or enrolling? Reach us the way that suits you best.</p>
        </div>
      </section>

      <section className="section section-compact">
        <div className="container split contact-split">
          <div className="split-copy">
            <div className="contact-cards stacked">
              <a href={site.phoneHref} className="contact-card">
                <Icon name="phone" /><div><small>Call us</small><strong>{site.phone}</strong></div>
              </a>
              <a href={site.whatsappHref} target="_blank" rel="noopener" className="contact-card whatsapp">
                <WhatsAppIcon /><div><small>WhatsApp</small><strong>Chat with us now</strong></div>
              </a>
              <a href={`mailto:${site.email}`} className="contact-card">
                <Icon name="mail" /><div><small>Email</small><strong>{site.email}</strong></div>
              </a>
              <a href={site.mapHref} target="_blank" rel="noopener" className="contact-card">
                <Icon name="pin" /><div><small>Visit us</small><strong>{site.address}</strong></div>
              </a>
            </div>
          </div>
          <div className="split-media">
            <div className="photo-frame tall">
              <Image src={deskPhoto} alt="The EduVision Academy front desk" placeholder="blur"
                sizes="(max-width: 900px) 100vw, 420px" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
