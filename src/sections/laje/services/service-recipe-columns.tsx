import type { RecipeRecord } from 'src/types/recipe-record';

import { useMemo, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { MAIN_LANE_ID } from 'src/types/recipe-record';
import { stepCompletionKey } from 'src/types/service-record';

import { formatTimeBeforeService } from '../recipes/recipe-step-time';

import {
  aggregateServiceTimeline,
  formatLeadSummary,
  groupTimelineByRecipe,
  leadStartDateTimeISO,
} from './service-aggregate';

// ----------------------------------------------------------------------

type Props = {
  recipes: RecipeRecord[];
  serviceDate: string;
  serviceId?: string | null;
  completedSteps?: string[];
  onCompletedStepsChange?: (next: string[]) => Promise<void>;
  printHref?: string | null;
};

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao atualizar processo';
}

export function ServiceRecipeColumns({
  recipes,
  serviceDate,
  serviceId,
  completedSteps = [],
  onCompletedStepsChange,
  printHref,
}: Props) {
  const plan = useMemo(() => aggregateServiceTimeline(recipes), [recipes]);
  const columns = useMemo(
    () => groupTimelineByRecipe(recipes, plan.items),
    [plan.items, recipes]
  );
  const leadStart = leadStartDateTimeISO(serviceDate, plan.leadMinutes);
  const [pendingSteps, setPendingSteps] = useState<string[] | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const completed = pendingSteps ?? completedSteps;
  const completedSet = useMemo(() => new Set(completed), [completed]);
  const doneCount = plan.items.filter((item) =>
    completedSet.has(stepCompletionKey(item.recipeId, item.step.id))
  ).length;
  const canCheck = Boolean(serviceId && onCompletedStepsChange);

  const handleToggle = async (key: string, checked: boolean) => {
    if (!canCheck || !onCompletedStepsChange) {
      toast.info('Salve o serviço para marcar processos neste evento.');
      return;
    }
    const next = checked
      ? [...new Set([...completed, key])]
      : completed.filter((item) => item !== key);
    setPendingSteps(next);
    setSavingKey(key);
    try {
      await onCompletedStepsChange(next);
      setPendingSteps(null);
    } catch (err) {
      toast.error(errorMessage(err));
      setPendingSteps(null);
    } finally {
      setSavingKey((current) => (current === key ? null : current));
    }
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
              <Typography variant="h6">Por receitas</Typography>
              <Typography variant="body2" color="text.secondary">
                Uma coluna por prato. Processos de cima para baixo: do mais cedo até o serviço.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
              {plan.items.length > 0 && (
                <>
                  <Label
                    variant="soft"
                    color={doneCount === plan.items.length ? 'success' : 'warning'}
                  >
                    {doneCount}/{plan.items.length} concluídos
                  </Label>
                  <Label variant="soft" color="warning">
                    {formatLeadSummary(plan.leadMinutes)}
                  </Label>
                  <Label variant="soft" color="info">
                    Início: {leadStart ? fDateTime(leadStart) : '—'}
                  </Label>
                </>
              )}
              {printHref ? (
                <Button
                  component={RouterLink}
                  href={printHref}
                  color="inherit"
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
                >
                  Imprimir A4
                </Button>
              ) : null}
            </Stack>
          </Stack>

          {plan.items.length === 0 ? (
            <EmptyContent
              title="Sem processos"
              description="As receitas selecionadas ainda não têm passos na timeline."
              sx={{ py: 4 }}
            />
          ) : (
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: columns.length === 1 ? '1fr' : 'repeat(2, minmax(0, 1fr))',
                  md: `repeat(${Math.min(columns.length, 3)}, minmax(0, 1fr))`,
                },
              }}
            >
              {columns.map((column) => (
                <Box
                  key={column.recipeId}
                  sx={{
                    border: (t) =>
                      `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.16)}`,
                    borderRadius: 1.5,
                    overflow: 'hidden',
                    bgcolor: 'background.paper',
                    minWidth: 0,
                  }}
                >
                  <Box
                    sx={{
                      px: 1.5,
                      py: 1.25,
                      bgcolor: 'background.neutral',
                      borderBottom: (t) =>
                        `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                    }}
                  >
                    <Typography variant="subtitle2" noWrap title={column.recipeTitle}>
                      {column.recipeTitle}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {column.items.length} {column.items.length === 1 ? 'processo' : 'processos'}
                    </Typography>
                  </Box>

                  {column.items.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 1.5 }}>
                      Sem processos nesta receita.
                    </Typography>
                  ) : (
                    <Stack sx={{ py: 0.5 }}>
                      {column.items.map((item) => {
                        const key = stepCompletionKey(item.recipeId, item.step.id);
                        const done = completedSet.has(key);
                        const saving = savingKey === key;
                        return (
                          <Stack
                            key={key}
                            direction="row"
                            alignItems="flex-start"
                            spacing={0.25}
                            sx={{
                              px: 0.75,
                              py: 0.5,
                              opacity: done ? 0.7 : 1,
                              borderBottom: (t) =>
                                `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.08)}`,
                            }}
                          >
                            {saving ? (
                              <Box
                                sx={{
                                  width: 40,
                                  height: 40,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <CircularProgress size={16} />
                              </Box>
                            ) : (
                              <Checkbox
                                size="small"
                                checked={done}
                                onChange={(event) =>
                                  void handleToggle(key, event.target.checked)
                                }
                                inputProps={{
                                  'aria-label': `Concluir ${item.step.process}`,
                                }}
                              />
                            )}
                            <Box sx={{ minWidth: 0, pt: 0.75, pr: 1 }}>
                              <Stack direction="row" spacing={0.75} alignItems="center">
                                <Box
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: done ? 'success.main' : 'primary.main',
                                    color: done
                                      ? 'success.contrastText'
                                      : 'primary.contrastText',
                                    typography: 'caption',
                                    fontWeight: 800,
                                    fontSize: 10,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  {item.index}
                                </Box>
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    textDecoration: done ? 'line-through' : 'none',
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {item.step.process?.trim() || 'Sem nome'}
                                </Typography>
                              </Stack>
                              <Typography variant="caption" color="text.secondary" display="block">
                                {formatTimeBeforeService(item.start)} · {item.step.duration_minutes}{' '}
                                min
                                {item.laneName && item.laneId !== MAIN_LANE_ID
                                  ? ` · ${item.laneName}`
                                  : ''}
                              </Typography>
                              {item.step.description ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  display="block"
                                >
                                  {item.step.description}
                                </Typography>
                              ) : null}
                            </Box>
                          </Stack>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              ))}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
