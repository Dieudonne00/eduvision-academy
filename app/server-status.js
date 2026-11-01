"use client";

import { useEffect, useState } from "react";

export default function ServerStatus() {
  const [status, setStatus] = useState("Checking server…");

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then((d) => setStatus(d.ok ? "✅ Server connected" : "⚠️ Server error"))
      .catch(() => setStatus("⚠️ Server not reachable"));
  }, []);

  return <p style={{ marginTop: "1.5rem", fontSize: ".9rem" }}>{status}</p>;
}
