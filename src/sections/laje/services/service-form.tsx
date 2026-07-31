import type { RecipeRecord } from 'src/types/recipe-record';
import type { ServiceRecord } from 'src/types/service-record';

import { useEffect, useState } from 'react';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetRecipeRecords } from 'src/actions/recipe-records';
import { createServiceRecord, updateServiceRecord } from 'src/actions/service-records';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao salvar serviço';
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

type FormState = {
  name: string;
  notes: string;
  service_date: string;
  recipes: RecipeRecord[];
};

function toForm(service: ServiceRecord | null | undefined, recipes: RecipeRecord[]): FormState {
  const byId = new Map(recipes.map((r) => [r.id, r]));
  return {
    name: service?.name ?? '',
    notes: service?.notes ?? '',
    service_date: service?.service_date ?? todayISO(),
    recipes: (service?.recipe_ids ?? []).map((id) => byId.get(id)).filter(Boolean) as RecipeRecord[],
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
  const [form, setForm] = useState<FormState>(() => toForm(service, []));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm(toForm(service, recipes));
  }, [service, recipes]);

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
    if (!form.service_date) {
      toast.error('Informe a data do serviço');
      return;
    }

    const payload = {
      name: form.name.trim(),
      notes: form.notes.trim() || null,
      service_date: form.service_date,
      recipe_ids: form.recipes.map((r) => r.id),
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
              label="Data do serviço"
              type="date"
              fullWidth
              value={form.service_date}
              onChange={(e) => setForm((prev) => ({ ...prev, service_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Notas"
              fullWidth
              multiline
              minRows={2}
              value={form.notes}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
            />
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
                      label={option.title}
                      size="small"
                      color="primary"
                      variant="soft"
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
          </Stack>
        </CardContent>
      </Card>

      <Stack direction="row" justifyContent="flex-end">
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
    </Stack>
  );
}
