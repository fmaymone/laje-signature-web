export type KitchenStationType =
  | 'refrigerated_counter'
  | 'workbench'
  | 'grill'
  | 'stove'
  | 'oven'
  | 'pass'
  | 'fryer'
  | 'custom';

export type KitchenCanvasSize = {
  width: number;
  height: number;
  grid: number;
};

export type KitchenStation = {
  id: string;
  type: KitchenStationType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  color?: string | null;
};

export type KitchenLayout = {
  id: string;
  name: string;
  notes?: string | null;
  owner_id?: string | null;
  canvas: KitchenCanvasSize;
  stations: KitchenStation[];
  created_at: string;
  updated_at: string;
};

export type KitchenLayoutCreate = {
  name?: string;
  notes?: string | null;
  canvas?: KitchenCanvasSize;
  stations?: KitchenStation[];
};

export type KitchenLayoutUpdate = {
  name?: string;
  notes?: string | null;
  canvas?: KitchenCanvasSize;
  stations?: KitchenStation[];
};

export type KitchenLayoutListResponse = {
  items: KitchenLayout[];
  total: number;
};

export const DEFAULT_KITCHEN_CANVAS: KitchenCanvasSize = {
  width: 1200,
  height: 800,
  grid: 20,
};
