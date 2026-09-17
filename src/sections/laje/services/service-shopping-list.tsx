import type { Ingredient, IngredientStockStatus } from 'src/types/ingredient';
import type { RecipeRecord } from 'src/types/recipe-record';

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

import { RouterLink } from 'src/routes/components';

import { updateIngredientStock } from 'src/actions/ingredients';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import {
  STATUS_COLOR,
  STATUS_LABEL,
  UNIT_OPTIONS,
} from 'src/types/ingredient';

import { aggregateShoppingList } from './service-aggregate';

// ----------------------------------------------------------------------

const STATUS_OPTIONS: IngredientStockStatus[] = [
  'out_of_stock',
  'low_stock',
  'on_order',
  'in_stock',
];

function unitLabel(unit: string) {
  return UNIT_OPTIONS.find((opt) => opt.value === unit)?.label ?? unit;
}

function formatQty(value: number) {
  if (Number.isInteger(value)) return String(value);
  return value.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return 'Falha ao atualizar status';
}

type Props = {
  recipes: RecipeRecord[];
  ingredientsById: Map<string, Ingredient>;
  printMissingHref?: string | null;
};

export function ServiceShoppingList({ recipes, ingredientsById, printMissingHref }: Props) {
  const [savingId, setSavingId] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<Record<string, IngredientStockStatus>>({});

  const lines = useMemo(
    () => aggregateShoppingList(recipes, ingredientsById),
    [recipes, ingredientsById]
  );
  const missingCount = useMemo(
    () =>
      lines.filter((line) => {
        const status =
          pendingStatus[line.ingredient_id] ??
          ingredientsById.get(line.ingredient_id)?.status ??
          'out_of_stock';
        return status === 'out_of_stock';
      }).length,
    [ingredientsById, lines, pendingStatus]
  );

  const handleStatus = async (ingredientId: string, status: IngredientStockStatus) => {
    const previous = ingredientsById.get(ingredientId)?.status;
    if (previous === status && !pendingStatus[ingredientId]) return;

    setPendingStatus((prev) => ({ ...prev, [ingredientId]: status }));
    setSavingId(ingredientId);
    try {
      await updateIngredientStock(ingredientId, { status_override: status });
    } catch (err) {
      toast.error(errorMessage(err));
      setPendingStatus((prev) => {
        const next = { ...prev };
        delete next[ingredientId];
        return next;
      });
    } finally {
      setSavingId((current) => (current === ingredientId ? null : current));
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ sm: 'flex-start' }}
            spacing={1.5}
          >
            <Box>
              <Typography variant="h6">Lista de compras</Typography>
              <Typography variant="body2" color="text.secondary">
                Ingredientes somados de todas as receitas do serviço
                {lines.length ? ` · ${lines.length} itens` : ''}
                {lines.length ? ` · ${missingCount} faltando` : ''}. Troque o status na linha para
                marcar o que já tem, o que falta ou o que está em pedido.
              </Typography>
            </Box>
            {printMissingHref ? (
              <Button
                component={RouterLink}
                href={printMissingHref}
                color="inherit"
                variant="outlined"
                startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
              >
                Imprimir faltando{missingCount ? ` (${missingCount})` : ''}
              </Button>
            ) : null}
          </Stack>

          {lines.length === 0 ? (
            <EmptyContent
              title="Lista vazia"
              description="As receitas selecionadas ainda não têm ingredientes."
              sx={{ py: 4 }}
            />
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Ingrediente</TableCell>
                    <TableCell width={180}>Status</TableCell>
                    <TableCell width={88}>Qtd</TableCell>
                    <TableCell width={100}>Unidade</TableCell>
                    <TableCell>Receitas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line) => {
                    const ingredient = ingredientsById.get(line.ingredient_id);
                    const status =
                      pendingStatus[line.ingredient_id] ?? ingredient?.status ?? 'out_of_stock';
                    const saving = savingId === line.ingredient_id;

                    return (
                      <TableRow key={line.key} hover>
                        <TableCell>
                          <Typography variant="subtitle2">{line.name}</Typography>
                        </TableCell>
                        <TableCell>
                          {ingredient ? (
                            <TextField
                              select
                              size="small"
                              fullWidth
                              value={status}
                              disabled={saving}
                              slotProps={{
                                htmlInput: { 'aria-label': `Status de ${line.name}` },
                              }}
                              onChange={(e) =>
                                void handleStatus(
                                  line.ingredient_id,
                                  e.target.value as IngredientStockStatus
                                )
                              }
                              InputProps={{
                                startAdornment: saving ? (
                                  <CircularProgress size={14} sx={{ mr: 0.75 }} />
                                ) : undefined,
                              }}
                            >
                              {STATUS_OPTIONS.map((option) => (
                                <MenuItem key={option} value={option}>
                                  <Label variant="soft" color={STATUS_COLOR[option]}>
                                    {STATUS_LABEL[option]}
                                  </Label>
                                </MenuItem>
                              ))}
                            </TextField>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              —
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>{formatQty(line.quantity)}</TableCell>
                        <TableCell>{unitLabel(line.unit)}</TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {line.recipeTitles.join(' · ')}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
