import type { RecipeRecord } from 'src/types/recipe-record';
import type { ServiceRecord } from 'src/types/service-record';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { MAIN_LANE_ID } from 'src/types/recipe-record';
import { formatTimeBeforeService } from '../../recipes/recipe-step-time';
import { stepCompletionKey } from 'src/types/service-record';

import {
  aggregateServiceTimeline,
  chunkRecipeColumns,
  formatLeadSummary,
  groupTimelineByRecipe,
  leadStartDateTimeISO,
  type RecipeTimelineColumn,
} from '../service-aggregate';

// ----------------------------------------------------------------------

const TONES = ['#9a3412', '#1e3a5f', '#115e59', '#854d0e', '#4c1d95'] as const;

type Props = {
  service: ServiceRecord;
  recipes: RecipeRecord[];
};

function SheetPage({
  service,
  recipes,
  columns,
  pageIndex,
  pageCount,
  leadStart,
  leadSummary,
  completedSet,
}: {
  service: ServiceRecord;
  recipes: RecipeRecord[];
  columns: RecipeTimelineColumn[];
  pageIndex: number;
  pageCount: number;
  leadStart: string | null;
  leadSummary: string;
  completedSet: Set<string>;
}) {
  return (
    <Box className="recipe-print-sheet recipe-print-sheet--a4-portrait recipe-print-sheet--by-recipe">
      <Stack
        spacing={0.35}
        sx={{ mb: 1.25, pb: 1, borderBottom: '2px solid #1c1917' }}
      >
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.2, color: '#c2410c', fontWeight: 700 }}
        >
          Laje Signature · Por receitas
          {pageCount > 1 ? ` · ${pageIndex + 1}/${pageCount}` : ''}
        </Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
          {service.name}
        </Typography>
        <Typography sx={{ fontSize: 11, color: '#57534e' }}>
          {fDateTime(service.service_date)}
          {leadStart ? ` · corrida desde ${fDateTime(leadStart)}` : ''}
          {' · '}
          {leadSummary}
        </Typography>
        <Typography sx={{ fontSize: 10, color: '#78716c' }}>
          {recipes.length} {recipes.length === 1 ? 'receita' : 'receitas'} · topo = mais cedo ·
          base = serviço · A4 retrato
        </Typography>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(columns.length, 1)}, minmax(0, 1fr))`,
          columnGap: 1.25,
          alignItems: 'start',
        }}
      >
        {columns.map((column, colIndex) => {
          const tone = TONES[colIndex % TONES.length];
          return (
            <Box
              key={column.recipeId}
              sx={{
                minWidth: 0,
                border: '1px solid #e7e5e4',
                borderTop: `3px solid ${tone}`,
                borderRadius: 0.5,
                overflow: 'hidden',
                breakInside: 'avoid',
              }}
            >
              <Box sx={{ px: 0.9, py: 0.7, bgcolor: '#f5f5f4', borderBottom: '1px solid #e7e5e4' }}>
                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 800,
                    lineHeight: 1.2,
                    color: '#1c1917',
                    wordBreak: 'break-word',
                  }}
                >
                  {column.recipeTitle}
                </Typography>
                <Typography sx={{ fontSize: 9, color: '#78716c', mt: 0.15 }}>
                  {column.items.length} proc.
                </Typography>
              </Box>

              {column.items.length === 0 ? (
                <Typography sx={{ fontSize: 10, color: '#a8a29e', px: 0.9, py: 1 }}>
                  Sem processos.
                </Typography>
              ) : (
                column.items.map((item) => {
                  const done = completedSet.has(
                    stepCompletionKey(item.recipeId, item.step.id)
                  );
                  return (
                    <Box
                      key={`${item.recipeId}-${item.step.id}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '12px 18px 1fr',
                        columnGap: 0.6,
                        px: 0.75,
                        py: 0.55,
                        borderBottom: '1px solid #f5f5f4',
                        opacity: done ? 0.55 : 1,
                        breakInside: 'avoid',
                      }}
                    >
                      <Box
                        sx={{
                          width: 11,
                          height: 11,
                          mt: 0.2,
                          border: '1.4px solid #44403c',
                          borderRadius: 0.2,
                          bgcolor: done ? '#44403c' : 'transparent',
                          color: '#fff',
                          fontSize: 8,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                        }}
                      >
                        {done ? '✓' : ''}
                      </Box>
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          bgcolor: tone,
                          color: '#fff',
                          fontSize: 8,
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mt: 0.05,
                        }}
                      >
                        {item.index}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 11,
                            fontWeight: 700,
                            lineHeight: 1.25,
                            color: '#1c1917',
                            textDecoration: done ? 'line-through' : 'none',
                            wordBreak: 'break-word',
                          }}
                        >
                          {item.step.process?.trim() || 'Sem nome'}
                        </Typography>
                        <Typography sx={{ fontSize: 8.5, color: '#78716c', mt: 0.1 }}>
                          {formatTimeBeforeService(item.start)} · {item.step.duration_minutes} min
                          {item.laneName && item.laneId !== MAIN_LANE_ID
                            ? ` · ${item.laneName}`
                            : ''}
                        </Typography>
                        {item.step.description ? (
                          <Typography sx={{ fontSize: 8.5, color: '#57534e', mt: 0.1 }}>
                            {item.step.description}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  );
                })
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function ServiceRecipeColumnsSheets({ service, recipes }: Props) {
  const plan = useMemo(() => aggregateServiceTimeline(recipes), [recipes]);
  const columns = useMemo(
    () => groupTimelineByRecipe(recipes, plan.items),
    [plan.items, recipes]
  );
  const pages = useMemo(() => chunkRecipeColumns(columns), [columns]);
  const leadStart = leadStartDateTimeISO(service.service_date, plan.leadMinutes);
  const leadSummary = formatLeadSummary(plan.leadMinutes);
  const completedSet = useMemo(
    () => new Set(service.completed_steps ?? []),
    [service.completed_steps]
  );

  return (
    <Stack spacing={3}>
      {pages.map((pageColumns, pageIndex) => (
        <SheetPage
          key={`by-recipe-${pageIndex}`}
          service={service}
          recipes={recipes}
          columns={pageColumns}
          pageIndex={pageIndex}
          pageCount={pages.length}
          leadStart={leadStart}
          leadSummary={leadSummary}
          completedSet={completedSet}
        />
      ))}
    </Stack>
  );
}
