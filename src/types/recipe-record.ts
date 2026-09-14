import type { IngredientUnit } from './ingredient';

export const MAIN_LANE_ID = 'main';

export type RecipeLane = {
  id: string;
  name: string;
};

export type RecipeStep = {
  id: string;
  process: string;
  description?: string | null;
  time_before_service_minutes: number;
  /** Duração do passo em minutos (default 10). */
  duration_minutes: number;
  /** Linha de trabalho paralela (default: main / Principal). */
  lane_id: string;
};

export type RecipeIngredientLine = {
  ingredient_id: string;
  quantity: number;
  unit: IngredientUnit | string;
  notes?: string | null;
};

export type RecipeMiseItem = {
  id: string;
  name: string;
  quantity?: number | null;
  unit?: IngredientUnit | string | null;
  notes?: string | null;
  station_id?: string | null;
  ready_minutes_before_service: number;
};

export type RecipeRecord = {
  id: string;
  title: string;
  notes?: string | null;
  owner_id?: string | null;
  composition_id?: string | null;
  servings: number;
  block_ids: string[];
  ingredients: RecipeIngredientLine[];
  lanes: RecipeLane[];
  steps: RecipeStep[];
  mise_items: RecipeMiseItem[];
  created_at: string;
  updated_at: string;
};

export type RecipeRecordCreate = {
  title?: string;
  notes?: string | null;
  composition_id?: string | null;
  servings?: number;
  block_ids?: string[];
  ingredients?: RecipeIngredientLine[];
  lanes?: RecipeLane[];
  steps?: RecipeStep[];
  mise_items?: RecipeMiseItem[];
};

export type RecipeRecordUpdate = {
  title?: string;
  notes?: string | null;
  composition_id?: string | null;
  servings?: number;
  block_ids?: string[];
  ingredients?: RecipeIngredientLine[];
  lanes?: RecipeLane[];
  steps?: RecipeStep[];
  mise_items?: RecipeMiseItem[];
};

export type RecipeRecordListResponse = {
  items: RecipeRecord[];
  total: number;
};

export function defaultLanes(): RecipeLane[] {
  return [{ id: MAIN_LANE_ID, name: 'Principal' }];
}
