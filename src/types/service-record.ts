export type ServiceRecord = {
  id: string;
  name: string;
  notes?: string | null;
  owner_id?: string | null;
  service_date: string;
  recipe_ids: string[];
  kitchen_layout_id?: string | null;
  completed_steps?: string[];
  created_at: string;
  updated_at: string;
};

export type ServiceRecordCreate = {
  name?: string;
  notes?: string | null;
  service_date: string;
  recipe_ids?: string[];
  kitchen_layout_id?: string | null;
  completed_steps?: string[];
};

export type ServiceRecordUpdate = {
  name?: string;
  notes?: string | null;
  service_date?: string;
  recipe_ids?: string[];
  kitchen_layout_id?: string | null;
  completed_steps?: string[];
};

export type ServiceRecordListResponse = {
  items: ServiceRecord[];
  total: number;
};

export function stepCompletionKey(recipeId: string, stepId: string) {
  return `${recipeId}:${stepId}`;
}

