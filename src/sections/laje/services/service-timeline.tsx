import type { RecipeRecord } from 'src/types/recipe-record';

import { useMemo } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { EmptyContent } from 'src/components/empty-content';

import {
  buildAxisTicks,
  formatAxisTick,
  formatTimeBeforeService,
} from '../recipes/recipe-step-time';

import {
  aggregateServiceTimeline,
  formatLeadSummary,
  leadStartDateTimeISO,
} from './service-aggregate';

// ----------------------------------------------------------------------

const LANE_GUTTER = 120;
const ROW_H = 32;

type Props = {
  recipes: RecipeRecord[];
  serviceDate: string;
};

export function ServiceTimeline({ recipes, serviceDate }: Props) {
  const plan = useMemo(() => aggregateServiceTimeline(recipes), [recipes]);
  const ticks = useMemo(() => buildAxisTicks(plan.spanMinutes), [plan.spanMinutes]);
  const leadStart = leadStartDateTimeISO(serviceDate, plan.leadMinutes);

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
    return order.map((id) => ({
      recipeId: id,
      title: map.get(id)![0].recipeTitle,
      items: map.get(id)!,
    }));
  }, [plan.items]);

  const toLeft = (minutesBefore: number) =>
    `${((plan.spanMinutes - minutesBefore) / plan.spanMinutes) * 100}%`;

  const toWidth = (start: number, end: number) => {
    const pct = ((start - end) / plan.spanMinutes) * 100;
    return `${Math.max(pct, 0.8)}%`;
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6">Timeline do serviço</Typography>
              <Typography variant="body2" color="text.secondary">
                Processos de todas as receitas alinhados pela antecedência até o serviço.
              </Typography>
            </Box>
            {plan.items.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Label variant="soft" color="warning">
                  {formatLeadSummary(plan.leadMinutes)}
                </Label>
                <Label variant="soft" color="info">
                  Início da corrida: {leadStart ? fDateTime(leadStart) : '—'}
                </Label>
                <Label variant="soft" color="default">
                  Serviço: {serviceDate ? fDateTime(serviceDate) : '—'}
                </Label>
              </Stack>
            )}
          </Stack>

          {plan.items.length === 0 ? (
            <EmptyContent
              title="Sem processos"
              description="As receitas selecionadas ainda não têm passos na timeline."
              sx={{ py: 4 }}
            />
          ) : (
            <>
              <Box
                sx={{
                  border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.16)}`,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  bgcolor: 'background.paper',
                }}
              >
                <Stack direction="row" sx={{ pl: `${LANE_GUTTER}px`, px: 0, pt: 1.25, pb: 0.5 }}>
                  <Box sx={{ width: LANE_GUTTER, flexShrink: 0 }} />
                  <Box sx={{ position: 'relative', flex: 1, height: 18, pr: 1.5 }}>
                    {ticks.map((tick) => (
                      <Typography
                        key={tick}
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          left: toLeft(tick),
                          transform: tick === 0 ? 'translateX(-100%)' : 'translateX(-50%)',
                          fontWeight: tick === 0 ? 700 : 500,
                          color: tick === 0 ? 'error.main' : 'text.secondary',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatAxisTick(tick)}
                      </Typography>
                    ))}
                  </Box>
                </Stack>

                {recipeRows.map((row, rowIndex) => (
                  <Box
                    key={row.recipeId}
                    sx={{
                      display: 'flex',
                      minHeight: ROW_H,
                      borderTop: (t) =>
                        `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                      bgcolor: rowIndex % 2 ? 'background.neutral' : 'transparent',
                    }}
                  >
                    <Stack
                      justifyContent="center"
                      sx={{
                        width: LANE_GUTTER,
                        flexShrink: 0,
                        px: 1.25,
                        borderRight: (t) =>
                          `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700 }} noWrap title={row.title}>
                        {row.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.items.length} proc.
                      </Typography>
                    </Stack>

                    <Box sx={{ position: 'relative', flex: 1, minHeight: ROW_H, pr: 1.5 }}>
                      {ticks.map((tick) => (
                        <Box
                          key={`g-${row.recipeId}-${tick}`}
                          sx={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: toLeft(tick),
                            width: tick === 0 ? 2 : 1,
                            bgcolor: (t) =>
                              tick === 0
                                ? varAlpha(t.vars.palette.error.mainChannel, 0.45)
                                : varAlpha(t.vars.palette.grey['500Channel'], 0.14),
                          }}
                        />
                      ))}

                      {row.items.map((item) => (
                        <Box
                          key={`${item.recipeId}-${item.step.id}`}
                          title={`${item.index}. ${item.step.process}`}
                          sx={{
                            position: 'absolute',
                            left: toLeft(item.start),
                            width: toWidth(item.start, item.end),
                            top: '50%',
                            transform: 'translateY(-50%)',
                            height: 12,
                            borderRadius: 0.5,
                            bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.22),
                            border: (t) => `1px solid ${t.vars.palette.primary.main}`,
                          }}
                        >
                          <Box
                            sx={{
                              position: 'absolute',
                              left: 0,
                              top: '50%',
                              transform: 'translate(-40%, -50%)',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              bgcolor: 'primary.main',
                              color: 'primary.contrastText',
                              typography: 'caption',
                              fontWeight: 800,
                              fontSize: 10,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: (t) => `0 0 0 2px ${t.vars.palette.background.paper}`,
                            }}
                          >
                            {item.index}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Legenda (1 = mais cedo)
                </Typography>
                <Stack spacing={1}>
                  {plan.items.map((item) => (
                    <Stack
                      key={`${item.recipeId}-${item.step.id}`}
                      direction="row"
                      spacing={1.25}
                      alignItems="flex-start"
                    >
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                          color: 'primary.contrastText',
                          typography: 'caption',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {item.index}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2">
                          {item.step.process?.trim() || 'Sem nome'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.recipeTitle} · {item.laneName} ·{' '}
                          {formatTimeBeforeService(item.start)} · {item.step.duration_minutes} min
                        </Typography>
                        {item.step.description ? (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {item.step.description}
                          </Typography>
                        ) : null}
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
