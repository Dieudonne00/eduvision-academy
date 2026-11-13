"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { normalizePhone } from "@/lib/phone";

// Free courses (price 0) and "reserve my place" for courses without a fee yet
export async function reserveCourse(formData) {
  const courseId = String(formData.get("course_id") || "");
  const slug = String(formData.get("slug") || "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);

  const { data, error } = await supabase.rpc("request_enrollment", { p_course_id: courseId });
  if (error) redirect(`/checkout/${slug}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/dashboard");
  redirect(`/dashboard?${data.status === "active" ? "enrolled" : "reserved"}=${slug}`);
}

// Student paid with MoMo and sends the transaction ID for an admin to check
export async function submitPayment(_prev, formData) {
  const courseId = String(formData.get("course_id") || "");
  const slug = String(formData.get("slug") || "");
  const transactionId = String(formData.get("transaction_id") || "").trim();
  const phoneRaw = String(formData.get("payer_phone") || "");
  const payerName = String(formData.get("payer_name") || "").trim();
  const values = { transaction_id: transactionId, payer_phone: phoneRaw, payer_name: payerName };

  const phone = normalizePhone(phoneRaw);
  if (!phone) return { error: "Enter the phone number you paid from, e.g. 0788 123 456.", values };
  if (!transactionId) return { error: "Enter the transaction ID from your MoMo SMS.", values };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);

  const { error } = await supabase.rpc("submit_payment", {
    p_course_id: courseId,
    p_transaction_id: transactionId,
    p_payer_phone: phone,
    p_payer_name: payerName,
  });
  if (error) return { error: error.message, values };

  revalidatePath("/dashboard");
  revalidatePath("/admin", "layout");
  redirect(`/dashboard?paid=${slug}`);
}
