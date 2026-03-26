// src/types/contact.ts
import type { LeadTemperature } from "@/types/engagement";

export type ContactStatus =
  | "novo"
  | "em_contato"
  | "respondeu"
  | "qualificado"
  | "aguardando"
  | "convertido"
  | "sem_interesse";

export interface ContactItem {
  id: string;
  workspaceId: string;

  profileId?: string | null;
  socialAccountId?: string | null;

  name: string;
  username?: string | null;
  avatar?: string | null;

  phone?: string | null;
  email?: string | null;

  network?: "instagram" | "facebook" | "whatsapp" | null;

  categories?: string[];
  interestTags?: string[];
  customTags?: string[];
  operationalTags?: string[];

  leadTemperature?: LeadTemperature;
  leadScore?: number;

  lastInteractionAt?: string | null;
  lastInteractionType?: string | null;
  lastInteractionText?: string | null;

  contactStatus: ContactStatus;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}
