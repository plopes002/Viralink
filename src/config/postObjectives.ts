// src/config/postObjectives.ts

export type ObjectiveId =
  | "engajamento"
  | "vendas"
  | "educacao"
  | "branding"
  | "trafego";

export interface ObjectiveTemplate {
  id: ObjectiveId;
  label: string;
  descricao: string;
  focoPrincipal: string;
  instrucoesEstilo: string[];
  instrucoesCTA: string;
}

export const POST_OBJECTIVES: Record<ObjectiveId, ObjectiveTemplate> = {
  engajamento: {
    id: "engajamento",
    label: "Gerar engajamento",
    descricao: "Ideal para criar conversas, receber comentários e reações.",
    focoPrincipal: "Interação e comunidade",
    instrucoesEstilo: [
      "Faça perguntas abertas que incentivem respostas longas.",
      "Crie conteúdo polêmico (de forma saudável) ou que gere debate.",
      "Peça a opinião do público sobre o tema.",
    ],
    instrucoesCTA: "Peça para comentar, marcar amigos ou compartilhar.",
  },
  vendas: {
    id: "vendas",
    label: "Gerar vendas",
    descricao: "Foco em conversão, levando o usuário para uma oferta.",
    focoPrincipal: "Conversão e oferta",
    instrucoesEstilo: [
      "Destaque o problema que o produto/serviço resolve.",
      "Apresente a solução e seus 2-3 principais benefícios de forma clara.",
      "Use gatilhos de urgência ou escassez, se aplicável.",
      "Mostre provas sociais (depoimentos, resultados), se tiver.",
    ],
    instrucoesCTA:
      "CTA direto para a ação de compra: 'Clique no link', 'Chame no direct', 'Garanta o seu'.",
  },
  educacao: {
    id: "educacao",
    label: "Educar o público",
    descricao: "Para ensinar algo, quebrar objeções ou explicar um conceito.",
    focoPrincipal: "Clareza e autoridade",
    instrucoesEstilo: [
      "Divida o conteúdo em passos, dicas ou listas fáceis de seguir.",
      "Use analogias para simplificar temas complexos.",
      "Antecipe e responda a dúvidas comuns sobre o tema.",
    ],
    instrucoesCTA: "Peça para salvar o post para consultar depois.",
  },
  branding: {
    id: "branding",
    label: "Reforçar a marca",
    descricao: "Para mostrar os valores, a missão ou os bastidores da marca.",
    focoPrincipal: "Conexão e valores",
    instrucoesEstilo: [
      "Conte uma história sobre a origem da marca ou de um produto.",
      "Mostre os bastidores do dia a dia da empresa.",
      "Destaque um valor ou princípio importante para a marca.",
    ],
    instrucoesCTA:
      "Peça para as pessoas contarem se concordam com os valores da marca.",
  },
  trafego: {
    id: "trafego",
    label: "Levar tráfego (site/blog)",
    descricao: "Gerar curiosidade para que o usuário saia da rede social.",
    focoPrincipal: "Curiosidade e clique",
    instrucoesEstilo: [
      "Crie uma 'ponte' para o conteúdo externo: dê uma prévia do que a pessoa vai encontrar.",
      "Use títulos que gerem curiosidade ou uma promessa forte.",
      "Não entregue todo o conteúdo no post; deixe claro que o valor principal está no link.",
    ],
    instrucoesCTA: "CTA único e claro: 'Clique no link da bio', 'Leia mais no blog'.",
  },
};

export function getObjectiveById(objectiveId: ObjectiveId): ObjectiveTemplate {
  return POST_OBJECTIVES[objectiveId] ?? POST_OBJECTIVES.engajamento;
}