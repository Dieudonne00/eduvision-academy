"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Resize an image in the browser so thumbnails stay small and fast (max 1200px wide).
// Returns null if this browser can't (e.g. iPhone HEIC photos); the caller then uploads the original.
async function resizeImage(file, maxWidth = 1200) {
  try {
    const img = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = URL.createObjectURL(file);
    });
    const scale = Math.min(1, maxWidth / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(img.src);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    return blob && blob.size > 0 ? blob : null;
  } catch {
    return null;
  }
}

function randomId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

// Uploads straight from the browser to Supabase Storage (so big files never pass through our server)
// and puts the result in a hidden form field called `name`:
//   image -> public URL of the thumbnail
//   audio -> storage path "<folder>/<file>" (played later through a short-lived private link)
export default function FileUpload({ kind, name, folder = "", defaultValue = "", onBusyChange }) {
  const isImage = kind === "image";
  const bucket = isImage ? "thumbnails" : "audio";
  const maxMB = isImage ? 25 : 50; // big photos are shrunk before upload

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
      let body = file;
      let contentType = file.type || (isImage ? "image/jpeg" : "audio/mpeg");
      let ext = (file.name.split(".").pop() || (isImage ? "jpg" : "mp3")).toLowerCase();

      if (isImage) {
        const resized = await resizeImage(file);
        if (resized) {
          body = resized;
          contentType = "image/jpeg";
          ext = "jpg";
        } else if (!IMAGE_TYPES.includes(file.type) || file.size > 5 * 1024 * 1024) {
          throw new Error("This photo format can't be used. Please choose a JPG or PNG image (under 5 MB).");
        }
      }

      const path = `${folder ? `${folder}/` : ""}${randomId()}.${ext}`;
      const supabase = createClient();
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, body, { contentType, upsert: false });
      if (upErr) {
        if (/mime type/i.test(upErr.message)) {
          throw new Error(isImage ? "Please choose a JPG, PNG or WebP image." : "Please choose an MP3, M4A, WAV or OGG audio file.");
        }
        if (/row-level security|unauthorized|jwt/i.test(upErr.message)) {
          throw new Error("Your login has expired. Please refresh the page and log in again.");
        }
        throw upErr;
      }

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
