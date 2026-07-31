export type SensoryProfile = {
  acidity: number;
  saltiness: number;
  sweetness: number;
  bitterness: number;
  umami: number;
  fat: number;
  heat: number;
  aroma: number;
  freshness: number;
};

/** Tag de domínio: id estável + título exibido. */
export type Tag = {
  id: string;
  title: string;
};

export type FlavorBlockOrigin = 'catalog' | 'custom' | 'override';

export type FlavorBlock = {
  id: string;
  name: string;
  family: Tag;
  ingredient_ids: string[];
  culinary_roles: string[];
  compatible_protagonists: string[];
  recommended_base_ids: string[];
  target_sensory_profile: SensoryProfile;
  texture_targets: string[];
  /** Técnicas culinárias relacionadas (tags). */
  techniques?: Tag[];
  notes?: string;
  origin?: FlavorBlockOrigin;
  editable?: boolean;
  updated_at?: string | null;
};

export type FlavorBlockListResponse = {
  items: FlavorBlock[];
  total: number;
};

export type FlavorBlockWrite = {
  id: string;
  name: string;
  family: Tag;
  ingredient_ids: string[];
  culinary_roles: string[];
  compatible_protagonists: string[];
  recommended_base_ids: string[];
  target_sensory_profile: SensoryProfile;
  texture_targets: string[];
  techniques: Tag[];
  notes?: string;
};

export type LibrarySummary = {
  version: string;
  counts: Record<string, number>;
};
