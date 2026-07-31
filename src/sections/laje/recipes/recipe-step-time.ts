/** Helpers de tempo antes do serviço (minutos). */

export function formatTimeBeforeService(minutes: number) {
  if (!minutes || minutes <= 0) return 'no serviço';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}min antes`;
  if (h) return `${h}h antes`;
  return `${m}min antes`;
}

export function formatAxisTick(minutes: number) {
  if (!minutes || minutes <= 0) return 'Serviço';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `T-${h}h${m}`;
  if (h) return `T-${h}h`;
  return `T-${m}`;
}

/** Arredonda o span da timeline para um intervalo legível. */
export function niceTimelineSpan(maxMinutes: number): number {
  const floor = Math.max(maxMinutes, 20);
  const steps = [20, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480, 720, 1440];
  return steps.find((n) => n >= floor) ?? Math.ceil(floor / 60) * 60;
}

export function buildAxisTicks(spanMinutes: number): number[] {
  const candidates =
    spanMinutes <= 30
      ? [spanMinutes, 20, 10, 5, 0]
      : spanMinutes <= 60
        ? [spanMinutes, 45, 30, 15, 0]
        : spanMinutes <= 120
          ? [spanMinutes, 90, 60, 30, 0]
          : spanMinutes <= 240
            ? [spanMinutes, 180, 120, 60, 0]
            : [spanMinutes, Math.round(spanMinutes * 0.66), Math.round(spanMinutes * 0.33), 0];

  const unique = [...new Set(candidates.map((n) => Math.max(0, Math.min(spanMinutes, n))))];
  return unique.sort((a, b) => b - a);
}
