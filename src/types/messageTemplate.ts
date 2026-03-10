// src/types/messageTemplate.ts
export interface MessageTemplate {
    id: string;
    workspaceId: string;
    name: string;
    description: string;
    channel: string; // e.g., 'instagram_dm'
    network: string; // e.g., 'instagram'
    content: string;
    createdAt: string; // ISO
    updatedAt: string; // ISO
  }
