import Icon, { WhatsAppIcon } from "../_components/icon";
import { site } from "@/lib/site";

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
        <div className="container contact-layout">
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
            <div className="hours-card">
              <strong>Opening hours</strong>
              <span>Online lessons: any time, 24/7</span>
              <span>Questions & payments: call or WhatsApp us</span>
            </div>
          </div>

          <div className="map-card" id="map">
            <iframe
              className="map-frame"
              title="EduVision Academy location on Google Maps"
              src={site.mapEmbed}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <div className="map-foot">
              <span><Icon name="pin" size={18} /> {site.address}</span>
              <a href={site.mapHref} target="_blank" rel="noopener" className="btn btn-primary btn-sm">Open in Google Maps →</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
