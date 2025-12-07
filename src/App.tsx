// src/App.tsx
import React from "react";
import { ChatSidebar } from "./components/ChatSidebar";
import { ChatView } from "./components/ChatView";

const App: React.FC = () => {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <ChatSidebar />
      <ChatView />
    </div>
  );
};

export default App;
