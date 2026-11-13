"use client";

import { useActionState } from "react";
import { submitPayment } from "./actions";

// "I have paid" form: transaction ID from the MoMo SMS + the phone number used.
export default function PaymentForm({ courseId, slug, defaultPhone }) {
  const [state, action, pending] = useActionState(submitPayment, null);
  const values = state?.values || {};

  return (
    <form action={action} className="pay-form">
      <input type="hidden" name="course_id" value={courseId} />
      <input type="hidden" name="slug" value={slug} />
      <label>
        Transaction ID <span className="hint">(from the MoMo confirmation SMS)</span>
        <input name="transaction_id" defaultValue={values.transaction_id} placeholder="e.g. 18476253904"
          autoComplete="off" autoCapitalize="characters" required />
      </label>
      <div className="form-row">
        <label className="grow">
          Phone number you paid from
          <input name="payer_phone" type="tel" inputMode="tel" defaultValue={values.payer_phone ?? defaultPhone}
            placeholder="0788 123 456" required />
        </label>
        <label className="grow">
          Name on the MoMo account <span className="hint">(optional)</span>
          <input name="payer_name" defaultValue={values.payer_name} placeholder="If different from yours" />
        </label>
      </div>
      {state?.error && <p className="error" role="alert">{state.error}</p>}
      <button type="submit" className="btn btn-primary btn-lg" disabled={pending}>
        {pending ? "Sending…" : "I have paid: send for confirmation"}
      </button>
    </form>
  );
}
