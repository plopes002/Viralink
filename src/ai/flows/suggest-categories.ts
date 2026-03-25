'use server';

/**
 * @fileOverview An AI agent to suggest categories for a user based on their profile and interactions.
 *
 * - suggestCategories - A function that handles the category suggestion process.
 * - SuggestCategoriesInput - The input type for the suggestCategories function.
 * - SuggestCategoriesOutput - The return type for the suggestCategories function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FALLBACK_KEYWORDS: Record<string, string[]> = {
  professores: ["professor", "professora", "educador", "docente", "ensino", "escola"],
  nutricionistas: ["nutricionista", "nutri", "alimentação", "dieta", "nutrição"],
  empresarios: ["empresário", "empresaria", "empresa", "negócio", "negocios", "empreendedor"],
  maes: ["mãe", "mae", "mamãe", "mamae", "filho", "filha", "bebê", "bebe"],
  noivos: ["noivo", "noiva", "casamento", "casar", "aliança", "alianca"],
  estudantes: ["estudante", "faculdade", "universidade", "curso", "enem"],
  fitness: ["academia", "treino", "fitness", "musculação", "musculacao", "shape"],
  saude: ["saúde", "saude", "clínica", "clinica", "médico", "medico", "terapia"],
  estetica: ["estética", "estetica", "beleza", "pele", "harmonização", "harmonizacao"],
  marketing: ["marketing", "social media", "tráfego", "trafego", "copy", "branding"],
  tecnologia: ["tecnologia", "dev", "programador", "software", "ia", "inteligência artificial"],
};

function fallbackSuggestCategories(text: string): string[] {
  const normalized = text.toLowerCase();
  const found = Object.entries(FALLBACK_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => normalized.includes(kw)))
    .map(([category]) => category);

  return Array.from(new Set(found));
}

const SuggestCategoriesInputSchema = z.object({
  name: z.string().optional(),
  username: z.string().optional(),
  bio: z.string().optional(),
  interactionText: z.string().optional(),
  postTopic: z.string().optional(),
  postTitle: z.string().optional(),
});
export type SuggestCategoriesInput = z.infer<typeof SuggestCategoriesInputSchema>;

const SuggestCategoriesOutputSchema = z.object({
  categories: z.array(z.string()).describe("An array of suggested categories, up to 5."),
});
export type SuggestCategoriesOutput = z.infer<typeof SuggestCategoriesOutputSchema>;

export async function suggestCategories(input: SuggestCategoriesInput): Promise<SuggestCategoriesOutput> {
  return suggestCategoriesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoriesPrompt',
  input: { schema: z.object({ context: z.string() }) },
  output: { schema: SuggestCategoriesOutputSchema },
  prompt: `Você é um classificador de leads para CRM e automação.

Analise o contexto abaixo e sugira categorias úteis para segmentação comercial.
Use apenas categorias curtas, em português, minúsculas, sem explicação.

Exemplos válidos:
professores
nutricionistas
empresarios
maes
noivos
estudantes
fitness
saude
estetica
marketing
tecnologia

Regras:
- Responda em JSON válido no formato especificado.
- Se não houver evidência suficiente, devolva um array vazio.

Contexto:
{{{context}}}
`,
});

const suggestCategoriesFlow = ai.defineFlow(
  {
    name: 'suggestCategoriesFlow',
    inputSchema: SuggestCategoriesInputSchema,
    outputSchema: SuggestCategoriesOutputSchema,
  },
  async (input) => {
    const context = `
Nome: ${input.name || ''}
Username: ${input.username || ''}
Bio: ${input.bio || ''}
Texto da interação: ${input.interactionText || ''}
Tema do conteúdo: ${input.postTopic || ''}
Título do conteúdo: ${input.postTitle || ''}
`.trim();

    try {
        const {output} = await prompt({ context });
        let categories = output?.categories ?? [];
    
        if (categories.length === 0) {
            categories = fallbackSuggestCategories(context);
        }
    
        return { categories: Array.from(new Set(categories)).slice(0, 5) };

    } catch (e) {
        console.error("[suggestCategoriesFlow] AI error, using fallback", e);
        const categories = fallbackSuggestCategories(context);
        return { categories: Array.from(new Set(categories)).slice(0, 5) };
    }
  }
);
