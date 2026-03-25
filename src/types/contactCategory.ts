// src/types/contactCategory.ts
export interface ContactCategory {
  id: string;
  workspaceId: string;
  slug: string;       // ex: "professores"
  name: string;       // ex: "Professores"
  color?: string | null;
  createdAt: string;
}
