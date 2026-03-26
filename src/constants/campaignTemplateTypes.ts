// src/constants/campaignTemplateTypes.ts
import type { CampaignTemplateType } from "@/types/campaignTemplate";

export const CAMPAIGN_TEMPLATE_TYPES: {
  id: CampaignTemplateType;
  label: string;
  description: string;
}[] = [
  {
    id: "aproximacao",
    label: "Aproximação",
    description:
      "Para iniciar contato com quem interagiu, mas ainda não virou conversa.",
  },
  {
    id: "recuperacao",
    label: "Recuperação",
    description:
      "Para retomar contato com quem já demonstrou interesse anteriormente.",
  },
  {
    id: "mobilizacao",
    label: "Mobilização",
    description:
      "Para ativar base engajada em ações, apoio, compartilhamento ou participação.",
  },
  {
    id: "convite",
    label: "Convite",
    description:
      "Para convidar para evento, grupo, live, reunião ou ação específica.",
  },
  {
    id: "conversao",
    label: "Conversão",
    description:
      "Para levar a pessoa a uma ação concreta, como seguir, responder ou entrar em contato.",
  },
  {
    id: "critica_escuta",
    label: "Crítica / escuta",
    description:
      "Para responder comentários críticos, objeções ou percepções negativas.",
  },
];
