// src/types.ts

export type Role = "user" | "assistant"; // can add "system" later if we want

export interface AttachmentRef {
  id: string;
  name: string;
  mimeType: string;
  url?: string;         // future: S3 / signed URL
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  createdAt: string;    // ISO string
  attachments?: AttachmentRef[];
}

export interface ChatSession {
  id: string;
  projectId: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: Message[];
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}
