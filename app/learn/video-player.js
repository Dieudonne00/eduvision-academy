"use client";

import { useRef } from "react";

// YouTube player locked inside our site: YouTube's title/share/logo areas are covered,
// the student's name floats over the video, and fullscreen uses our own frame so the
// cover and watermark stay on top.
export default function VideoPlayer({ youtubeId, title, watermark }) {
  const frame = useRef(null);
  const src =
    `https://www.youtube-nocookie.com/embed/${youtubeId}` +
    "?rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&fs=0&color=white";

  function fullscreen() {
    const el = frame.current;
    if (document.fullscreenElement) document.exitFullscreen();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  }

  return (
    <div className="video-frame" ref={frame} onContextMenu={(e) => e.preventDefault()}>
      <iframe
        src={src}
        title={title}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen={false}
      />
      <div className="video-cover-top" aria-hidden="true" />
      <div className="video-cover-logo" aria-hidden="true" />
      <div className="video-watermark" aria-hidden="true">{watermark}</div>
      <button type="button" className="video-fs" onClick={fullscreen} aria-label="Fullscreen">⛶</button>
    </div>
  );
}
