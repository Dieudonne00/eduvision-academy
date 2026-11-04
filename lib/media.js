// Turns a stored audio reference into something the <audio> player can load.
// Uploaded files live in the private "audio" bucket and get a short-lived link;
// the storage rules only issue it to admins and students enrolled in the course.
export async function audioUrl(supabase, path) {
  if (!path) return null;
  if (/^https:\/\//.test(path)) return path;
  const { data } = await supabase.storage.from("audio").createSignedUrl(path, 60 * 60 * 2);
  return data?.signedUrl || null;
}
