import type { RecipeRecord } from 'src/types/recipe-record';
import type { ServiceRecord } from 'src/types/service-record';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import {
  buildAxisTicks,
  formatAxisTick,
  formatTimeBeforeService,
} from '../../recipes/recipe-step-time';

import {
  aggregateServiceTimeline,
  formatLeadSummary,
  leadStartDateTimeISO,
} from '../service-aggregate';

// ----------------------------------------------------------------------

const LANE_GUTTER = 110;
const ROW_H = 28;
const TONES = ['#9a3412', '#1e3a5f', '#115e59', '#854d0e', '#4c1d95'] as const;

type Props = {
  service: ServiceRecord;
  recipes: RecipeRecord[];
};

export function ServiceTimelineSheet({ service, recipes }: Props) {
  const plan = useMemo(() => aggregateServiceTimeline(recipes), [recipes]);
  const ticks = useMemo(() => buildAxisTicks(plan.spanMinutes), [plan.spanMinutes]);
  const leadStart = leadStartDateTimeISO(service.service_date, plan.leadMinutes);

  const recipeRows = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, typeof plan.items>();
    for (const item of plan.items) {
      if (!map.has(item.recipeId)) {
        order.push(item.recipeId);
        map.set(item.recipeId, []);
      }
      map.get(item.recipeId)!.push(item);
    }
    return order.map((id, i) => ({
      recipeId: id,
      title: map.get(id)![0].recipeTitle,
      tone: TONES[i % TONES.length],
      items: map.get(id)!,
    }));
  }, [plan.items]);

  const legendColumns = useMemo(() => {
    const mid = Math.ceil(plan.items.length / 2);
    return [plan.items.slice(0, mid), plan.items.slice(mid)] as const;
  }, [plan.items]);

  const toLeft = (minutesBefore: number) =>
    `${((plan.spanMinutes - minutesBefore) / plan.spanMinutes) * 100}%`;

  const toWidth = (start: number, end: number) => {
    const pct = ((start - end) / plan.spanMinutes) * 100;
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
            Laje Signature · Timeline do serviço
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
            {service.name}
          </Typography>
          <Typography variant="body2" sx={{ color: '#57534e', mt: 0.25 }}>
            Serviço {fDateTime(service.service_date)}
            {leadStart ? ` · corrida desde ${fDateTime(leadStart)}` : ''}
            {' · '}
            {formatLeadSummary(plan.leadMinutes)}
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: '#57534e', textAlign: 'right' }}>
          Marcadores no tempo · títulos na legenda
          <br />
          A4 paisagem
        </Typography>
      </Stack>

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

      {plan.items.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#a8a29e' }}>
          Nenhum processo nas receitas selecionadas.
        </Typography>
      ) : (
        <>
          <Stack sx={{ mb: 1.75, border: '1px solid #e7e5e4', borderRadius: 1, overflow: 'hidden' }}>
            {recipeRows.map((row, rowIndex) => (
              <Box
                key={row.recipeId}
                sx={{
                  display: 'flex',
                  minHeight: ROW_H,
                  borderTop: rowIndex === 0 ? 'none' : '1px solid #e7e5e4',
                  bgcolor: rowIndex % 2 ? 'rgba(245,245,244,0.7)' : '#fff',
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
                    title={row.title}
                  >
                    {row.title}
                  </Typography>
                </Stack>

                <Box sx={{ position: 'relative', flex: 1, minHeight: ROW_H }}>
                  {ticks.map((tick) => (
                    <Box
                      key={`g-${row.recipeId}-${tick}`}
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

                  {row.items.map((item) => (
                    <Box
                      key={`${item.recipeId}-${item.step.id}`}
                      sx={{
                        position: 'absolute',
                        left: toLeft(item.start),
                        width: toWidth(item.start, item.end),
                        top: '50%',
                        transform: 'translateY(-50%)',
                        height: 10,
                        borderRadius: 0.5,
                        bgcolor: `${row.tone}33`,
                        border: `1px solid ${row.tone}`,
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
                          bgcolor: row.tone,
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
            ))}
          </Stack>

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
              1 = processo mais cedo → último = mais perto do serviço
            </Typography>
          </Stack>

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
                  const rowTone =
                    recipeRows.find((r) => r.recipeId === item.recipeId)?.tone ?? TONES[0];
                  return (
                    <Box
                      key={`${item.recipeId}-${item.step.id}`}
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
                          bgcolor: rowTone,
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
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.step.process?.trim() || 'Sem nome'}
                        </Typography>
                        <Typography sx={{ fontSize: 10, color: '#78716c', mt: 0.15 }}>
                          {item.recipeTitle} · {item.laneName} ·{' '}
                          {formatTimeBeforeService(item.start)} · {item.step.duration_minutes} min
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
        </>
      )}

      <Stack
        direction="row"
        justifyContent="flex-end"
        sx={{ mt: 1.5, pt: 0.75, borderTop: '1px solid #e7e5e4' }}
      >
        <Typography variant="caption" sx={{ color: '#c2410c', fontWeight: 700 }}>
          → Serviço {fDateTime(service.service_date)}
        </Typography>
      </Stack>
    </Box>
  );
}
