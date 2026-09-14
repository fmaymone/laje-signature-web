import type { RecipeMiseItem } from 'src/types/recipe-record';
import type { IngredientUnit } from 'src/types/ingredient';
import type { KitchenStation } from 'src/types/kitchen-layout';

import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import ListSubheader from '@mui/material/ListSubheader';

import { useGetKitchenLayouts } from 'src/actions/kitchen-layouts';
import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { UNIT_OPTIONS } from 'src/types/ingredient';

import { stationTypeMeta } from '../kitchen/station-types';

// ----------------------------------------------------------------------

function newMiseId() {
  return `mise_${Math.random().toString(36).slice(2, 10)}`;
}

type StationOption = {
  id: string;
  label: string;
  layoutName: string;
  station: KitchenStation;
};

type Props = {
  value: RecipeMiseItem[];
  onChange: (next: RecipeMiseItem[]) => void;
  onBlurSave?: () => void;
};

export function RecipeMiseEditor({ value, onChange, onBlurSave }: Props) {
  const { layouts, layoutsLoading, layoutsEmpty } = useGetKitchenLayouts();

  const stationOptions = useMemo<StationOption[]>(() => {
    const options: StationOption[] = [];
    for (const layout of layouts) {
      for (const station of layout.stations ?? []) {
        options.push({
          id: station.id,
          label: station.name,
          layoutName: layout.name,
          station,
        });
      }
    }
    return options;
  }, [layouts]);

  const grouped = useMemo(() => {
    const groups: { layoutName: string; options: StationOption[] }[] = [];
    const seen = new Map<string, StationOption[]>();
    for (const option of stationOptions) {
      const list = seen.get(option.layoutName);
      if (list) {
        list.push(option);
      } else {
        const next = [option];
        seen.set(option.layoutName, next);
        groups.push({ layoutName: option.layoutName, options: next });
      }
    }
    return groups;
  }, [stationOptions]);

  const patchItem = (id: string, patch: Partial<RecipeMiseItem>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addItem = () => {
    onChange([
      ...value,
      {
        id: newMiseId(),
        name: '',
        quantity: null,
        unit: 'un',
        notes: '',
        station_id: stationOptions[0]?.id ?? null,
        ready_minutes_before_service: 0,
      },
    ]);
  };

  return (
    <Stack spacing={2}>
      {layoutsEmpty && !layoutsLoading ? (
        <EmptyContent
          title="Nenhuma planta da cozinha"
          description="Crie a planta para atribuir cada componente a uma bancada."
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
      ) : null}

      {value.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          O que deve estar pronto nesta receita? Ex.: camarão limpo, aioli, brunoise.
        </Typography>
      ) : (
        <Stack spacing={1.5}>
          {value.map((item) => (
            <Box
              key={item.id}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.neutral',
              }}
            >
              <Stack spacing={1.25}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <TextField
                    size="small"
                    label="Componente"
                    fullWidth
                    value={item.name}
                    onChange={(e) => patchItem(item.id, { name: e.target.value })}
                    onBlur={onBlurSave}
                    placeholder="ex.: Camarão limpo e temperado"
                  />
                  <IconButton
                    color="error"
                    aria-label="Remover componente"
                    onClick={() => {
                      onChange(value.filter((row) => row.id !== item.id));
                      onBlurSave?.();
                    }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" />
                  </IconButton>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                  <TextField
                    size="small"
                    label="Qtd"
                    type="number"
                    value={item.quantity ?? ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      patchItem(item.id, {
                        quantity: raw === '' ? null : Math.max(0, Number(raw) || 0),
                      });
                    }}
                    onBlur={onBlurSave}
                    sx={{ width: { sm: 110 } }}
                    inputProps={{ min: 0, step: 'any' }}
                  />
                  <TextField
                    size="small"
                    select
                    label="Un."
                    value={item.unit || ''}
                    onChange={(e) =>
                      patchItem(item.id, {
                        unit: (e.target.value || null) as IngredientUnit | null,
                      })
                    }
                    onBlur={onBlurSave}
                    sx={{ width: { sm: 140 } }}
                  >
                    <MenuItem value="">—</MenuItem>
                    {UNIT_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    size="small"
                    select
                    label="Bancada"
                    value={item.station_id || ''}
                    onChange={(e) =>
                      patchItem(item.id, { station_id: e.target.value || null })
                    }
                    onBlur={onBlurSave}
                    sx={{ flex: 1, minWidth: 180 }}
                  >
                    <MenuItem value="">Não alocado</MenuItem>
                    {grouped.map((group) => [
                      <ListSubheader key={group.layoutName}>{group.layoutName}</ListSubheader>,
                      ...group.options.map((option) => (
                        <MenuItem key={option.id} value={option.id}>
                          {option.label}
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {stationTypeMeta(option.station.type).label}
                          </Typography>
                        </MenuItem>
                      )),
                    ])}
                  </TextField>
                  <TextField
                    size="small"
                    label="Min. antes"
                    type="number"
                    value={item.ready_minutes_before_service ?? 0}
                    onChange={(e) =>
                      patchItem(item.id, {
                        ready_minutes_before_service: Math.max(0, Number(e.target.value) || 0),
                      })
                    }
                    onBlur={onBlurSave}
                    sx={{ width: { sm: 120 } }}
                    inputProps={{ min: 0 }}
                  />
                </Stack>

                <TextField
                  size="small"
                  label="Notas"
                  fullWidth
                  value={item.notes ?? ''}
                  onChange={(e) => patchItem(item.id, { notes: e.target.value })}
                  onBlur={onBlurSave}
                  placeholder="ex.: GN 1/3, 4°C"
                />
              </Stack>
            </Box>
          ))}
        </Stack>
      )}

      <Box>
        <Button
          size="small"
          variant="outlined"
          onClick={addItem}
          startIcon={<Iconify icon="solar:add-circle-bold" />}
        >
          Adicionar componente
        </Button>
      </Box>
    </Stack>
  );
}
