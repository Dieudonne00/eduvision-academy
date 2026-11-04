"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Resize an image in the browser so thumbnails stay small and fast (max 1200px wide, WebP).
async function resizeImage(file, maxWidth = 1200) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxWidth / bitmap.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d").drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
}

// Uploads straight from the browser to Supabase Storage (so big files never pass through our server)
// and puts the result in a hidden form field called `name`:
//   image -> public URL of the thumbnail
//   audio -> storage path "<folder>/<file>" (played later through a short-lived private link)
export default function FileUpload({ kind, name, folder = "", defaultValue = "", onBusyChange }) {
  const isImage = kind === "image";
  const bucket = isImage ? "thumbnails" : "audio";
  const maxMB = isImage ? 5 : 50;

  const input = useRef(null);
  const [value, setValue] = useState(defaultValue);
  const [label, setLabel] = useState(defaultValue && !isImage ? "Audio file uploaded" : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function setBusyState(b) {
    setBusy(b);
    onBusyChange?.(b);
  }

  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    if (file.size > maxMB * 1024 * 1024) {
      setError(`That file is ${(file.size / 1024 / 1024).toFixed(0)} MB. The limit is ${maxMB} MB.`);
      return;
    }

    setBusyState(true);
    try {
      const body = isImage ? await resizeImage(file) : file;
      const ext = isImage ? "webp" : (file.name.split(".").pop() || "mp3").toLowerCase();
      const path = `${folder ? `${folder}/` : ""}${crypto.randomUUID()}.${ext}`;
      const contentType = isImage ? "image/webp" : file.type || "audio/mpeg";

      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
      if (upErr) throw upErr;

      if (isImage) {
        setValue(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
      } else {
        setValue(path);
        setLabel(`${file.name} · ${(file.size / 1024 / 1024).toFixed(1)} MB`);
      }
    } catch (err) {
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setBusyState(false);
    }
  }

  return (
    <div className={`upload ${isImage ? "upload-image" : "upload-audio"}`}>
      <input type="hidden" name={name} value={value} />
      <input ref={input} type="file" accept={isImage ? "image/*" : "audio/*"} onChange={onPick} hidden />

      {isImage ? (
        <button type="button" className="thumb-drop" onClick={() => input.current?.click()} disabled={busy}>
          {value ? <img src={value} alt="Course thumbnail" /> : <span>🖼️<br />Click to upload a thumbnail</span>}
          {busy && <span className="upload-busy">Uploading…</span>}
        </button>
      ) : (
        <div className="audio-drop">
          <span className="audio-file">{busy ? "Uploading… please wait" : label || "No file yet"}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => input.current?.click()} disabled={busy}>
            {value ? "Replace file" : "Choose audio file"}
          </button>
        </div>
      )}
      {isImage && value && !busy && (
        <button type="button" className="link-btn small" onClick={() => input.current?.click()}>Change image</button>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
