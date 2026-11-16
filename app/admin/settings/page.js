import { getPaymentSettings, momoUssd } from "@/lib/payments";
import { saveSettings } from "../actions";
import Flash from "../flash";

export default async function SettingsPage({ searchParams }) {
  const flash = await searchParams;
  const settings = await getPaymentSettings();

  return (
    <>
      <header className="admin-head">
        <h1>Settings</h1>
        <p className="muted">How students pay for courses.</p>
      </header>

      <Flash saved={flash.saved} error={flash.error} />

      <section className="admin-card">
        <h2>MTN MoMo Pay</h2>
        <form action={saveSettings} className="admin-form settings-form">
          <label>
            MoMo Pay code
            <input name="momo_pay_code" inputMode="numeric" defaultValue={settings.momo_pay_code} placeholder="e.g. 123456" />
            <small className="hint">Your merchant code. Students will dial {momoUssd(settings.momo_pay_code || "CODE", 25000)} (for a 25,000 RWF course).</small>
          </label>
          <label>
            Merchant name shown to students
            <input name="momo_account_name" defaultValue={settings.momo_account_name} placeholder="EduVision Academy" />
            <small className="hint">The name students see on their phone when paying, so they know it&apos;s you.</small>
          </label>
          <label>
            Registration fee (RWF)
            <input name="registration_fee" inputMode="numeric" defaultValue={Number(settings.registration_fee || 0)} placeholder="10000" />
            <small className="hint">Paid once, added to a student&apos;s first course payment. Use 0 for none.</small>
          </label>
          <label>
            Extra note on the payment page <span className="hint">(optional)</span>
            <textarea name="payment_note" rows={2} defaultValue={settings.payment_note}
              placeholder="e.g. Payments are confirmed within 2 hours, Monday to Saturday." />
          </label>
          <div><button type="submit" className="btn btn-primary">Save settings</button></div>
        </form>
      </section>
    </>
  );
}
