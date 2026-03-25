import type { EngagementItem } from "@/types/engagement";

const SEARCH_SYNONYMS: Record<string, string[]> = {
  professores: ["professores", "professor", "professora", "docente", "educador"],
  nutricionistas: ["nutricionistas", "nutricionista", "nutri", "nutricao", "nutrição"],
  empresarios: ["empresarios", "empresário", "empresa", "empreendedor", "negocio", "negócio"],
  maes: ["maes", "mãe", "mae", "mamãe", "filho", "filha"],
  noivos: ["noivos", "noivo", "noiva", "casamento"],
  fitness: ["fitness", "academia", "treino", "musculacao", "musculação"],
};

export function matchesSmartSearch(item: EngagementItem, rawTerm: string) {
  const term = rawTerm.trim().toLowerCase();
  if (!term) return true;

  const variants = SEARCH_SYNONYMS[term] || [term];

  const haystack = [
    item.name,
    item.username,
    item.interactionText,
    item.postTitle,
    item.postTopic,
    ...(item.categories || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return variants.some((variant) => haystack.includes(variant));
}
