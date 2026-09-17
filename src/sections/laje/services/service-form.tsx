import type { RecipeRecord } from 'src/types/recipe-record';
import type { ServiceRecord } from 'src/types/service-record';
import type { KitchenLayout } from 'src/types/kitchen-layout';

import { useEffect, useMemo, useState } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';

import { useGetIngredients } from 'src/actions/ingredients';
import { useGetKitchenLayouts } from 'src/actions/kitchen-layouts';
import { useGetRecipeRecords } from 'src/actions/recipe-records';
import { createServiceRecord, duplicateServiceRecord, updateServiceRecord } from 'src/actions/service-records';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import {
  defaultServiceDatetimeLocal,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from './service-aggregate';
import { ServiceShoppingList } from './service-shopping-list';
import { ServiceTimeline } from './service-timeline';
import { ServiceMiseFloor } from './service-mise-floor';

// ----------------------------------------------------------------------

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao salvar serviço';
}

type FormState = {
  name: string;
  notes: string;
  /** Valor datetime-local (YYYY-MM-DDTHH:mm). */
  service_date_local: string;
  recipes: RecipeRecord[];
  kitchen_layout_id: string;
};

function toForm(
  service: ServiceRecord | null | undefined,
  recipes: RecipeRecord[],
  layouts: KitchenLayout[]
): FormState {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  const savedLayout = service?.kitchen_layout_id ?? '';
  const fallbackLayout = !savedLayout && layouts.length === 1 ? layouts[0].id : savedLayout;
  return {
    name: service?.name ?? '',
    notes: service?.notes ?? '',
    service_date_local: service?.service_date
      ? toDatetimeLocalValue(service.service_date)
      : defaultServiceDatetimeLocal(),
    recipes: (service?.recipe_ids ?? []).map((id) => byId.get(id)).filter(Boolean) as RecipeRecord[],
    kitchen_layout_id: fallbackLayout,
  };
}

type Props = {
  mode: 'create' | 'edit';
  service?: ServiceRecord | null;
  loading?: boolean;
  onSaved: (service: ServiceRecord) => void;
};

export function ServiceForm({ mode, service, loading, onSaved }: Props) {
  const { recipes } = useGetRecipeRecords();
  const { ingredients } = useGetIngredients();
  const { layouts } = useGetKitchenLayouts();
  const [form, setForm] = useState<FormState>(() => toForm(service, [], []));
  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients]
  );

  const recipeIdsKey = (service?.recipe_ids ?? []).join(',');

  useEffect(() => {
    setForm(toForm(service, recipes, layouts));
    // completed_steps is toggled inline and must not wipe unsaved form fields.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    service?.id,
    service?.name,
    service?.notes,
    service?.service_date,
    service?.kitchen_layout_id,
    recipeIdsKey,
    recipes,
    layouts,
  ]);

  if (loading) {
    return (
      <Card>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      </Card>
    );
  }

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Informe o nome do serviço');
      return;
    }
    if (!form.service_date_local) {
      toast.error('Informe a data e o horário do serviço');
      return;
    }

    const payload = {
      name: form.name.trim(),
      notes: form.notes.trim() || null,
      service_date: fromDatetimeLocalValue(form.service_date_local),
      recipe_ids: form.recipes.map((r) => r.id),
      kitchen_layout_id: form.kitchen_layout_id || null,
    };

    setSaving(true);
    try {
      const saved =
        mode === 'create'
          ? await createServiceRecord(payload)
          : await updateServiceRecord(service!.id, payload);
      toast.success(mode === 'create' ? 'Serviço criado' : 'Serviço salvo');
      onSaved(saved);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicate = async () => {
    if (!service?.id) return;
    setDuplicating(true);
    try {
      const copied = await duplicateServiceRecord(service.id);
      toast.success('Serviço duplicado');
      onSaved(copied);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDuplicating(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h6">Serviço</Typography>
            <TextField
              label="Nome"
              fullWidth
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="ex.: Almoço degustação"
            />
            <TextField
              label="Data e horário do serviço"
              type="datetime-local"
              fullWidth
              value={form.service_date_local}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, service_date_local: e.target.value }))
              }
              InputLabelProps={{ shrink: true }}
              helperText="Horário em que o serviço começa — a timeline conta a antecedência a partir daqui."
            />
            <TextField
              label="Notas"
              fullWidth
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
            <TextField
              select
              label="Planta da cozinha"
              fullWidth
              value={form.kitchen_layout_id}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, kitchen_layout_id: e.target.value }))
              }
              helperText="Usada no dia do serviço para mostrar o que está pronto em cada bancada."
            >
              <MenuItem value="">Nenhuma</MenuItem>
              {layouts.map((layout) => (
                <MenuItem key={layout.id} value={layout.id}>
                  {layout.name} ({layout.stations?.length ?? 0} estações)
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">Receitas</Typography>
            <Autocomplete
              multiple
              options={recipes}
              value={form.recipes}
              onChange={(_e, next) => setForm((prev) => ({ ...prev, recipes: next }))}
              getOptionLabel={(option) => option.title}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              filterSelectedOptions
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack>
                    <Typography variant="body2">{option.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.block_ids?.length ?? 0} blocos · {option.steps?.length ?? 0} passos
                    </Typography>
                  </Stack>
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...tagProps } = getTagProps({ index });
                  return (
                    <Chip
                      {...tagProps}
                      key={option.id}
                      component={RouterLink}
                      href={paths.dashboard.recipeRecord(option.id)}
                      clickable
                      label={option.title}
                      size="small"
                      color="primary"
                      variant="soft"
                      onClick={(e) => e.stopPropagation()}
                    />
                  );
                })
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Receitas do serviço"
                  placeholder="Buscar e adicionar receitas…"
                />
              )}
            />

            {form.recipes.length > 0 && (
              <Stack spacing={0.75}>
                <Typography variant="caption" color="text.secondary">
                  Abrir no editor
                </Typography>
                {form.recipes.map((recipe) => (
                  <Stack
                    key={recipe.id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{
                      py: 0.5,
                      px: 1,
                      borderRadius: 1,
                      bgcolor: 'background.neutral',
                    }}
                  >
                    <Link
                      component={RouterLink}
                      href={paths.dashboard.recipeRecord(recipe.id)}
                      variant="subtitle2"
                      color="inherit"
                      underline="hover"
                      sx={{ flex: 1, minWidth: 0 }}
                      noWrap
                    >
                      {recipe.title}
                    </Link>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {recipe.steps?.length ?? 0} passos
                    </Typography>
                    <IconButton
                      component={RouterLink}
                      href={paths.dashboard.recipeRecord(recipe.id)}
                      size="small"
                      aria-label={`Editar ${recipe.title}`}
                    >
                      <Iconify icon="solar:pen-bold" width={18} />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="flex-end" spacing={1.5} flexWrap="wrap" useFlexGap>
        {mode === 'edit' && service?.id ? (
          <Button
            color="inherit"
            variant="outlined"
            size="large"
            disabled={duplicating}
            onClick={() => void handleDuplicate()}
            startIcon={
              duplicating ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <Iconify icon="solar:copy-bold" />
              )
            }
          >
            Duplicar
          </Button>
        ) : null}
        {mode === 'edit' && service?.id ? (
          <Button
            component={RouterLink}
            href={`${paths.dashboard.servicePrint(service.id)}?print=missing`}
            color="inherit"
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="solar:clipboard-list-bold" />}
          >
            Imprimir faltando
          </Button>
        ) : null}
        {mode === 'edit' && service?.id ? (
          <Button
            component={RouterLink}
            href={paths.dashboard.servicePrint(service.id)}
            color="inherit"
            variant="outlined"
            size="large"
            startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
          >
            Imprimir plano
          </Button>
        ) : null}
        <Button
          variant="contained"
          size="large"
          disabled={saving}
          onClick={() => void handleSave()}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <Iconify icon="solar:diskette-bold" />
            )
          }
        >
          {mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
        </Button>
      </Stack>

      {form.recipes.length > 0 && (
        <>
          <ServiceShoppingList
            recipes={form.recipes}
            ingredientsById={ingredientsById}
            printMissingHref={
              mode === 'edit' && service?.id
                ? `${paths.dashboard.servicePrint(service.id)}?print=missing`
                : null
            }
          />
          <ServiceMiseFloor
            recipes={form.recipes}
            layout={layouts.find((item) => item.id === form.kitchen_layout_id) ?? null}
          />
          <ServiceTimeline
            recipes={form.recipes}
            serviceDate={fromDatetimeLocalValue(form.service_date_local)}
            serviceId={mode === 'edit' ? service?.id : null}
            completedSteps={service?.completed_steps ?? []}
            onCompletedStepsChange={
              mode === 'edit' && service?.id
                ? (next) => updateServiceRecord(service.id, { completed_steps: next }).then(() => undefined)
                : undefined
            }
          />
        </>
      )}
    </Stack>
  );
}
