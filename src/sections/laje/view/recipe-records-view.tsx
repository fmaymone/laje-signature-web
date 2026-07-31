import type { RecipeRecord } from 'src/types/recipe-record';

import { useCallback, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { fDateTime } from 'src/utils/format-time';

import { deleteRecipeRecord, useGetRecipeRecords } from 'src/actions/recipe-records';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LajeRecipeRecordsView() {
  const router = useRouter();
  const { recipes, recipesLoading, recipesError, recipesEmpty, mutateRecipes } =
    useGetRecipeRecords();

  const [pendingDelete, setPendingDelete] = useState<RecipeRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteRecipeRecord(pendingDelete.id);
      toast.success('Receita removida');
      setPendingDelete(null);
      await mutateRecipes();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err && typeof err === 'object' && 'detail' in err
            ? String((err as { detail: unknown }).detail)
            : 'Falha ao remover receita';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [mutateRecipes, pendingDelete]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Receitas"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Receitas' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.recipeRecordNew}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Nova receita
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {recipesLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          )}

          {!recipesLoading && recipesError && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Não foi possível listar"
                description="Faça login e confira se a API está no ar."
              />
            </Box>
          )}

          {!recipesLoading && !recipesError && recipesEmpty && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Nenhuma receita"
                description="Crie uma receita com blocos de sabor e passos com tempo antes do serviço."
                action={
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.recipeRecordNew}
                    variant="contained"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Nova receita
                  </Button>
                }
              />
            </Box>
          )}

          {!recipesLoading && !recipesError && recipes.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell width={90}>Pessoas</TableCell>
                  <TableCell width={100}>Ingredientes</TableCell>
                  <TableCell width={80}>Blocos</TableCell>
                  <TableCell width={80}>Passos</TableCell>
                  <TableCell width={120}>Composição</TableCell>
                  <TableCell width={160}>Atualizado</TableCell>
                  <TableCell align="right" width={120}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recipes.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.recipeRecord(item.id))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{item.title}</Typography>
                    </TableCell>
                    <TableCell>{item.servings ?? 4}</TableCell>
                    <TableCell>{item.ingredients?.length ?? 0}</TableCell>
                    <TableCell>{item.block_ids?.length ?? 0}</TableCell>
                    <TableCell>{item.steps?.length ?? 0}</TableCell>
                    <TableCell>
                      {item.composition_id ? (
                        <Label variant="soft" color="primary">
                          vinculada
                        </Label>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          —
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {fDateTime(item.updated_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton
                          component={RouterLink}
                          href={paths.dashboard.recipeRecord(item.id)}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => setPendingDelete(item)}>
                          <Iconify icon="solar:trash-bin-trash-bold" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        title="Excluir receita?"
        content={
          pendingDelete
            ? `Remover “${pendingDelete.title}”? Esta ação não pode ser desfeita.`
            : null
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={() => void handleConfirmDelete()}
          >
            {deleting ? 'Excluindo…' : 'Excluir'}
          </Button>
        }
      />
    </DashboardContent>
  );
}
