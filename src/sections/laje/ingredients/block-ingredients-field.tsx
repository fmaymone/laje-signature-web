import type { Ingredient } from 'src/types/ingredient';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { createIngredient, useGetIngredients } from 'src/actions/ingredients';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { STATUS_COLOR, STATUS_LABEL } from 'src/types/ingredient';

// ----------------------------------------------------------------------

type IngredientOption = Ingredient & {
  inputValue?: string;
  isCreateOption?: boolean;
};

const filter = createFilterOptions<IngredientOption>();

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  return 'Falha ao criar ingrediente';
}

type Props = {
  value: string[];
  onChange: (slugs: string[]) => void;
};

/** Multi-select de ingredientes por slug (compatível com blocos de sabor). */
export function BlockIngredientsField({ value, onChange }: Props) {
  const { ingredients, mutateIngredients } = useGetIngredients();
  const [picker, setPicker] = useState<IngredientOption | null>(null);
  const [creating, setCreating] = useState(false);

  const bySlug = useMemo(
    () => new Map(ingredients.map((item) => [item.slug, item])),
    [ingredients]
  );

  const selected = value
    .map((slug) => bySlug.get(slug) ?? null)
    .filter(Boolean) as Ingredient[];

  const add = async () => {
    if (!picker) return;

    let ingredient = picker;
    if (picker.isCreateOption && picker.inputValue) {
      setCreating(true);
      try {
        ingredient = await createIngredient({ name: picker.inputValue.trim() });
        await mutateIngredients();
        toast.success('Ingrediente criado');
      } catch (err) {
        toast.error(errorMessage(err));
        setCreating(false);
        return;
      } finally {
        setCreating(false);
      }
    }

    if (!ingredient.slug) return;
    if (value.includes(ingredient.slug)) {
      toast.error('Ingrediente já está no bloco');
      return;
    }
    onChange([...value, ingredient.slug]);
    setPicker(null);
  };

  const remove = (slug: string) => {
    onChange(value.filter((item) => item !== slug));
  };

  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }}>
        <Autocomplete
          fullWidth
          freeSolo
          options={ingredients as IngredientOption[]}
          value={picker}
          onChange={(_e, next) => {
            if (typeof next === 'string') {
              setPicker({
                id: `__create__`,
                slug: '',
                name: next,
                inputValue: next,
                isCreateOption: true,
                aliases: [],
                category: 'outro',
                default_unit: 'g',
                is_system: false,
                stock_quantity: 0,
                reorder_level: 0,
                status: 'out_of_stock',
              });
              return;
            }
            setPicker(next);
          }}
          filterOptions={(options, params) => {
            const filtered = filter(options, params);
            const input = params.inputValue.trim();
            if (
              input &&
              !options.some((opt) => opt.name.toLowerCase() === input.toLowerCase())
            ) {
              filtered.push({
                id: `__create__${input}`,
                slug: '',
                name: input,
                inputValue: input,
                isCreateOption: true,
                aliases: [],
                category: 'outro',
                default_unit: 'g',
                is_system: false,
                stock_quantity: 0,
                reorder_level: 0,
                status: 'out_of_stock',
              });
            }
            return filtered;
          }}
          getOptionLabel={(option) =>
            typeof option === 'string'
              ? option
              : option.isCreateOption
                ? option.inputValue || option.name
                : option.name
          }
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderOption={(props, option) => {
            if (option.isCreateOption) {
              return (
                <li {...props} key={option.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Iconify icon="solar:add-circle-bold" width={18} />
                    <Typography variant="body2">Criar “{option.inputValue}”</Typography>
                  </Stack>
                </li>
              );
            }
            return (
              <li {...props} key={option.id}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2">{option.name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.slug}
                    </Typography>
                  </Box>
                  <Label variant="soft" color={STATUS_COLOR[option.status]}>
                    {STATUS_LABEL[option.status]}
                  </Label>
                </Stack>
              </li>
            );
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Ingredientes"
              placeholder="Buscar ou criar…"
              helperText="Um bloco pode ter um ou mais ingredientes"
            />
          )}
        />
        <Button
          variant="outlined"
          disabled={creating || !picker}
          onClick={() => void add()}
          startIcon={
            creating ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <Iconify icon="solar:add-circle-bold" />
            )
          }
          sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
        >
          Adicionar
        </Button>
      </Stack>

      {selected.length === 0 && value.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum ingrediente no bloco.
        </Typography>
      ) : (
        <Stack direction="row" flexWrap="wrap" gap={1}>
          {value.map((slug) => {
            const item = bySlug.get(slug);
            return (
              <Chip
                key={slug}
                label={item?.name ?? slug}
                onDelete={() => remove(slug)}
                color={item ? STATUS_COLOR[item.status] : 'default'}
                variant="soft"
              />
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
