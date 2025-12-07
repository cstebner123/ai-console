// src/App.tsx
import React, { useState } from "react";
import { streamQuery } from "./api";

export default function App() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function send() {
    if (!input.trim() || loading) return;

    setLoading(true);
    setOutput("");

    try {
      for await (const chunk of streamQuery(input)) {
        setOutput((prev) => prev + chunk);
      }
    } catch (err: any) {
      setOutput("Error: " + (err?.message ?? String(err)));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>AI Orchestrator Console</h1>

      <textarea
        style={{ width: "100%", height: 100 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Ask something..."
      />

      <button onClick={send} disabled={loading}>
        {loading ? "Thinking..." : "Send"}
      </button>

      <pre style={{ marginTop: 24, whiteSpace: "pre-wrap" }}>
        {output}
      </pre>
    </div>
  );
}
