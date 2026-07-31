import type { FlavorBlock, SensoryProfile, Tag } from 'src/types/library';

import { useEffect, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { createBlock, EMPTY_SENSORY, updateBlock } from 'src/actions/blocks';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { SensoryBars } from '../flavor/sensory-bars';
import { coerceTag, makeFamilyTag } from '../flavor/tag-utils';
import { BlockIngredientsField } from '../ingredients/block-ingredients-field';
import { DomainTagsField } from './domain-tags-field';

// ----------------------------------------------------------------------

const SENSORY_KEYS: (keyof SensoryProfile)[] = [
  'acidity',
  'saltiness',
  'sweetness',
  'bitterness',
  'umami',
  'fat',
  'heat',
  'aroma',
  'freshness',
];

const SENSORY_LABELS: Record<keyof SensoryProfile, string> = {
  acidity: 'Acidez',
  saltiness: 'Sal',
  sweetness: 'Doçura',
  bitterness: 'Amargor',
  umami: 'Umami',
  fat: 'Gordura',
  heat: 'Pimenta',
  aroma: 'Aroma',
  freshness: 'Frescor',
};

function splitList(value: string): string[] {
  return value
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinList(values: string[] | undefined): string {
  return (values ?? []).join(', ');
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 120);
}

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao salvar bloco';
}

// ----------------------------------------------------------------------

type FormState = {
  id: string;
  name: string;
  family: Tag | null;
  ingredient_ids: string[];
  culinary_roles: string;
  compatible_protagonists: string;
  recommended_base_ids: string;
  texture_targets: string;
  techniques: Tag[];
  notes: string;
  sensory: SensoryProfile;
};

function toForm(block?: FlavorBlock | null): FormState {
  return {
    id: block?.id ?? '',
    name: block?.name ?? '',
    family: coerceTag(block?.family ?? 'nordeste', 'family'),
    ingredient_ids: [...(block?.ingredient_ids ?? [])],
    culinary_roles: joinList(block?.culinary_roles),
    compatible_protagonists: joinList(block?.compatible_protagonists),
    recommended_base_ids: joinList(block?.recommended_base_ids),
    texture_targets: joinList(block?.texture_targets),
    techniques: (block?.techniques ?? [])
      .map((item) => coerceTag(item, 'technique'))
      .filter((item): item is Tag => Boolean(item)),
    notes: block?.notes ?? '',
    sensory: { ...EMPTY_SENSORY, ...(block?.target_sensory_profile ?? {}) },
  };
}

type Props = {
  mode: 'create' | 'edit';
  block?: FlavorBlock | null;
  loading?: boolean;
  onSaved: (block: FlavorBlock) => void;
};

export function BlockForm({ mode, block, loading, onSaved }: Props) {
  const [form, setForm] = useState<FormState>(() => toForm(block));
  const [saving, setSaving] = useState(false);
  const [idTouched, setIdTouched] = useState(mode === 'edit');

  useEffect(() => {
    setForm(toForm(block));
    setIdTouched(mode === 'edit');
  }, [block, mode]);

  const previewSensory = useMemo(() => form.sensory, [form.sensory]);

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
    const family = form.family ?? makeFamilyTag('nordeste');
    if (!form.name.trim() || !family.id) {
      toast.error('Nome e família são obrigatórios');
      return;
    }
    const id = mode === 'create' ? slugify(form.id || form.name) : form.id;
    if (!id) {
      toast.error('Informe um id válido');
      return;
    }

    const payload = {
      id,
      name: form.name.trim(),
      family,
      ingredient_ids: form.ingredient_ids,
      culinary_roles: splitList(form.culinary_roles),
      compatible_protagonists: splitList(form.compatible_protagonists),
      recommended_base_ids: splitList(form.recommended_base_ids),
      texture_targets: splitList(form.texture_targets),
      techniques: form.techniques,
      notes: form.notes.trim(),
      target_sensory_profile: form.sensory,
    };

    setSaving(true);
    try {
      const saved =
        mode === 'create' ? await createBlock(payload) : await updateBlock(id, payload);
      toast.success(mode === 'create' ? 'Bloco criado' : 'Bloco salvo');
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
            <Typography variant="h6">Identidade</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Nome"
                fullWidth
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    name,
                    id: !idTouched && mode === 'create' ? slugify(name) : prev.id,
                  }));
                }}
              />
              <TextField
                label="Id"
                fullWidth
                value={form.id}
                disabled={mode === 'edit'}
                onChange={(e) => {
                  setIdTouched(true);
                  setForm((prev) => ({ ...prev, id: slugify(e.target.value) }));
                }}
                helperText={mode === 'edit' ? 'Id fixo após criar' : 'gerado a partir do nome'}
              />
            </Stack>

            <DomainTagsField
              kind="family"
              value={form.family}
              onChange={(family) => setForm((prev) => ({ ...prev, family }))}
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
          <Stack spacing={2.5}>
            <Typography variant="h6">Composição</Typography>
            <BlockIngredientsField
              value={form.ingredient_ids}
              onChange={(ingredient_ids) => setForm((prev) => ({ ...prev, ingredient_ids }))}
            />
            <TextField
              label="Papéis culinários"
              fullWidth
              value={form.culinary_roles}
              onChange={(e) => setForm((prev) => ({ ...prev, culinary_roles: e.target.value }))}
              helperText="Ex.: protagonista, base, acidez"
            />
            <TextField
              label="Protagonistas compatíveis"
              fullWidth
              value={form.compatible_protagonists}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, compatible_protagonists: e.target.value }))
              }
            />
            <TextField
              label="Bases recomendadas"
              fullWidth
              value={form.recommended_base_ids}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, recommended_base_ids: e.target.value }))
              }
            />
            <TextField
              label="Texturas-alvo"
              fullWidth
              value={form.texture_targets}
              onChange={(e) => setForm((prev) => ({ ...prev, texture_targets: e.target.value }))}
            />
            <DomainTagsField
              multiple
              kind="technique"
              value={form.techniques}
              onChange={(techniques) => setForm((prev) => ({ ...prev, techniques }))}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2.5}>
            <Typography variant="h6">Perfil sensorial (0–10)</Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, 1fr)' },
              }}
            >
              {SENSORY_KEYS.map((key) => (
                <TextField
                  key={key}
                  label={SENSORY_LABELS[key]}
                  type="number"
                  inputProps={{ min: 0, max: 10, step: 1 }}
                  value={form.sensory[key]}
                  onChange={(e) => {
                    const value = Math.max(0, Math.min(10, Number(e.target.value) || 0));
                    setForm((prev) => ({
                      ...prev,
                      sensory: { ...prev.sensory, [key]: value },
                    }));
                  }}
                />
              ))}
            </Box>
            <Divider />
            <SensoryBars profile={previewSensory} />
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
          {mode === 'create' ? 'Criar bloco' : 'Salvar alterações'}
        </Button>
      </Stack>
    </Stack>
  );
}
