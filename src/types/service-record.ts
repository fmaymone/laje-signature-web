export type ServiceRecord = {
  id: string;
  name: string;
  notes?: string | null;
  owner_id?: string | null;
  service_date: string;
  recipe_ids: string[];
  created_at: string;
  updated_at: string;
};

export type ServiceRecordCreate = {
  name?: string;
  notes?: string | null;
  service_date: string;
  recipe_ids?: string[];
};

export type ServiceRecordUpdate = {
  name?: string;
  notes?: string | null;
  service_date?: string;
  recipe_ids?: string[];
};

export type ServiceRecordListResponse = {
  items: ServiceRecord[];
  total: number;
};
