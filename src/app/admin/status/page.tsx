"use client";
import { useState } from "react";

export default function AdminStatusPage() {
  const [health, setHealth] = useState<any>(null);
  const [error, setError] = useState("");

  async function runHealth() {
    setError(""); setHealth(null);
    try {
      const r = await fetch("/api/selftest/health");
      if (!r.ok) { setError(`HTTP ${r.status}`); return; }
      setHealth(await r.json());
    } catch (e: any) { setError(String(e)); }
  }

  return (
    <main style={{ maxWidth: 800, margin: "24px auto", padding: 16 }}>
      <h1 style={{ margin: 0 }}>System Status</h1>
      <button
        onClick={runHealth}
        style={{ marginTop: 12, padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", cursor: "pointer" }}
      >
        Run Quick Checks
      </button>

      {error && <div style={{ marginTop: 12, color: "#b91c1c" }}>Error: {error}</div>}

      {health && (
        <pre style={{ marginTop: 12, background: "#f3f4f6", padding: 12, borderRadius: 8, overflow: "auto" }}>
{JSON.stringify(health, null, 2)}
        </pre>
      )}
    </main>
  );
}
