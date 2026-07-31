import type { Ingredient, IngredientStockStatus, IngredientUnit } from 'src/types/ingredient';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';

import {
  createIngredient,
  seedIngredients,
  updateIngredientStock,
  useGetIngredients,
} from 'src/actions/ingredients';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import {
  STATUS_COLOR,
  STATUS_LABEL,
  UNIT_OPTIONS,
} from 'src/types/ingredient';

// ----------------------------------------------------------------------

const STATUS_FILTERS: { value: '' | IngredientStockStatus; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'out_of_stock', label: 'Faltando' },
  { value: 'low_stock', label: 'Estoque baixo' },
  { value: 'in_stock', label: 'Em estoque' },
  { value: 'on_order', label: 'Em pedido' },
];

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  return 'Falha na operação';
}

type DraftRow = {
  quantity: number;
  unit: string;
  reorder_level: number;
  status_override: '' | IngredientStockStatus;
};

function toDraft(item: Ingredient): DraftRow {
  return {
    quantity: item.stock_quantity ?? 0,
    unit: item.stock_unit || item.default_unit || 'g',
    reorder_level: item.reorder_level ?? 0,
    status_override: item.status_override ?? '',
  };
}

export function LajeIngredientsView() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | IngredientStockStatus>('');
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const { ingredients, ingredientsLoading, ingredientsError, mutateIngredients } =
    useGetIngredients({
      q: q.trim() || undefined,
      status: status || undefined,
    });

  const counts = useMemo(() => {
    const all = ingredients;
    return {
      total: all.length,
      missing: all.filter((i) => i.status === 'out_of_stock').length,
      low: all.filter((i) => i.status === 'low_stock').length,
    };
  }, [ingredients]);

  const draftOf = (item: Ingredient) => drafts[item.id] ?? toDraft(item);

  const patchDraft = (id: string, patch: Partial<DraftRow>, base: Ingredient) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? toDraft(base)), ...patch },
    }));
  };

  const handleSaveStock = async (item: Ingredient) => {
    const draft = draftOf(item);
    setSavingId(item.id);
    try {
      await updateIngredientStock(item.id, {
        quantity: Math.max(0, Number(draft.quantity) || 0),
        unit: (draft.unit || 'g') as IngredientUnit,
        reorder_level: Math.max(0, Number(draft.reorder_level) || 0),
        status_override: draft.status_override || null,
        clear_status_override: !draft.status_override,
      });
      toast.success(`Estoque de ${item.name} atualizado`);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[item.id];
        return next;
      });
      await mutateIngredients();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSavingId(null);
    }
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const result = await seedIngredients();
      toast.success(
        result.created > 0
          ? `${result.created} ingredientes adicionados (${result.total} no total)`
          : `Catálogo já carregado (${result.total} ingredientes)`
      );
      await mutateIngredients();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSeeding(false);
    }
  };

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Informe o nome do ingrediente');
      return;
    }
    setCreating(true);
    try {
      await createIngredient({ name });
      toast.success('Ingrediente criado');
      setNewName('');
      await mutateIngredients();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Ingredientes & estoque"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Ingredientes' },
        ]}
        action={
          <Button
            variant="outlined"
            onClick={() => void handleSeed()}
            disabled={seeding}
            startIcon={
              seeding ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="solar:database-bold" />
              )
            }
          >
            Carregar catálogo
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={2}
              alignItems={{ md: 'center' }}
            >
              <TextField
                fullWidth
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Buscar ingrediente…"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="eva:search-fill" width={20} />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as '' | IngredientStockStatus)}
                sx={{ minWidth: { md: 200 } }}
              >
                {STATUS_FILTERS.map((opt) => (
                  <MenuItem key={opt.label} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                {counts.total} · {counts.missing} faltando · {counts.low} baixo
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
              <TextField
                fullWidth
                label="Novo ingrediente"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleCreate();
                }}
                placeholder="Ex.: manjericão"
              />
              <Button
                variant="contained"
                disabled={creating}
                onClick={() => void handleCreate()}
                startIcon={
                  creating ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify icon="solar:add-circle-bold" />
                  )
                }
                sx={{ whiteSpace: 'nowrap' }}
              >
                Criar
              </Button>
            </Stack>
          </CardContent>
        </Card>

        <Card>
          <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
            {ingredientsLoading && (
              <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
                <CircularProgress />
              </Stack>
            )}

            {!ingredientsLoading && ingredientsError && (
              <Box sx={{ p: 3 }}>
                <EmptyContent
                  title="Não foi possível listar"
                  description="Faça login e confira se a API está no ar."
                />
              </Box>
            )}

            {!ingredientsLoading && !ingredientsError && ingredients.length === 0 && (
              <Box sx={{ p: 3 }}>
                <EmptyContent
                  title="Nenhum ingrediente"
                  description="Carregue o catálogo inicial ou crie o primeiro item."
                  action={
                    <Button
                      variant="contained"
                      onClick={() => void handleSeed()}
                      startIcon={<Iconify icon="solar:database-bold" />}
                    >
                      Carregar catálogo
                    </Button>
                  }
                />
              </Box>
            )}

            {!ingredientsLoading && !ingredientsError && ingredients.length > 0 && (
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Ingrediente</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell width={120}>Qtd</TableCell>
                      <TableCell width={120}>Unidade</TableCell>
                      <TableCell width={120}>Mínimo</TableCell>
                      <TableCell width={160}>Override</TableCell>
                      <TableCell align="right" width={100}>
                        Salvar
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ingredients.map((item) => {
                      const draft = draftOf(item);
                      const dirty = Boolean(drafts[item.id]);
                      return (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            <Typography variant="subtitle2">{item.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.category} · {item.slug}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Label variant="soft" color={STATUS_COLOR[item.status]}>
                              {STATUS_LABEL[item.status]}
                            </Label>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={draft.quantity}
                              onChange={(e) =>
                                patchDraft(
                                  item.id,
                                  { quantity: Math.max(0, Number(e.target.value) || 0) },
                                  item
                                )
                              }
                              inputProps={{ min: 0, step: 1 }}
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={draft.unit}
                              onChange={(e) =>
                                patchDraft(item.id, { unit: e.target.value }, item)
                              }
                              fullWidth
                            >
                              {UNIT_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell>
                            <TextField
                              size="small"
                              type="number"
                              value={draft.reorder_level}
                              onChange={(e) =>
                                patchDraft(
                                  item.id,
                                  {
                                    reorder_level: Math.max(0, Number(e.target.value) || 0),
                                  },
                                  item
                                )
                              }
                              inputProps={{ min: 0 }}
                              helperText="alerta"
                            />
                          </TableCell>
                          <TableCell>
                            <TextField
                              select
                              size="small"
                              value={draft.status_override}
                              onChange={(e) =>
                                patchDraft(
                                  item.id,
                                  {
                                    status_override: e.target.value as
                                      | ''
                                      | IngredientStockStatus,
                                  },
                                  item
                                )
                              }
                              fullWidth
                            >
                              <MenuItem value="">Automático</MenuItem>
                              {STATUS_FILTERS.filter((s) => s.value).map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </TextField>
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant={dirty ? 'contained' : 'text'}
                              disabled={!dirty || savingId === item.id}
                              onClick={() => void handleSaveStock(item)}
                            >
                              {savingId === item.id ? (
                                <CircularProgress size={16} color="inherit" />
                              ) : (
                                'Salvar'
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Stack>
    </DashboardContent>
  );
}
