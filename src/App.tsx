// src/App.tsx
import React, { useMemo, useState } from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { useChatStore } from "./state/chatContext";
import { streamQuery } from "./api";

const App: React.FC = () => {
  const { state } = useChatStore();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  const activeSession = useMemo(
    () => state.sessions.find((s) => s.id === state.activeSessionId) ?? null,
    [state.sessions, state.activeSessionId]
  );

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
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Left sidebar */}
      <ChatSidebar />

      {/* Main chat area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          padding: 16,
          boxSizing: "border-box",
        }}
      >
        <header
          style={{
            paddingBottom: 8,
            marginBottom: 8,
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>
              {activeSession?.title ?? "AI Orchestrator Console"}
            </div>
            <div style={{ fontSize: 12, color: "#666" }}>
              Session ID: {activeSession?.id ?? "none"}
            </div>
          </div>
        </header>

        <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <div style={{ flex: 1, overflowY: "auto", marginBottom: 12 }}>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                background: "#f5f5f5",
                padding: 12,
                borderRadius: 8,
                minHeight: 120,
              }}
            >
              {output || "Model output will appear here."}
            </pre>
          </div>

          <div>
            <textarea
              style={{
                width: "100%",
                minHeight: 80,
                padding: 8,
                boxSizing: "border-box",
                marginBottom: 8,
              }}
              placeholder="Ask something..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                padding: "8px 16px",
                borderRadius: 6,
                border: "1px solid #333",
                background: loading ? "#888" : "#111",
                color: "#fff",
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "Thinking..." : "Send"}
            </button>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
