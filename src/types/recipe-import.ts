import type {
  RecipeIngredientLine,
  RecipeLane,
  RecipeStep,
} from './recipe-record';

// ----------------------------------------------------------------------

export type RecipeImageImportResponse = {
  title: string;
  notes?: string | null;
  composition_id?: string | null;
  servings: number;
  block_ids: string[];
  ingredients: RecipeIngredientLine[];
  lanes: RecipeLane[];
  steps: RecipeStep[];
  created_ingredient_names: string[];
  warnings: string[];
};
