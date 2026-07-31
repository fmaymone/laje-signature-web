export type CookingRequest = {
  objective: string;
  ingredients: string[];
  servings: number;
  equipment: string[];
  restrictions: string[];
  available_time_minutes?: number | null;
};

export type RecipeComponent = {
  name: string;
  purpose: string;
  ingredients: string[];
  instructions: string[];
  critical_points: string[];
};

export type FinalRecipe = {
  title: string;
  concept: string;
  servings: number;
  components: RecipeComponent[];
  equipment: string[];
  mise_en_place: string[];
  timeline: string[];
  plating: string[];
  critical_points: string[];
  substitutions: string[];
  conservation: string[];
  why_this_matches_fernando: string[];
  revision_warning?: string | null;
};

export type RecipeMeta = {
  blocks: string[];
  catalog_picks: Record<string, unknown>[];
  seasonality_notes: string[];
  score?: number | null;
  approved?: boolean | null;
  revisions: number;
};

export type GenerateRecipeResponse = {
  request: CookingRequest;
  recipe: FinalRecipe;
  meta: RecipeMeta;
};

export type GenerateRecipePayload = {
  message?: string | null;
  request?: CookingRequest | null;
  memories?: string[];
  max_revisions?: number;
};

export type ComposeStage = {
  node: string;
  label: string;
};
