import Image from "next/image";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { site } from "@/lib/site";
import logo from "@/public/images/logo.png";
import PrintButton from "./print-button";

async function load(code) {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_certificate", { p_code: code });
  return Array.isArray(data) ? data[0] : data;
}

export async function generateMetadata({ params }) {
  const cert = await load((await params).code);
  return cert
    ? { title: `Certificate · ${cert.full_name}`, description: `${cert.full_name} completed ${cert.course_title} at EduVision Academy.` }
    : { title: "Certificate not found" };
}

// Public, printable certificate. The code on it lets anyone verify it at this address.
export default async function CertificatePage({ params }) {
  const { code } = await params;
  const cert = await load(code);
  if (!cert) notFound();

  const date = new Date(cert.issued_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  return (
    <main className="cert-page">
      <div className="cert-toolbar">
        <span className="verified">✓ Verified certificate issued by EduVision Academy</span>
        <PrintButton />
      </div>

      <article className="certificate">
        <div className="cert-border">
          <Image src={logo} alt="EduVision Academy" width={190} className="cert-logo" priority />
          <p className="cert-kicker">Certificate of Completion</p>
          <p className="cert-small">This certifies that</p>
          <h1 className="cert-name">{cert.full_name}</h1>
          <p className="cert-small">has successfully completed the course</p>
          <h2 className="cert-course">{cert.course_title}</h2>
          <p className="cert-small">and passed the final exam with a score of <strong>{Math.round(Number(cert.score))}%</strong></p>

          <div className="cert-foot">
            <div>
              <span className="cert-line" />
              <strong>{date}</strong>
              <small>Date of issue</small>
            </div>
            <div className="cert-seal" aria-hidden="true">
              <span>EDUVISION<br />ACADEMY</span>
            </div>
            <div>
              <span className="cert-line" />
              <strong>Director</strong>
              <small>EduVision Academy</small>
            </div>
          </div>

          <p className="cert-code">
            Certificate ID <strong>{cert.code}</strong> · verify at eduvisionacademy.com/certificates/{cert.code}
          </p>
          <p className="cert-tagline">{site.tagline}</p>
        </div>
      </article>
    </main>
  );
}
