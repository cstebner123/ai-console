// src/state/chatContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { ChatSession, Project, Message } from "../types";

interface ChatState {
  projects: Project[];
  sessions: ChatSession[];
  activeSessionId: string | null;
}

type Action =
  | { type: "INIT_FROM_STORAGE"; payload: ChatState }
  | { type: "CREATE_SESSION"; payload: { projectId: string | null } }
  | { type: "SET_ACTIVE_SESSION"; payload: { id: string } }
  | { type: "ADD_MESSAGE"; payload: { sessionId: string; message: Message } }
  | { type: "REPLACE_SESSION_MESSAGES"; payload: { sessionId: string; messages: Message[] } }
  | { type: "UPDATE_SESSION_TITLE"; payload: { sessionId: string; title: string } }
  | { type: "CREATE_PROJECT"; payload: { name: string } };

const STORAGE_KEY = "ai_console_state_v1";

const initialState: ChatState = {
  projects: [],
  sessions: [],
  activeSessionId: null,
};

function reducer(state: ChatState, action: Action): ChatState {
  switch (action.type) {
    case "INIT_FROM_STORAGE":
      return action.payload;

    case "CREATE_PROJECT": {
      const project: Project = {
        id: uuidv4(),
        name: action.payload.name,
        createdAt: new Date().toISOString(),
      };
      return { ...state, projects: [project, ...state.projects] };
    }

    case "CREATE_SESSION": {
      const session: ChatSession = {
        id: uuidv4(),
        projectId: action.payload.projectId,
        title: "New chat",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [],
      };
      return {
        ...state,
        sessions: [session, ...state.sessions],
        activeSessionId: session.id,
      };
    }

    case "SET_ACTIVE_SESSION":
      return { ...state, activeSessionId: action.payload.id };

    case "ADD_MESSAGE": {
      const { sessionId, message } = action.payload;
      const sessions = state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages: [...s.messages, message],
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      return { ...state, sessions };
    }

    case "REPLACE_SESSION_MESSAGES": {
      const { sessionId, messages } = action.payload;
      const sessions = state.sessions.map((s) =>
        s.id === sessionId
          ? {
              ...s,
              messages,
              updatedAt: new Date().toISOString(),
            }
          : s
      );
      return { ...state, sessions };
    }

    case "UPDATE_SESSION_TITLE": {
      const { sessionId, title } = action.payload;
      const sessions = state.sessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      );
      return { ...state, sessions };
    }

    default:
      return state;
  }
}

const ChatContext = createContext<{
  state: ChatState;
  dispatch: React.Dispatch<Action>;
} | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate from localStorage once
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ChatState;
        dispatch({ type: "INIT_FROM_STORAGE", payload: parsed });
      } else {
        // bootstrap with one empty session
        dispatch({ type: "CREATE_SESSION", payload: { projectId: null } });
      }
    } catch (e) {
      console.error("Failed to load chat state from storage:", e);
      dispatch({ type: "CREATE_SESSION", payload: { projectId: null } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    // Avoid saving before INIT
    if (!state.sessions.length && state.activeSessionId === null) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  return (
    <ChatContext.Provider value={{ state, dispatch }}>
      {children}
    </ChatContext.Provider>
  );
};

export function useChatStore() {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChatStore must be used within ChatProvider");
  }
  return ctx;
}
