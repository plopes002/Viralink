// src/config/postPresets.ts
import type { ToneId } from "@/config/toneTemplates";
import type { ObjectiveId } from "@/config/postObjectives";

export interface PostPreset {
  id: string;
  label: string;
  descricao: string;
  toneId: ToneId;
  objectiveId: ObjectiveId;
  destaque?: boolean;
}

export const POST_PRESETS: PostPreset[] = [
  {
    id: "oferta-relampago",
    label: "Oferta relâmpago",
    descricao:
      "Focado em urgência e escassez para vender rápido uma promoção limitada.",
    toneId: "urgente",
    objectiveId: "vendas",
    destaque: true,
  },
  {
    id: "autoridade-branding",
    label: "Post de autoridade",
    descricao:
      "Para reforçar posicionamento da marca como referência e fortalecer branding.",
    toneId: "autoridade",
    objectiveId: "branding",
  },
  {
    id: "engajamento-leve",
    label: "Engajamento leve",
    descricao:
      "Post divertido para gerar comentários, reações e compartilhamentos.",
    toneId: "engracado",
    objectiveId: "engajamento",
  },
  {
    id: "educativo-valor",
    label: "Conteúdo educativo",
    descricao:
      "Para ensinar algo útil, gerando autoridade e valor para a audiência.",
    toneId: "educativo",
    objectiveId: "engajamento",
  },
  {
    id: "inspirador-motivacional",
    label: "Motivacional",
    descricao:
      "Para inspirar, motivar e aproximar emocionalmente a audiência da marca.",
    toneId: "inspirador",
    objectiveId: "branding",
  },
];
