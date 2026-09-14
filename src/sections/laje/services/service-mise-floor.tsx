import type { RecipeRecord } from 'src/types/recipe-record';
import type { KitchenLayout } from 'src/types/kitchen-layout';
import type { KitchenMiseLine } from '../kitchen/kitchen-station-node';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { KitchenFloorPlan } from '../kitchen/kitchen-floor-plan';

import { aggregateMiseByStation } from './service-aggregate';

// ----------------------------------------------------------------------

type Props = {
  recipes: RecipeRecord[];
  layout: KitchenLayout | null;
};

export function ServiceMiseFloor({ recipes, layout }: Props) {
  const plan = useMemo(() => aggregateMiseByStation(recipes, layout), [layout, recipes]);

  const itemsByStation = useMemo(() => {
    const map = new Map<string, KitchenMiseLine[]>();
    for (const group of plan.stations) {
      map.set(
        group.station.id,
        group.items.map((line) => ({
          id: line.key,
          name: line.item.name,
          quantityLabel: line.quantityLabel || undefined,
          recipeTitle: line.recipeTitle,
          readyLabel: line.readyLabel,
        }))
      );
    }
    return map;
  }, [plan]);

  const totalItems = plan.stations.reduce((sum, group) => sum + group.items.length, 0) + plan.unassigned.length;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Box>
            <Typography variant="h6">Mise en place nas bancadas</Typography>
            <Typography variant="body2" color="text.secondary">
              O que deve estar pronto em cada estação neste serviço.
            </Typography>
          </Box>

          {!layout ? (
            <EmptyContent
              title="Nenhuma planta selecionada"
              description="Escolha uma planta da cozinha acima, ou crie a primeira."
              sx={{ py: 2 }}
              action={
                <Button
                  component={RouterLink}
                  href={paths.dashboard.kitchenNew}
                  variant="outlined"
                  size="small"
                  startIcon={<Iconify icon="solar:widget-4-bold" />}
                >
                  Criar planta
                </Button>
              }
            />
          ) : (
            <Box
              sx={{
                height: { xs: 480, md: 560 },
                borderRadius: 1,
                overflow: 'hidden',
                bgcolor: 'background.neutral',
                border: (theme) => `1px solid ${theme.vars.palette.divider}`,
              }}
            >
              <KitchenFloorPlan
                stations={layout.stations}
                canvas={layout.canvas}
                itemsByStation={itemsByStation}
                readOnly
                emptyHint="Esta planta ainda não tem estações."
              />
            </Box>
          )}

          {plan.unassigned.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Não alocado ({plan.unassigned.length})
              </Typography>
              <Stack spacing={0.75}>
                {plan.unassigned.map((line) => (
                  <Stack
                    key={line.key}
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={0.5}
                    sx={{ px: 1.25, py: 0.75, borderRadius: 1, bgcolor: 'background.neutral' }}
                  >
                    <Typography variant="body2" sx={{ flex: 1, fontWeight: 600 }}>
                      {line.item.name}
                      {line.quantityLabel ? ` · ${line.quantityLabel}` : ''}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {line.recipeTitle} · {line.readyLabel}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {layout && totalItems === 0 && (
            <Typography variant="body2" color="text.secondary">
              As receitas deste serviço ainda não têm componentes de mise en place.
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
