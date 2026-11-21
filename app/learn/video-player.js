"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// EduVision video player on top of a YouTube video.
// Students only ever see our cover, our controls and their own name watermark:
//  - YouTube's controls are off and the strips where YouTube draws its title,
//    channel and "Watch on YouTube" link are cropped out of view;
//  - our cover is shown before playing, when paused and at the end, so YouTube's
//    pause screen and "More videos" never appear;
//  - clicks on the picture go to our player, never to YouTube.

let apiPromise;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) {
    apiPromise = new Promise((resolve, reject) => {
      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previous?.();
        resolve(window.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return apiPromise;
}

const fmt = (sec) => {
  const s = Math.max(0, Math.floor(sec || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${r}` : `${m}:${r}`;
};
const SPEEDS = [0.75, 1, 1.25, 1.5];

export default function VideoPlayer({ youtubeId, title, watermark }) {
  const frame = useRef(null);
  const mount = useRef(null);
  const player = useRef(null);
  const startTimer = useRef(null);

  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | starting | playing | buffering | paused | ended | tap
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // YouTube replaces the element it's given, so hand it one React doesn't manage
    const host = document.createElement("div");
    mount.current?.appendChild(host);
    loadYouTubeApi()
      .then((YT) => {
        if (cancelled) return;
        player.current = new YT.Player(host, {
          videoId: youtubeId,
          host: "https://www.youtube-nocookie.com",
          playerVars: { controls: 0, disablekb: 1, fs: 0, rel: 0, modestbranding: 1, playsinline: 1, iv_load_policy: 3, cc_load_policy: 0 },
          events: {
            onReady: (e) => {
              setReady(true);
              setDuration(e.target.getDuration() || 0);
            },
            onStateChange: (e) => {
              const S = YT.PlayerState;
              if (e.data === S.PLAYING) {
                clearTimeout(startTimer.current);
                setStatus("playing");
              } else if (e.data === S.PAUSED) setStatus((s) => (s === "tap" ? s : "paused"));
              else if (e.data === S.ENDED) setStatus("ended");
              else if (e.data === S.BUFFERING) setStatus((s) => (s === "playing" ? "buffering" : s));
            },
            onError: () => setFailed(true),
          },
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
      clearTimeout(startTimer.current);
      player.current?.destroy?.();
      player.current = null;
      if (mount.current) mount.current.innerHTML = "";
    };
  }, [youtubeId]);

  // Keep the time and progress bar moving while the video plays
  useEffect(() => {
    if (status !== "playing" && status !== "buffering") return;
    const t = setInterval(() => {
      const p = player.current;
      if (!p?.getCurrentTime) return;
      setTime(p.getCurrentTime());
      setDuration(p.getDuration() || 0);
    }, 250);
    return () => clearInterval(t);
  }, [status]);

  const play = useCallback(() => {
    const p = player.current;
    if (!p?.playVideo) return;
    if (status === "ended") p.seekTo(0, true);
    p.playVideo();
    setStatus("starting");
    // Some phones only start a video when the tap lands on the video itself:
    // if it hasn't started shortly, uncover the picture so the student can tap it.
    clearTimeout(startTimer.current);
    startTimer.current = setTimeout(() => setStatus((s) => (s === "starting" ? "tap" : s)), 1800);
  }, [status]);

  const pause = () => player.current?.pauseVideo?.();
  const toggle = () => (status === "playing" || status === "buffering" ? pause() : play());

  const seekTo = (sec) => {
    const s = Math.min(Math.max(0, sec), duration || sec);
    player.current?.seekTo?.(s, true);
    setTime(s);
  };

  const toggleMute = () => {
    const p = player.current;
    if (!p) return;
    if (muted) p.unMute(); else p.mute();
    setMuted(!muted);
  };

  const cycleSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    player.current?.setPlaybackRate?.(next);
    setSpeed(next);
  };

  const fullscreen = () => {
    const el = frame.current;
    if (document.fullscreenElement) document.exitFullscreen();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  };

  const onKey = (e) => {
    if (e.key === " " || e.key === "k") { e.preventDefault(); toggle(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); seekTo(time + 5); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); seekTo(time - 5); }
    else if (e.key === "f") fullscreen();
    else if (e.key === "m") toggleMute();
  };

  const showCover = ["idle", "starting", "paused", "ended"].includes(status);
  const running = status === "playing" || status === "buffering";
  const started = status !== "idle";
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <div
      className={`vp ${running ? "is-playing" : ""}`}
      ref={frame}
      tabIndex={0}
      onKeyDown={onKey}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={`Video: ${title}`}
    >
      <div className="vp-crop" ref={mount} />

      {/* Clicks on the picture control our player, never YouTube */}
      {running && <button type="button" className="vp-catch" onClick={pause} aria-label="Pause" />}
      {status === "buffering" && <span className="vp-spinner" aria-hidden="true" />}

      {showCover && (
        <div className={`vp-cover ${status}`}>
          <span className="vp-chapter">{title}</span>
          {failed ? (
            <p className="vp-msg">This video can&apos;t be played right now. Please try again later or contact us.</p>
          ) : (
            <button type="button" className="vp-big-play" onClick={play} disabled={!ready} aria-label={status === "ended" ? "Watch again" : "Play"}>
              {!ready || status === "starting" ? <span className="vp-spinner static" /> : status === "ended" ? "↻" : "▶"}
            </button>
          )}
          <span className="vp-state">
            {!ready ? "Loading video…" : status === "paused" ? `Paused · ${fmt(time)} / ${fmt(duration)}` : status === "ended" ? "Finished · watch again" : duration ? fmt(duration) : ""}
          </span>
        </div>
      )}
      {status === "tap" && <div className="vp-tap">Tap the video to start ▶</div>}

      <div className="vp-watermark" aria-hidden="true">{watermark}</div>

      {started && !failed && (
        <div className="vp-bar">
          <button type="button" onClick={toggle} aria-label={running ? "Pause" : "Play"}>{running ? "❚❚" : "▶"}</button>
          <button type="button" onClick={() => seekTo(time - 10)} aria-label="Back 10 seconds" className="vp-small">↺10</button>
          <span className="vp-time">{fmt(time)} / {fmt(duration)}</span>
          <input
            type="range"
            className="vp-seek"
            min={0}
            max={Math.max(1, Math.floor(duration))}
            step={1}
            value={Math.floor(time)}
            onChange={(e) => seekTo(Number(e.target.value))}
            style={{ "--p": `${progress}%` }}
            aria-label="Seek"
          />
          <button type="button" onClick={cycleSpeed} className="vp-small" aria-label="Playback speed">{speed}×</button>
          <button type="button" onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}>{muted ? "🔇" : "🔊"}</button>
          <button type="button" onClick={fullscreen} aria-label="Fullscreen">⛶</button>
        </div>
      )}
    </div>
  );
}
