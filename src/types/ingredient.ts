export type IngredientUnit =
  | 'g'
  | 'kg'
  | 'ml'
  | 'l'
  | 'un'
  | 'xicara'
  | 'colher_sopa'
  | 'colher_cha'
  | 'dente'
  | 'folha'
  | 'ramo'
  | 'a_gosto';

/** Padrão de inventário culinário. */
export type IngredientStockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'on_order';

export type Ingredient = {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  default_unit: IngredientUnit | string;
  notes?: string | null;
  is_system: boolean;
  stock_quantity: number;
  stock_unit?: string | null;
  reorder_level: number;
  status: IngredientStockStatus;
  status_override?: IngredientStockStatus | null;
};

export type IngredientListResponse = {
  items: Ingredient[];
  total: number;
};

export type IngredientCreate = {
  name: string;
  slug?: string;
  aliases?: string[];
  category?: string;
  default_unit?: IngredientUnit;
  notes?: string | null;
};

export type IngredientStockPatch = {
  quantity?: number;
  unit?: IngredientUnit;
  reorder_level?: number;
  status_override?: IngredientStockStatus | null;
  clear_status_override?: boolean;
  notes?: string | null;
};

export const UNIT_OPTIONS: { value: IngredientUnit; label: string }[] = [
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'l', label: 'L' },
  { value: 'un', label: 'un' },
  { value: 'xicara', label: 'xícara' },
  { value: 'colher_sopa', label: 'colher (sopa)' },
  { value: 'colher_cha', label: 'colher (chá)' },
  { value: 'dente', label: 'dente' },
  { value: 'folha', label: 'folha' },
  { value: 'ramo', label: 'ramo' },
  { value: 'a_gosto', label: 'a gosto' },
];

export const STATUS_LABEL: Record<IngredientStockStatus, string> = {
  in_stock: 'Em estoque',
  low_stock: 'Estoque baixo',
  out_of_stock: 'Faltando',
  on_order: 'Em pedido',
};

export const STATUS_COLOR: Record<
  IngredientStockStatus,
  'success' | 'warning' | 'error' | 'info'
> = {
  in_stock: 'success',
  low_stock: 'warning',
  out_of_stock: 'error',
  on_order: 'info',
};
