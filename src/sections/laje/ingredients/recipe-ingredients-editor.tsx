import type { Ingredient, IngredientUnit } from 'src/types/ingredient';
import type { RecipeIngredientLine } from 'src/types/recipe-record';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';

import { createIngredient, useGetIngredients } from 'src/actions/ingredients';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { STATUS_COLOR, STATUS_LABEL, UNIT_OPTIONS } from 'src/types/ingredient';

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
  value: RecipeIngredientLine[];
  onChange: (next: RecipeIngredientLine[]) => void;
  onBlurSave?: () => void;
};

export function RecipeIngredientsEditor({ value, onChange, onBlurSave }: Props) {
  const { ingredients, mutateIngredients } = useGetIngredients();
  const [picker, setPicker] = useState<IngredientOption | null>(null);
  const [quantity, setQuantity] = useState<number>(100);
  const [unit, setUnit] = useState<IngredientUnit>('g');
  const [creating, setCreating] = useState(false);

  const byId = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients]
  );

  const addLine = async () => {
    if (!picker) {
      toast.error('Escolha um ingrediente');
      return;
    }

    let ingredient = picker;
    if (picker.isCreateOption && picker.inputValue) {
      setCreating(true);
      try {
        ingredient = await createIngredient({
          name: picker.inputValue.trim(),
          default_unit: unit,
        });
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

    if (value.some((line) => line.ingredient_id === ingredient.id)) {
      toast.error('Ingrediente já está na lista');
      return;
    }

    onChange([
      ...value,
      {
        ingredient_id: ingredient.id,
        quantity,
        unit: unit || (ingredient.default_unit as IngredientUnit) || 'g',
      },
    ]);
    setPicker(null);
    setQuantity(100);
    onBlurSave?.();
  };

  const updateLine = (ingredientId: string, patch: Partial<RecipeIngredientLine>) => {
    onChange(
      value.map((line) =>
        line.ingredient_id === ingredientId ? { ...line, ...patch } : line
      )
    );
  };

  const removeLine = (ingredientId: string) => {
    onChange(value.filter((line) => line.ingredient_id !== ingredientId));
    onBlurSave?.();
  };

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-start' }}>
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
                default_unit: unit,
                is_system: false,
                stock_quantity: 0,
                reorder_level: 0,
                status: 'out_of_stock',
              });
              return;
            }
            setPicker(next);
            if (next && !next.isCreateOption && next.default_unit) {
              setUnit(next.default_unit as IngredientUnit);
            }
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
                default_unit: unit,
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
                      {option.category} · {option.default_unit}
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
            <TextField {...params} label="Ingrediente" placeholder="Buscar ou criar…" />
          )}
        />
        <TextField
          label="Qtd"
          type="number"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(0, Number(e.target.value) || 0))}
          inputProps={{ min: 0, step: 1 }}
          sx={{ width: { xs: '100%', md: 120 } }}
        />
        <TextField
          select
          label="Unidade"
          value={unit}
          onChange={(e) => setUnit(e.target.value as IngredientUnit)}
          sx={{ width: { xs: '100%', md: 140 } }}
        >
          {UNIT_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
        <Button
          variant="contained"
          disabled={creating || !picker}
          onClick={() => void addLine()}
          startIcon={
            creating ? <CircularProgress size={16} color="inherit" /> : <Iconify icon="solar:add-circle-bold" />
          }
          sx={{ whiteSpace: 'nowrap', minWidth: 120 }}
        >
          Adicionar
        </Button>
      </Stack>

      {value.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          Nenhum ingrediente na receita.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {value.map((line) => {
            const ingredient = byId.get(line.ingredient_id);
            return (
              <Stack
                key={line.ingredient_id}
                direction={{ xs: 'column', sm: 'row' }}
                spacing={1}
                alignItems={{ sm: 'center' }}
                sx={{ p: 1.25, borderRadius: 1, bgcolor: 'background.neutral' }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="subtitle2">
                    {ingredient?.name ?? line.ingredient_id}
                  </Typography>
                  {ingredient && (
                    <Label variant="soft" color={STATUS_COLOR[ingredient.status]} sx={{ mt: 0.5 }}>
                      {STATUS_LABEL[ingredient.status]}
                      {ingredient.stock_quantity > 0
                        ? ` · ${ingredient.stock_quantity}${ingredient.stock_unit || ''}`
                        : ''}
                    </Label>
                  )}
                </Box>
                <TextField
                  size="small"
                  label="Qtd"
                  type="number"
                  value={line.quantity}
                  onChange={(e) =>
                    updateLine(line.ingredient_id, {
                      quantity: Math.max(0, Number(e.target.value) || 0),
                    })
                  }
                  onBlur={onBlurSave}
                  sx={{ width: 110 }}
                />
                <TextField
                  select
                  size="small"
                  label="Un."
                  value={line.unit}
                  onChange={(e) => {
                    updateLine(line.ingredient_id, { unit: e.target.value });
                    onBlurSave?.();
                  }}
                  sx={{ width: 120 }}
                >
                  {UNIT_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton color="error" onClick={() => removeLine(line.ingredient_id)}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </Stack>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
