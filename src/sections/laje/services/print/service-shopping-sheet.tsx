import type { Ingredient } from 'src/types/ingredient';
import type { RecipeRecord } from 'src/types/recipe-record';
import type { ServiceRecord } from 'src/types/service-record';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { UNIT_OPTIONS } from 'src/types/ingredient';
import { fDateTime } from 'src/utils/format-time';

import { aggregateShoppingList } from '../service-aggregate';

// ----------------------------------------------------------------------

function unitLabel(unit: string) {
  return UNIT_OPTIONS.find((opt) => opt.value === unit)?.label ?? unit;
}

function formatQty(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

type Props = {
  service: ServiceRecord;
  recipes: RecipeRecord[];
  ingredientsById: Map<string, Ingredient>;
};

export function ServiceShoppingSheet({ service, recipes, ingredientsById }: Props) {
  const lines = useMemo(
    () => aggregateShoppingList(recipes, ingredientsById),
    [recipes, ingredientsById]
  );

  return (
    <Box className="recipe-print-sheet recipe-print-sheet--a4-portrait">
      <Stack spacing={0.5} sx={{ mb: 2.5, pb: 1.5, borderBottom: '2px solid #1c1917' }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.4, color: '#c2410c', fontWeight: 700 }}
        >
          Laje Signature · Plano do serviço
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
          {service.name}
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Typography variant="body2" sx={{ color: '#57534e' }}>
            Serviço: {fDateTime(service.service_date)}
          </Typography>
          <Typography variant="body2" sx={{ color: '#57534e' }}>
            {recipes.length} {recipes.length === 1 ? 'receita' : 'receitas'} · {lines.length}{' '}
            itens
          </Typography>
        </Stack>
        {service.notes ? (
          <Typography variant="body2" sx={{ mt: 0.5, color: '#44403c' }}>
            {service.notes}
          </Typography>
        ) : null}
      </Stack>

      <Typography
        variant="subtitle2"
        sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}
      >
        Receitas
      </Typography>
      {recipes.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#78716c', mb: 2.5 }}>
          Nenhuma receita selecionada.
        </Typography>
      ) : (
        <Stack spacing={0.35} sx={{ mb: 2.5 }}>
          {recipes.map((recipe) => (
            <Typography key={recipe.id} variant="body2" sx={{ color: '#292524' }}>
              · {recipe.title}
              <Typography component="span" variant="caption" sx={{ color: '#78716c', ml: 1 }}>
                {recipe.servings} porções · {(recipe.ingredients ?? []).length} ing. ·{' '}
                {(recipe.steps ?? []).length} proc.
              </Typography>
            </Typography>
          ))}
        </Stack>
      )}

      <Typography
        variant="subtitle2"
        sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: 0.8 }}
      >
        Lista de compras
      </Typography>

      {lines.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#78716c' }}>
          Nenhum ingrediente nas receitas selecionadas.
        </Typography>
      ) : (
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              borderBottom: '1px solid #e7e5e4',
              py: 0.75,
              px: 0.5,
              textAlign: 'left',
              fontSize: 12,
            },
            '& th': { fontWeight: 700, color: '#44403c', fontSize: 11 },
          }}
        >
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th style={{ width: 72 }}>Qtd</th>
              <th style={{ width: 72 }}>Un.</th>
              <th>Receitas</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line) => (
              <tr key={line.key}>
                <td style={{ fontWeight: 600 }}>{line.name}</td>
                <td>{formatQty(line.quantity)}</td>
                <td>{unitLabel(line.unit)}</td>
                <td style={{ color: '#78716c', fontSize: 11 }}>
                  {line.recipeTitles.join(' · ')}
                </td>
              </tr>
            ))}
          </tbody>
        </Box>
      )}
    </Box>
  );
}
