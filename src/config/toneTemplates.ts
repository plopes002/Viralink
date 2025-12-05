export type ToneId =
  | "engracado"
  | "profissional"
  | "direto"
  | "emocional"
  | "agressivo"
  | "funil"
  | "autoridade"
  | "educativo"
  | "inspirador"
  | "urgente";

export interface ToneTemplate {
  id: ToneId;
  label: string;
  descricao: string;
  instrucoesEstilo: string[];
  instrucoesCTA: string;
}

export const TONE_TEMPLATES: Record<ToneId, ToneTemplate> = {
  engracado: {
    id: "engracado",
    label: "Engraçado / leve",
    descricao:
      "Tom leve, bem-humorado, com piadinhas sutis, sem perder a clareza da mensagem.",
    instrucoesEstilo: [
      "Use humor de forma natural, sem exagerar ou parecer forçado.",
      "Use perguntas divertidas para puxar atenção.",
      "Evite sarcasmo pesado ou piadas ofensivas.",
      "Use emojis pontuais para reforçar o humor (sem exagero).",
    ],
    instrucoesCTA:
      "Feche incentivando a interação com algo leve (comentário, reação ou compartilhamento).",
  },

  profissional: {
    id: "profissional",
    label: "Profissional / consultivo",
    descricao:
      "Tom sério, consultivo, que passa segurança, autoridade e organização.",
    instrucoesEstilo: [
      "Use linguagem clara e objetiva, sem gírias.",
      "Mostre que a marca domina o assunto, mas sem ser arrogante.",
      "Use exemplos práticos e benefícios concretos.",
    ],
    instrucoesCTA:
      "Feche incentivando contato, mensagem direta ou clique em link para saber mais.",
  },

  direto: {
    id: "direto",
    label: "Direto ao ponto",
    descricao:
      "Tom enxuto, focado em resultado, sem rodeios ou enrolação.",
    instrucoesEstilo: [
      "Vá direto ao problema e à solução logo no início.",
      "Frases curtas, leitura rápida, com foco em benefício.",
      "Evite metáforas e floreios; privilegie clareza.",
    ],
    instrucoesCTA:
      "Feche com um CTA claro e objetivo (faça X agora / clique aqui / chame no direct).",
  },

  emocional: {
    id: "emocional",
    label: "Emocional",
    descricao:
      "Tom que conversa com dores, desejos e vulnerabilidades do público de forma empática.",
    instrucoesEstilo: [
      "Comece com uma situação que gere identificação.",
      "Mostre empatia com as dificuldades do público.",
      "Construa uma virada positiva mostrando como a solução ajuda.",
    ],
    instrucoesCTA:
      "Feche convidando o público a se abrir (comentar, compartilhar histórias, mandar mensagem).",
  },

  agressivo: {
    id: "agressivo",
    label: "Agressivo de marketing",
    descricao:
      "Tom forte, de impacto, usando gatilhos comerciais intensos (sem ser ofensivo).",
    instrucoesEstilo: [
      "Use frases fortes que desafiem o leitor (sem atacar pessoas).",
      "Mostre o contraste entre continuar parado e agir agora.",
      "Use afirmações diretas e posicionamento firme.",
    ],
    instrucoesCTA:
      "Feche com um CTA incisivo, reforçando decisão (tome uma atitude, mude hoje, vire o jogo).",
  },

  funil: {
    id: "funil",
    label: "Funil / conversão",
    descricao:
      "Tom voltado para jornada de venda: conscientizar, gerar interesse, desejo e ação.",
    instrucoesEstilo: [
      "Comece apresentando o problema ou oportunidade.",
      "Mostre prova social ou autoridade (resultados, experiência, bastidores).",
      "Explique rapidamente a solução e destaque 2–3 benefícios chave.",
    ],
    instrucoesCTA:
      "Feche com CTA claro para o próximo passo do funil (comentário, direct, cadastro, link).",
  },

  autoridade: {
    id: "autoridade",
    label: "Autoridade / especialista",
    descricao:
      "Tom que posiciona a marca como referência no assunto, ensinando algo valioso.",
    instrucoesEstilo: [
      "Traga 2–3 insights práticos pouco óbvios.",
      "Use dados, fatos ou experiências reais para reforçar autoridade.",
      "Explique de forma simples, como se estivesse ensinando um cliente.",
    ],
    instrucoesCTA:
      "Feche convidando a seguir o perfil ou salvar o post para aprender mais com a marca.",
  },

  educativo: {
    id: "educativo",
    label: "Educativo / didático",
    descricao:
      "Tom focado em ensinar, destrinchando conceitos de forma fácil.",
    instrucoesEstilo: [
      "Explique como se estivesse ensinando alguém leigo.",
      "Use listas, passos ou exemplos simples.",
      "Evite termos técnicos sem explicação.",
    ],
    instrucoesCTA:
      "Feche incentivando a salvar o conteúdo ou compartilhar com alguém que precisa aprender aquilo.",
  },

  inspirador: {
    id: "inspirador",
    label: "Inspirador / motivacional",
    descricao:
      "Tom que inspira ação, confiança e mudança, com foco em superação e progresso.",
    instrucoesEstilo: [
      "Use frases que elevem o leitor, mostrando que ele é capaz de mudar a própria realidade.",
      "Conte uma micro-história de superação ou transformação (real ou genérica).",
      "Use metáforas leves relacionadas a jornada, caminho, evolução.",
      "Mantenha o equilíbrio entre motivação e objetividade (sem clichês em excesso).",
    ],
    instrucoesCTA:
      "Feche convidando a pessoa a dar um passo concreto (começar hoje, tentar de novo, não desistir), ou a compartilhar com alguém que precise de motivação.",
  },

  urgente: {
    id: "urgente",
    label: "Urgente (escassez / oferta relâmpago)",
    descricao:
      "Tom focado em tempo curto, escassez e oportunidade imediata, ideal para ofertas relâmpago.",
    instrucoesEstilo: [
      "Deixe CLARO logo no início que é algo por tempo limitado ou vagas limitadas.",
      "Use palavras de urgência (hoje, agora, últimos, acaba em X horas) de forma estratégica.",
      "Mostre o que a pessoa perde se não agir (perda de desconto, bônus, condição especial).",
      "Mantenha o texto curto e ágil, fácil de ler em poucos segundos.",
    ],
    instrucoesCTA:
      "Feche com CTA extremamente direto e urgente (garanta agora, clique antes de acabar, últimas vagas).",
  },
};

export function getToneTemplateById(toneId: ToneId): ToneTemplate {
  return TONE_TEMPLATES[toneId] ?? TONE_TEMPLATES.profissional;
}
