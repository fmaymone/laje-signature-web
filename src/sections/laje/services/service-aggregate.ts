import type { Ingredient } from 'src/types/ingredient';
import type { RecipeMiseItem, RecipeRecord, RecipeStep } from 'src/types/recipe-record';
import type { KitchenLayout, KitchenStation } from 'src/types/kitchen-layout';

import { UNIT_OPTIONS } from 'src/types/ingredient';
import { MAIN_LANE_ID } from 'src/types/recipe-record';

import { niceTimelineSpan } from '../recipes/recipe-step-time';

// ----------------------------------------------------------------------

export type ShoppingLine = {
  key: string;
  ingredient_id: string;
  name: string;
  quantity: number;
  unit: string;
  recipeTitles: string[];
};

export type ServiceTimelineItem = {
  index: number;
  recipeId: string;
  recipeTitle: string;
  laneId: string;
  laneName: string;
  step: RecipeStep;
  start: number;
  end: number;
};

export type ServiceTimelinePlan = {
  spanMinutes: number;
  leadMinutes: number;
  items: ServiceTimelineItem[];
};

function laneName(recipe: RecipeRecord, laneId: string) {
  return (
    recipe.lanes?.find((lane) => lane.id === laneId)?.name ??
    (laneId === MAIN_LANE_ID ? 'Principal' : laneId)
  );
}

/** Soma ingredientes das receitas (mesma unidade). */
export function aggregateShoppingList(
  recipes: RecipeRecord[],
  ingredientsById: Map<string, Ingredient>
): ShoppingLine[] {
  const map = new Map<string, ShoppingLine>();

  for (const recipe of recipes) {
    for (const line of recipe.ingredients ?? []) {
      const unit = String(line.unit || 'g');
      const key = `${line.ingredient_id}::${unit}`;
      const existing = map.get(key);
      const name =
        ingredientsById.get(line.ingredient_id)?.name ?? line.ingredient_id;

      if (existing) {
        existing.quantity += Number(line.quantity) || 0;
        if (!existing.recipeTitles.includes(recipe.title)) {
          existing.recipeTitles.push(recipe.title);
        }
      } else {
        map.set(key, {
          key,
          ingredient_id: line.ingredient_id,
          name,
          quantity: Number(line.quantity) || 0,
          unit,
          recipeTitles: [recipe.title],
        });
      }
    }
  }

  return [...map.values()].sort((a, b) =>
    a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' })
  );
}

/** Itens ainda não comprados: status Faltando, ou ingrediente fora do catálogo. */
export function isMissingShoppingLine(
  ingredientId: string,
  ingredientsById: Map<string, Ingredient>
) {
  const ingredient = ingredientsById.get(ingredientId);
  return !ingredient || ingredient.status === 'out_of_stock';
}

export function filterMissingShoppingList(
  lines: ShoppingLine[],
  ingredientsById: Map<string, Ingredient>
) {
  return lines.filter((line) => isMissingShoppingLine(line.ingredient_id, ingredientsById));
}

export type ServiceMiseLine = {
  key: string;
  item: RecipeMiseItem;
  recipeId: string;
  recipeTitle: string;
  quantityLabel: string;
  readyLabel: string;
};

export type ServiceMisePlan = {
  stations: {
    station: KitchenStation;
    items: ServiceMiseLine[];
  }[];
  unassigned: ServiceMiseLine[];
};

function unitLabel(unit?: string | null) {
  if (!unit) return '';
  return UNIT_OPTIONS.find((opt) => opt.value === unit)?.label ?? unit;
}

function formatMiseQty(item: RecipeMiseItem) {
  if (item.quantity == null) {
    return unitLabel(item.unit);
  }
  const qty = Number.isInteger(item.quantity)
    ? String(item.quantity)
    : item.quantity.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
  const unit = unitLabel(item.unit);
  return [qty, unit].filter(Boolean).join(' ');
}

function formatReady(minutes: number) {
  if (!minutes || minutes <= 0) return 'no serviço';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}min antes`;
  if (h) return `${h}h antes`;
  return `${m}min antes`;
}

/** Agrupa componentes de mise das receitas por bancada da planta. */
export function aggregateMiseByStation(
  recipes: RecipeRecord[],
  layout: KitchenLayout | null | undefined
): ServiceMisePlan {
  const lines: ServiceMiseLine[] = [];

  for (const recipe of recipes) {
    for (const item of recipe.mise_items ?? []) {
      if (!item.name?.trim()) continue;
      lines.push({
        key: `${recipe.id}::${item.id}`,
        item,
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        quantityLabel: formatMiseQty(item),
        readyLabel: formatReady(item.ready_minutes_before_service),
      });
    }
  }

  lines.sort((a, b) => {
    if (b.item.ready_minutes_before_service !== a.item.ready_minutes_before_service) {
      return b.item.ready_minutes_before_service - a.item.ready_minutes_before_service;
    }
    return a.item.name.localeCompare(b.item.name, 'pt-BR', { sensitivity: 'base' });
  });

  const stationIds = new Set((layout?.stations ?? []).map((station) => station.id));
  const byStation = new Map<string, ServiceMiseLine[]>();
  const unassigned: ServiceMiseLine[] = [];

  for (const line of lines) {
    const stationId = line.item.station_id || '';
    if (stationId && stationIds.has(stationId)) {
      const bucket = byStation.get(stationId) ?? [];
      bucket.push(line);
      byStation.set(stationId, bucket);
    } else {
      unassigned.push(line);
    }
  }

  return {
    stations: (layout?.stations ?? []).map((station) => ({
      station,
      items: byStation.get(station.id) ?? [],
    })),
    unassigned,
  };
}

/** Une passos de todas as receitas pela antecedência ao serviço. */
export function aggregateServiceTimeline(recipes: RecipeRecord[]): ServiceTimelinePlan {
  const flat: Omit<ServiceTimelineItem, 'index'>[] = [];

  for (const recipe of recipes) {
    for (const step of recipe.steps ?? []) {
      const start = Math.max(0, Number(step.time_before_service_minutes) || 0);
      const duration = Math.max(1, Number(step.duration_minutes) || 10);
      const laneId =
        recipe.lanes?.some((lane) => lane.id === step.lane_id)
          ? step.lane_id || MAIN_LANE_ID
          : MAIN_LANE_ID;

      flat.push({
        recipeId: recipe.id,
        recipeTitle: recipe.title,
        laneId,
        laneName: laneName(recipe, laneId),
        step,
        start,
        end: Math.max(0, start - duration),
      });
    }
  }

  flat.sort((a, b) => {
    if (b.start !== a.start) return b.start - a.start;
    if (b.end !== a.end) return b.end - a.end;
    return a.step.process.localeCompare(b.step.process, 'pt-BR');
  });

  const leadMinutes = flat.reduce((max, item) => Math.max(max, item.start), 0);

  return {
    spanMinutes: niceTimelineSpan(leadMinutes || 60),
    leadMinutes,
    items: flat.map((item, i) => ({ ...item, index: i + 1 })),
  };
}

export type RecipeTimelineColumn = {
  recipeId: string;
  recipeTitle: string;
  items: ServiceTimelineItem[];
};

/** Colunas na ordem das receitas do serviço; processos do mais cedo (topo) ao serviço. */
export function groupTimelineByRecipe(
  recipes: RecipeRecord[],
  items: ServiceTimelineItem[]
): RecipeTimelineColumn[] {
  const byId = new Map<string, ServiceTimelineItem[]>();
  for (const item of items) {
    const bucket = byId.get(item.recipeId) ?? [];
    bucket.push(item);
    byId.set(item.recipeId, bucket);
  }

  return recipes.map((recipe) => ({
    recipeId: recipe.id,
    recipeTitle: recipe.title,
    items: (byId.get(recipe.id) ?? []).slice().sort((a, b) => {
      if (b.start !== a.start) return b.start - a.start;
      if (b.end !== a.end) return b.end - a.end;
      return a.step.process.localeCompare(b.step.process, 'pt-BR');
    }),
  }));
}

export function chunkRecipeColumns<T>(columns: T[]): T[][] {
  const n = columns.length;
  if (n === 0) return [[]];
  const size = n <= 3 ? n : n === 4 ? 2 : 3;
  const pages: T[][] = [];
  for (let i = 0; i < n; i += size) {
    pages.push(columns.slice(i, i + size));
  }
  return pages;
}

export function formatLeadSummary(minutes: number): string {
  if (!minutes || minutes <= 0) return 'Sem antecedência (tudo no serviço)';
  const days = Math.floor(minutes / (24 * 60));
  const hours = Math.floor((minutes % (24 * 60)) / 60);
  const mins = minutes % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (mins && !days) parts.push(`${mins}min`);
  return `Começar ${parts.join(' ')} antes do serviço`;
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** Valor para `<input type="datetime-local">` a partir de ISO / date-only. */
export function toDatetimeLocalValue(iso: string, fallbackHour = 12): string {
  if (!iso) return '';
  const raw = iso.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return `${raw}T${pad2(fallbackHour)}:00`;
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

/** ISO UTC a partir do valor do datetime-local. */
export function fromDatetimeLocalValue(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  if (Number.isNaN(d.getTime())) return local;
  return d.toISOString();
}

/** Default: agora arredondado à hora cheia (mín. 12:00 se for madrugada). */
export function defaultServiceDatetimeLocal(): string {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  if (d.getHours() < 10) d.setHours(12);
  return toDatetimeLocalValue(d.toISOString());
}

/** Início da corrida (ISO) a partir do horário do serviço e da antecedência. */
export function leadStartDateTimeISO(
  serviceDateISO: string,
  leadMinutes: number
): string | null {
  if (!serviceDateISO) return null;
  const service = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(serviceDateISO.trim())
      ? `${serviceDateISO.trim()}T12:00:00`
      : serviceDateISO
  );
  if (Number.isNaN(service.getTime())) return null;
  if (!leadMinutes) return service.toISOString();
  return new Date(service.getTime() - leadMinutes * 60_000).toISOString();
}
