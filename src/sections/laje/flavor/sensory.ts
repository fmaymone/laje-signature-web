import type { LabelColor } from 'src/components/label';
import type { SensoryProfile } from 'src/types/library';

// ----------------------------------------------------------------------

export type SensoryAxisKey = keyof SensoryProfile;

export type SensoryAxis = {
  key: SensoryAxisKey;
  label: string;
  short: string;
  color: LabelColor;
};

export const SENSORY_AXES: SensoryAxis[] = [
  { key: 'acidity', label: 'Acidez', short: 'ácid.', color: 'info' },
  { key: 'saltiness', label: 'Sal', short: 'sal', color: 'default' },
  { key: 'sweetness', label: 'Doçura', short: 'doce', color: 'success' },
  { key: 'bitterness', label: 'Amargor', short: 'amar.', color: 'default' },
  { key: 'umami', label: 'Umami', short: 'umami', color: 'warning' },
  { key: 'fat', label: 'Gordura', short: 'gord.', color: 'warning' },
  { key: 'heat', label: 'Calor', short: 'calor', color: 'error' },
  { key: 'aroma', label: 'Aroma', short: 'aroma', color: 'info' },
  { key: 'freshness', label: 'Frescor', short: 'fresco', color: 'info' },
];

export const SENSORY_MAX = 10;
export const SENSORY_PEAK_MIN = 7;

export function sensoryEntries(profile: SensoryProfile) {
  return SENSORY_AXES.map((axis) => ({
    ...axis,
    value: Math.max(0, Math.min(SENSORY_MAX, Number(profile[axis.key] ?? 0))),
  }));
}

export function sensoryPeaks(profile: SensoryProfile, limit = 4) {
  return sensoryEntries(profile)
    .filter((e) => e.value >= SENSORY_PEAK_MIN)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function sensorySeries(profile: SensoryProfile) {
  return sensoryEntries(profile).map((e) => e.value);
}

export function sensoryCategories() {
  return SENSORY_AXES.map((a) => a.label);
}
