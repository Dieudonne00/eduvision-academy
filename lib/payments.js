import { createClient } from "./supabase/server";

// MoMo Pay code and merchant name, edited in Admin -> Settings.
export async function getPaymentSettings() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("momo_pay_code, momo_account_name, payment_note").eq("id", 1).maybeSingle();
  return data || { momo_pay_code: "", momo_account_name: "EduVision Academy", payment_note: "" };
}

// MTN Rwanda MoMo Pay: *182*8*1*<pay code>*<amount>#
export function momoUssd(code, amount) {
  return `*182*8*1*${code}*${Math.round(Number(amount))}#`;
}

// tel: link that opens the phone dialer with the code typed in ("#" must be encoded)
export function momoDialHref(code, amount) {
  return `tel:${momoUssd(code, amount).replace(/#/g, "%23")}`;
}

// Latest payment per course for one student: { [courseId]: payment }
export async function latestPayments(supabase, userId, courseIds) {
  if (!courseIds.length) return {};
  const { data } = await supabase
    .from("payments")
    .select("id, course_id, status, transaction_id, amount, currency, admin_note, created_at")
    .eq("user_id", userId)
    .in("course_id", courseIds)
    .order("created_at", { ascending: false });
  const latest = {};
  for (const p of data || []) if (!latest[p.course_id]) latest[p.course_id] = p;
  return latest;
}
