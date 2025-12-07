// src/components/ChatSidebar.tsx
import React, { useState } from "react";
import { useChatStore } from "../state/chatContext";

export const ChatSidebar: React.FC = () => {
  const { state, dispatch } = useChatStore();
  const [newProjectName, setNewProjectName] = useState("");

  const createSession = () => {
    dispatch({ type: "CREATE_SESSION", payload: { projectId: null } });
  };

  const createProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    dispatch({ type: "CREATE_PROJECT", payload: { name } });
    setNewProjectName("");
  };

  return (
    <div
      style={{
        width: 260,
        borderRight: "1px solid #ddd",
        padding: "12px 8px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxSizing: "border-box",
      }}
    >
      <div>
        <button
          onClick={createSession}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #333",
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          + New Chat
        </button>
      </div>

      <div>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Projects</div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          <input
            style={{ flex: 1, padding: "4px 6px", fontSize: 12 }}
            placeholder="New project"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
          />
          <button
            onClick={createProject}
            style={{
              padding: "4px 8px",
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #888",
              cursor: "pointer",
            }}
          >
            +
          </button>
        </div>
        <div style={{ maxHeight: 120, overflowY: "auto", fontSize: 13 }}>
          {state.projects.length === 0 && (
            <div style={{ color: "#888", fontSize: 12 }}>No projects yet</div>
          )}
          {state.projects.map((p) => (
            <div key={p.id} style={{ padding: "2px 0" }}>
              {p.name}
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <div style={{ fontWeight: 600, marginBottom: 4 }}>Chats</div>
        <div style={{ maxHeight: "100%", overflowY: "auto", fontSize: 13 }}>
          {state.sessions.map((s) => {
            const isActive = s.id === state.activeSessionId;
            return (
              <div
                key={s.id}
                onClick={() =>
                  dispatch({
                    type: "SET_ACTIVE_SESSION",
                    payload: { id: s.id },
                  })
                }
                style={{
                  padding: "6px 8px",
                  borderRadius: 6,
                  marginBottom: 4,
                  cursor: "pointer",
                  background: isActive ? "#e5e7eb" : "transparent",
                }}
              >
                <div
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {s.title || "Untitled chat"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#666",
                    marginTop: 2,
                  }}
                >
                  {new Date(s.updatedAt).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
