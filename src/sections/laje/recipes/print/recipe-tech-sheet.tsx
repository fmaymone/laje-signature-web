import type { Ingredient } from 'src/types/ingredient';
import type { RecipeLane, RecipeRecord, RecipeStep } from 'src/types/recipe-record';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { UNIT_OPTIONS } from 'src/types/ingredient';
import { MAIN_LANE_ID } from 'src/types/recipe-record';

import { formatTimeBeforeService } from '../recipe-step-time';

// ----------------------------------------------------------------------

function unitLabel(unit: string) {
  return UNIT_OPTIONS.find((opt) => opt.value === unit)?.label ?? unit;
}

function stepsByLane(recipe: RecipeRecord) {
  const lanes = recipe.lanes?.length
    ? recipe.lanes
    : [{ id: MAIN_LANE_ID, name: 'Principal' }];
  const map = new Map<string, RecipeStep[]>();
  for (const lane of lanes) map.set(lane.id, []);
  for (const step of recipe.steps ?? []) {
    const laneId = map.has(step.lane_id) ? step.lane_id : MAIN_LANE_ID;
    map.get(laneId)!.push(step);
  }
  for (const [, list] of map) {
    list.sort((a, b) => b.time_before_service_minutes - a.time_before_service_minutes);
  }
  return { lanes, map };
}

type Props = {
  recipe: RecipeRecord;
  ingredientsById: Map<string, Ingredient>;
};

export function RecipeTechSheet({ recipe, ingredientsById }: Props) {
  const { lanes, map } = stepsByLane(recipe);
  const lines = recipe.ingredients ?? [];

  return (
    <Box className="recipe-print-sheet recipe-print-sheet--a4-portrait">
      <Stack spacing={0.5} sx={{ mb: 2.5, pb: 1.5, borderBottom: '2px solid #1c1917' }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.4, color: '#c2410c', fontWeight: 700 }}
        >
          Laje Signature · Ficha técnica
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
          {recipe.title}
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Typography variant="body2" sx={{ color: '#57534e' }}>
            {recipe.servings} {recipe.servings === 1 ? 'porção' : 'porções'}
          </Typography>
          <Typography variant="body2" sx={{ color: '#57534e' }}>
            {lines.length} ingredientes · {(recipe.steps ?? []).length} processos
          </Typography>
        </Stack>
        {recipe.notes ? (
          <Typography variant="body2" sx={{ mt: 0.5, color: '#44403c' }}>
            {recipe.notes}
          </Typography>
        ) : null}
      </Stack>

      <Typography
        variant="subtitle2"
        sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}
      >
        Ingredientes
      </Typography>

      {lines.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#78716c', mb: 2.5 }}>
          Nenhum ingrediente listado.
        </Typography>
      ) : (
        <Box
          component="table"
          sx={{
            width: 1,
            mb: 3,
            borderCollapse: 'collapse',
            '& th, & td': {
              borderBottom: '1px solid #e7e5e4',
              py: 0.75,
              px: 0.5,
              textAlign: 'left',
              fontSize: 13,
            },
            '& th': { color: '#78716c', fontWeight: 600 },
          }}
        >
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th style={{ width: 90 }}>Qtd</th>
              <th style={{ width: 90 }}>Unidade</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => {
              const ingredient = ingredientsById.get(line.ingredient_id);
              return (
                <tr key={line.ingredient_id}>
                  <td>{ingredient?.name ?? line.ingredient_id}</td>
                  <td>{line.quantity}</td>
                  <td>{unitLabel(String(line.unit))}</td>
                </tr>
              );
            })}
          </tbody>
        </Box>
      )}

      <Typography
        variant="subtitle2"
        sx={{ mb: 1.25, textTransform: 'uppercase', letterSpacing: 0.8 }}
      >
        Processos
      </Typography>

      <Stack spacing={2}>
        {lanes.map((lane: RecipeLane) => {
          const steps = map.get(lane.id) ?? [];
          if (!steps.length && lanes.length > 1) return null;
          return (
            <Box key={lane.id}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  pb: 0.5,
                  borderBottom: '1px solid #d6d3d1',
                  color: '#292524',
                }}
              >
                {lane.name}
              </Typography>
              {steps.length === 0 ? (
                <Typography variant="body2" sx={{ color: '#a8a29e' }}>
                  Sem processos nesta linha.
                </Typography>
              ) : (
                <Stack spacing={1.25}>
                  {steps.map((step, index) => (
                    <Box
                      key={step.id}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '28px 1fr',
                        gap: 1,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 800, color: '#c2410c', pt: 0.25 }}
                      >
                        {String(index + 1).padStart(2, '0')}
                      </Typography>
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="baseline"
                          flexWrap="wrap"
                          useFlexGap
                        >
                          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                            {step.process || 'Sem nome'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#78716c' }}>
                            {formatTimeBeforeService(step.time_before_service_minutes)} ·{' '}
                            {step.duration_minutes} min
                          </Typography>
                        </Stack>
                        {step.description ? (
                          <Typography variant="body2" sx={{ mt: 0.25, color: '#44403c' }}>
                            {step.description}
                          </Typography>
                        ) : null}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
