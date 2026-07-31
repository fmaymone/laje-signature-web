import type { Tag } from 'src/types/library';

// ----------------------------------------------------------------------

const FAMILY_TITLES: Record<string, string> = {
  agreste: 'Agreste',
  litoral: 'Litoral',
  litoral_sertao: 'Litoral · Sertão',
  mata: 'Mata',
  nordeste: 'Nordeste',
  sertao: 'Sertão',
};

const TECHNIQUE_TITLES: Record<string, string> = {
  assar: 'Assar',
  baixa_temperatura: 'Baixa temperatura',
  brasa: 'Brasa',
  caldo: 'Caldo',
  caldo_com_aparas: 'Caldo com aparas',
  caldo_com_cascas: 'Caldo com cascas',
  caramelizar: 'Caramelizar',
  conservar: 'Conservar',
  cozimento_controlado: 'Cozimento controlado',
  cozimento_curto: 'Cozimento curto',
  cozinhar: 'Cozinhar',
  cru: 'Cru',
  cura_leve: 'Cura leve',
  deep_fry: 'Deep fry',
  desfiar: 'Desfiar',
  emulsionar: 'Emulsionar',
  ensopado: 'Ensopado',
  fermentar: 'Fermentar',
  finalizar: 'Finalizar',
  forno: 'Forno',
  fritar: 'Fritar',
  glacear: 'Glacear',
  gratinar: 'Gratinar',
  grelha: 'Grelha',
  grelhar: 'Grelhar',
  hidratar: 'Hidratar',
  infusionar: 'Infusionar',
  oleo_verde: 'Óleo verde',
  panela: 'Panela',
  poach: 'Poach',
  processar: 'Processar',
  reduzir: 'Reduzir',
  refogar: 'Refogar',
  roast: 'Roast',
  saltear: 'Saltear',
  saute: 'Sauté',
  steam: 'Steam',
  stir_fry: 'Stir fry',
  tostar: 'Tostar',
  triturar: 'Triturar',
};

export function slugifyTag(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
}

function humanize(id: string): string {
  return id.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function titleForFamily(id: string): string {
  return FAMILY_TITLES[id] ?? humanize(id);
}

export function titleForTechnique(id: string): string {
  return TECHNIQUE_TITLES[id] ?? humanize(id);
}

export function makeFamilyTag(raw: string | Tag): Tag {
  if (typeof raw !== 'string' && raw?.id) {
    const id = slugifyTag(raw.id);
    return { id, title: raw.title?.trim() || titleForFamily(id) };
  }
  const id = slugifyTag(String(raw ?? ''));
  return { id, title: titleForFamily(id) };
}

export function makeTechniqueTag(raw: string | Tag): Tag {
  if (typeof raw !== 'string' && raw?.id) {
    const id = slugifyTag(raw.id);
    return { id, title: raw.title?.trim() || titleForTechnique(id) };
  }
  const id = slugifyTag(String(raw ?? ''));
  return { id, title: titleForTechnique(id) };
}

/** Aceita Tag ou string legado da API. */
export function coerceTag(value: unknown, kind: 'family' | 'technique' = 'technique'): Tag | null {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    return kind === 'family' ? makeFamilyTag(value) : makeTechniqueTag(value);
  }
  if (typeof value === 'object' && value !== null && 'id' in value) {
    const obj = value as { id?: unknown; title?: unknown };
    const id = slugifyTag(String(obj.id ?? obj.title ?? ''));
    if (!id) return null;
    const title =
      String(obj.title ?? '').trim() ||
      (kind === 'family' ? titleForFamily(id) : titleForTechnique(id));
    return { id, title };
  }
  return null;
}

export function tagTitle(value: unknown, kind: 'family' | 'technique' = 'technique'): string {
  return coerceTag(value, kind)?.title ?? '';
}

export function tagId(value: unknown, kind: 'family' | 'technique' = 'technique'): string {
  return coerceTag(value, kind)?.id ?? '';
}

export const BASE_FAMILY_TAGS: Tag[] = Object.entries(FAMILY_TITLES).map(([id, title]) => ({
  id,
  title,
}));

export const BASE_TECHNIQUE_TAGS: Tag[] = Object.entries(TECHNIQUE_TITLES).map(([id, title]) => ({
  id,
  title,
}));
