import React, { useMemo, useState } from "react";
import { useChatStore } from "../state/chatContext";
import { streamQuery } from "../api";
import type { Message } from "../types";
import { v4 as uuidv4 } from "uuid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export const ChatView: React.FC = () => {
  const { state, dispatch } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState<string | undefined>(undefined);
  const [thinkingText, setThinkingText] = useState("");

  const activeSession = useMemo(
    () => state.sessions.find((s) => s.id === state.activeSessionId) ?? null,
    [state.sessions, state.activeSessionId]
  );

  const messages: Message[] = activeSession?.messages ?? [];

 async function send() {
  if (!input.trim() || loading || !activeSession) return;

  const sessionId = activeSession.id;
  const userText = input.trim();
  setInput("");
  setLoading(true);
  setThinkingText("");

  const now = new Date().toISOString();

  // 🔹 Build short-term conversation memory from prior messages
  const priorMessages = activeSession.messages;
  const contextLines = priorMessages
    .map((m) => {
      const who = m.role === "user" ? "User" : "Assistant";
      return `${who}: ${m.content}`;
    })
    .join("\n");

  // 🔹 Final prompt that includes memory + latest turn
  const fullPrompt = contextLines
    ? `${contextLines}\nUser: ${userText}\nAssistant:`
    : userText;

  const userMessageId = uuidv4();
  const assistantMessageId = uuidv4();

  // 1) Add user message
  dispatch({
    type: "ADD_MESSAGE",
    payload: {
      sessionId,
      message: {
        id: userMessageId,
        role: "user",
        content: userText,
        createdAt: now,
      },
    },
  });

  // 2) Add placeholder assistant message (to be filled during stream)
  dispatch({
    type: "ADD_MESSAGE",
    payload: {
      sessionId,
      message: {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString(),
      },
    },
  });

  try {
    let answerText = "";
    let thinkingAccum = "";

    // 🔹 Use fullPrompt instead of userText
    for await (const chunk of streamQuery(fullPrompt, model)) {
      if (chunk.isThinking) {
        thinkingAccum += chunk.text;
        setThinkingText(thinkingAccum);
      } else {
        answerText += chunk.text;

        dispatch({
          type: "UPDATE_MESSAGE",
          payload: {
            sessionId,
            messageId: assistantMessageId,
            patch: { content: answerText },
          },
        });

        // Update session title based on first response
        const currentSession =
          state.sessions.find((s) => s.id === sessionId) ?? activeSession;
        if (currentSession.title === "New chat" && answerText.length > 20) {
          dispatch({
            type: "UPDATE_SESSION_TITLE",
            payload: {
              sessionId,
              title: answerText.slice(0, 60),
            },
          });
        }
      }
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    dispatch({
      type: "UPDATE_MESSAGE",
      payload: {
        sessionId,
        messageId: assistantMessageId,
        patch: { content: `Error: ${msg}` },
      },
    });
  } finally {
    setLoading(false);
  }
}


  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!activeSession) {
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        }}
      >
        <div>No active session. Create a new chat from the sidebar.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        padding: 16,
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
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
          <div style={{ fontWeight: 600 }}>{activeSession.title}</div>
          <div style={{ fontSize: 12, color: "#666" }}>
            Session ID: {activeSession.id}
          </div>
        </div>
        <div>
          <select
            value={model ?? ""}
            onChange={(e) => setModel(e.target.value || undefined)}
            style={{ padding: "4px 8px", fontSize: 12 }}
          >
            <option value="">Default model</option>
            <option value="llama3">llama3</option>
            <option value="gpt-oss">gpt-oss</option>
          </select>
        </div>
      </header>

      {/* Thinking panel */}
      {(thinkingText || (loading && model === "gpt-oss")) && (
        <div
          style={{
            marginBottom: 8,
            padding: 8,
            borderRadius: 8,
            background: "#f3f4f6",
            border: "1px dashed #9ca3af",
            fontSize: 12,
            color: "#4b5563",
            maxHeight: 120,
            overflowY: "auto",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Thinking</div>
          <div style={{ whiteSpace: "pre-wrap" }}>
            {thinkingText || "…"}
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "8px 4px",
          marginBottom: 12,
        }}
      >
        {messages.length === 0 && (
          <div style={{ color: "#777", fontSize: 14 }}>
            Start the conversation by sending a message.
          </div>
        )}
  {messages.map((m) => (
  <div
    key={m.id}
    style={{
      display: "flex",
      justifyContent: m.role === "user" ? "flex-end" : "flex-start",
      marginBottom: 8,
    }}
  >
    <div
      style={{
        maxWidth: "70%",
        padding: "8px 10px",
        borderRadius: 10,
        background: m.role === "user" ? "#111827" : "#e5e7eb",
        color: m.role === "user" ? "#f9fafb" : "#111827",
        fontSize: 14,
        whiteSpace: "pre-wrap",
      }}
    >
      {m.role === "assistant" ? (
        m.content ? (
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}
          >
            {m.content}
          </ReactMarkdown>
        ) : (
          loading && "…"
        )
      ) : (
        // user messages stay plain text
        m.content
      )}
    </div>
  </div>
))}
      </div>

      {/* Input */}
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
          onKeyDown={handleKeyDown}
          disabled={loading}
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
    </div>
  );
};
