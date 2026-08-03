import type { RecipeLane, RecipeRecord, RecipeStep } from 'src/types/recipe-record';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { MAIN_LANE_ID } from 'src/types/recipe-record';

import {
  buildAxisTicks,
  formatAxisTick,
  formatTimeBeforeService,
  niceTimelineSpan,
} from '../recipe-step-time';

// ----------------------------------------------------------------------

const LANE_GUTTER = 110;
const LANE_HEIGHT = 28;
const TONES = ['#9a3412', '#1e3a5f', '#115e59', '#854d0e', '#4c1d95'] as const;

type MarkedStep = {
  index: number; // 1-based global
  step: RecipeStep;
  start: number;
  end: number;
  laneId: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

type Props = {
  recipe: RecipeRecord;
};

export function RecipeTimelineSheet({ recipe }: Props) {
  const lanes: RecipeLane[] = recipe.lanes?.length
    ? recipe.lanes
    : [{ id: MAIN_LANE_ID, name: 'Principal' }];

  const span = useMemo(() => {
    const maxStart = (recipe.steps ?? []).reduce(
      (max, step) => Math.max(max, Number(step.time_before_service_minutes) || 0),
      0
    );
    return niceTimelineSpan(maxStart || 60);
  }, [recipe.steps]);

  const ticks = useMemo(() => buildAxisTicks(span), [span]);

  /**
   * Numeração cronológica da corrida:
   * 1 = processo mais cedo (maior "minutos antes do serviço");
   * último número = mais perto / no serviço.
   */
  const marked = useMemo<MarkedStep[]>(() => {
    const items = (recipe.steps ?? []).map((step) => {
      const start = Math.max(0, Number(step.time_before_service_minutes) || 0);
      const duration = Math.max(1, Number(step.duration_minutes) || 10);
      return {
        step,
        start,
        end: Math.max(0, start - duration),
        laneId: lanes.some((l) => l.id === step.lane_id) ? step.lane_id : MAIN_LANE_ID,
      };
    });

    items.sort((a, b) => {
      // Mais minutos antes do serviço = mais antigo na corrida = vem primeiro.
      if (b.start !== a.start) return b.start - a.start;
      // Empate: quem termina mais cedo (maior end em "minutos antes") primeiro.
      if (b.end !== a.end) return b.end - a.end;
      return a.step.process.localeCompare(b.step.process, 'pt-BR');
    });

    return items.map((item, i) => ({ ...item, index: i + 1 }));
  }, [recipe.steps, lanes]);

  /** Duas colunas preenchidas de cima → baixo (1,2,3… na esquerda, depois direita). */
  const legendColumns = useMemo(() => {
    const mid = Math.ceil(marked.length / 2);
    return [marked.slice(0, mid), marked.slice(mid)] as const;
  }, [marked]);

  const byLane = useMemo(() => {
    const map = new Map<string, MarkedStep[]>();
    for (const lane of lanes) map.set(lane.id, []);
    for (const item of marked) {
      map.get(item.laneId)?.push(item);
    }
    return map;
  }, [lanes, marked]);

  const toLeft = (minutesBefore: number) =>
    `${(clamp(span - minutesBefore, 0, span) / span) * 100}%`;

  const toWidth = (start: number, end: number) => {
    const pct = ((start - end) / span) * 100;
    // Faixa proporcional; mínimo só para o traço aparecer, sem texto dentro.
    return `${Math.max(pct, 0.9)}%`;
  };

  return (
    <Box className="recipe-print-sheet recipe-print-sheet--a4-landscape">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-end"
        sx={{ mb: 1.25, pb: 1, borderBottom: '2px solid #1c1917' }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ letterSpacing: 1.4, color: '#c2410c', fontWeight: 700 }}
          >
            Laje Signature · Timeline de serviço
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {recipe.title}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#57534e', textAlign: 'right' }}>
          Marcadores no tempo · títulos na legenda
          <br />
          A4 paisagem
        </Typography>
      </Stack>

      {/* Eixo */}
      <Stack direction="row" sx={{ pl: `${LANE_GUTTER}px`, mb: 0.5 }}>
        <Box sx={{ position: 'relative', flex: 1, height: 16 }}>
          {ticks.map((tick) => (
            <Typography
              key={tick}
              variant="caption"
              sx={{
                position: 'absolute',
                left: toLeft(tick),
                transform: tick === 0 ? 'translateX(-100%)' : 'translateX(-50%)',
                fontWeight: tick === 0 ? 800 : 500,
                color: tick === 0 ? '#c2410c' : '#78716c',
                whiteSpace: 'nowrap',
                fontSize: 10,
              }}
            >
              {formatAxisTick(tick)}
            </Typography>
          ))}
        </Box>
      </Stack>

      {/* Trilha compacta — só marcadores numerados */}
      <Stack sx={{ mb: 1.75, border: '1px solid #e7e5e4', borderRadius: 1, overflow: 'hidden' }}>
        {lanes.map((lane, laneIndex) => {
          const tone = TONES[laneIndex % TONES.length];
          const items = byLane.get(lane.id) ?? [];

          return (
            <Box
              key={lane.id}
              sx={{
                display: 'flex',
                minHeight: LANE_HEIGHT,
                borderTop: laneIndex === 0 ? 'none' : '1px solid #e7e5e4',
                bgcolor: laneIndex % 2 ? 'rgba(245,245,244,0.7)' : '#fff',
              }}
            >
              <Stack
                justifyContent="center"
                sx={{
                  width: LANE_GUTTER,
                  flexShrink: 0,
                  px: 1,
                  borderRight: '1px solid #e7e5e4',
                }}
              >
                <Typography
                  sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={lane.name}
                >
                  {lane.name}
                </Typography>
              </Stack>

              <Box sx={{ position: 'relative', flex: 1, minHeight: LANE_HEIGHT }}>
                {ticks.map((tick) => (
                  <Box
                    key={`g-${lane.id}-${tick}`}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: toLeft(tick),
                      width: tick === 0 ? 2 : 1,
                      bgcolor: tick === 0 ? 'rgba(194,65,12,0.5)' : 'rgba(168,162,158,0.28)',
                    }}
                  />
                ))}

                {items.map((item) => (
                  <Box
                    key={item.step.id}
                    sx={{
                      position: 'absolute',
                      left: toLeft(item.start),
                      width: toWidth(item.start, item.end),
                      top: '50%',
                      transform: 'translateY(-50%)',
                      height: 10,
                      borderRadius: 0.5,
                      bgcolor: `${tone}33`,
                      border: `1px solid ${tone}`,
                      boxSizing: 'border-box',
                    }}
                  >
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -1,
                        top: '50%',
                        transform: 'translate(-40%, -50%)',
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        bgcolor: tone,
                        color: '#fff',
                        fontSize: 9,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1,
                        boxShadow: '0 0 0 1px #fff',
                      }}
                    >
                      {item.index}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          );
        })}
      </Stack>

      {/* Legenda — títulos inteiros */}
      <Stack spacing={0.35} sx={{ mb: 1 }}>
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            color: '#292524',
          }}
        >
          Legenda dos processos
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#78716c' }}>
          1 = processo mais cedo (mais minutos antes do serviço) → último = mais perto do serviço
        </Typography>
      </Stack>

      {marked.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#a8a29e' }}>
          Nenhum processo nesta receita.
        </Typography>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
            columnGap: 2.5,
            alignItems: 'start',
          }}
        >
          {legendColumns.map((column, colIndex) => (
            <Stack key={`legend-col-${colIndex}`} spacing={0.75}>
              {column.map((item) => {
                const lane = lanes.find((l) => l.id === item.laneId);
                const tone =
                  TONES[
                    Math.max(0, lanes.findIndex((l) => l.id === item.laneId)) % TONES.length
                  ];
                const label = item.step.process?.trim() || 'Sem nome';

                return (
                  <Box
                    key={item.step.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '22px 1fr',
                      gap: 0.75,
                      alignItems: 'start',
                      py: 0.35,
                      borderBottom: '1px solid #f5f5f4',
                      breakInside: 'avoid',
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        bgcolor: tone,
                        color: '#fff',
                        fontSize: 10,
                        fontWeight: 800,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mt: 0.15,
                      }}
                    >
                      {item.index}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: 12,
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: '#1c1917',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {label}
                      </Typography>
                      <Typography sx={{ fontSize: 10, color: '#78716c', mt: 0.15 }}>
                        {lane?.name ?? 'Principal'} · {formatTimeBeforeService(item.start)} ·{' '}
                        {item.step.duration_minutes} min
                        {item.step.description
                          ? ` · ${item.step.description.trim()}`
                          : ''}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          ))}
        </Box>
      )}

      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{ mt: 1.5, pt: 0.75, borderTop: '1px solid #e7e5e4' }}
      >
        <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 700 }}>
          → Serviço
        </Typography>
      </Stack>
    </Box>
  );
}
