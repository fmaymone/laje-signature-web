import type { RecipeRecord } from 'src/types/recipe-record';
import type { ServiceRecord } from 'src/types/service-record';
import type { KitchenLayout } from 'src/types/kitchen-layout';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { stationTypeMeta } from '../../kitchen/station-types';
import { aggregateMiseByStation, type ServiceMiseLine } from '../service-aggregate';

// ----------------------------------------------------------------------

type StationSheetProps = {
  service: ServiceRecord;
  recipes: RecipeRecord[];
  layoutName: string;
  stationName: string;
  stationTypeLabel: string;
  items: ServiceMiseLine[];
};

function StationSheet({
  service,
  recipes,
  layoutName,
  stationName,
  stationTypeLabel,
  items,
}: StationSheetProps) {
  return (
    <Box className="recipe-print-sheet recipe-print-sheet--a4-portrait recipe-print-sheet--mise">
      <Stack spacing={0.5} sx={{ mb: 2.5, pb: 1.5, borderBottom: '2px solid #1c1917' }}>
        <Typography
          variant="overline"
          sx={{ letterSpacing: 1.4, color: '#c2410c', fontWeight: 700 }}
        >
          Laje Signature · Mise en place
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.15 }}>
          {stationName}
        </Typography>
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
          <Typography variant="body2" sx={{ color: '#57534e' }}>
            {stationTypeLabel} · {layoutName}
          </Typography>
          <Typography variant="body2" sx={{ color: '#57534e' }}>
            {service.name} · {fDateTime(service.service_date)}
          </Typography>
        </Stack>
        <Typography variant="body2" sx={{ color: '#57534e' }}>
          {recipes.length} {recipes.length === 1 ? 'receita' : 'receitas'} · {items.length}{' '}
          {items.length === 1 ? 'componente' : 'componentes'}
        </Typography>
      </Stack>

      {items.length === 0 ? (
        <Typography variant="body2" sx={{ color: '#78716c' }}>
          Nada atribuído a esta bancada neste serviço.
        </Typography>
      ) : (
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              borderBottom: '1px solid #e7e5e4',
              py: 0.9,
              px: 0.5,
              textAlign: 'left',
              fontSize: 13,
              verticalAlign: 'top',
            },
            '& th': { fontWeight: 700, color: '#44403c', fontSize: 11 },
          }}
        >
          <thead>
            <tr>
              <th>Pronto</th>
              <th style={{ width: 88 }}>Qtd</th>
              <th style={{ width: 120 }}>Quando</th>
              <th>Receita</th>
            </tr>
          </thead>
          <tbody>
            {items.map((line) => (
              <tr key={line.key}>
                <td>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#1c1917' }}>
                    {line.item.name}
                  </Typography>
                  {line.item.notes ? (
                    <Typography variant="caption" sx={{ color: '#78716c', display: 'block' }}>
                      {line.item.notes}
                    </Typography>
                  ) : null}
                </td>
                <td>{line.quantityLabel || '—'}</td>
                <td>{line.readyLabel}</td>
                <td style={{ color: '#57534e' }}>{line.recipeTitle}</td>
              </tr>
            ))}
          </tbody>
        </Box>
      )}
    </Box>
  );
}

type Props = {
  service: ServiceRecord;
  recipes: RecipeRecord[];
  layout: KitchenLayout | null;
};

export function ServiceMiseSheets({ service, recipes, layout }: Props) {
  const plan = useMemo(() => aggregateMiseByStation(recipes, layout), [layout, recipes]);

  const sheets = [
    ...plan.stations.map((group) => ({
      key: group.station.id,
      stationName: group.station.name,
      stationTypeLabel: stationTypeMeta(group.station.type).label,
      items: group.items,
    })),
    ...(plan.unassigned.length
      ? [
          {
            key: 'unassigned',
            stationName: 'Não alocado',
            stationTypeLabel: 'Sem bancada',
            items: plan.unassigned,
          },
        ]
      : []),
  ];

  if (sheets.length === 0) {
    return (
      <Box className="recipe-print-sheet recipe-print-sheet--a4-portrait recipe-print-sheet--mise">
        <Typography variant="h5" sx={{ fontWeight: 800 }}>
          Mise en place
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: '#78716c' }}>
          Sem planta ou sem componentes nas receitas deste serviço.
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={3}>
      {sheets.map((sheet) => (
        <StationSheet
          key={sheet.key}
          service={service}
          recipes={recipes}
          layoutName={layout?.name ?? 'Cozinha'}
          stationName={sheet.stationName}
          stationTypeLabel={sheet.stationTypeLabel}
          items={sheet.items}
        />
      ))}
    </Stack>
  );
}
