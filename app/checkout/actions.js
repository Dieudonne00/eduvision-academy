"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function reserveCourse(formData) {
  const courseId = String(formData.get("course_id") || "");
  const slug = String(formData.get("slug") || "");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/checkout/${slug}`)}`);

  const { data, error } = await supabase.rpc("request_enrollment", { p_course_id: courseId });
  if (error) redirect(`/checkout/${slug}?error=${encodeURIComponent(error.message)}`);

  redirect(`/dashboard?${data.status === "active" ? "enrolled" : "reserved"}=${slug}`);
}
