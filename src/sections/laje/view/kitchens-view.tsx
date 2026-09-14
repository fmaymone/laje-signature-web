import type { KitchenLayout } from 'src/types/kitchen-layout';

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

import { deleteKitchenLayout, useGetKitchenLayouts } from 'src/actions/kitchen-layouts';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LajeKitchensView() {
  const router = useRouter();
  const { layouts, layoutsLoading, layoutsError, layoutsEmpty, mutateLayouts } =
    useGetKitchenLayouts();

  const [pendingDelete, setPendingDelete] = useState<KitchenLayout | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteKitchenLayout(pendingDelete.id);
      toast.success('Planta removida');
      setPendingDelete(null);
      await mutateLayouts();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err && typeof err === 'object' && 'detail' in err
            ? String((err as { detail: unknown }).detail)
            : 'Falha ao remover planta';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [mutateLayouts, pendingDelete]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Cozinha"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Cozinha' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.kitchenNew}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Nova planta
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {layoutsLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          )}

          {!layoutsLoading && layoutsError && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Não foi possível listar"
                description={
                  typeof layoutsError === 'string'
                    ? layoutsError
                    : layoutsError && typeof layoutsError === 'object' && 'detail' in layoutsError
                      ? String((layoutsError as { detail: unknown }).detail)
                      : 'Faça login e confira se a API está no ar.'
                }
              />
            </Box>
          )}

          {!layoutsLoading && !layoutsError && layoutsEmpty && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Nenhuma planta da cozinha"
                description="Desenhe as bancadas no espaço: balcão frio, trabalho, churrasqueira, fogão."
                action={
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.kitchenNew}
                    variant="contained"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Nova planta
                  </Button>
                }
              />
            </Box>
          )}

          {!layoutsLoading && !layoutsError && layouts.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell width={140}>Estações</TableCell>
                  <TableCell width={180}>Atualizado</TableCell>
                  <TableCell align="right" width={120}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {layouts.map((layout) => (
                  <TableRow
                    key={layout.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.kitchenLayout(layout.id))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{layout.name}</Typography>
                    </TableCell>
                    <TableCell>{layout.stations?.length ?? 0}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {fDateTime(layout.updated_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton
                          component={RouterLink}
                          href={paths.dashboard.kitchenLayout(layout.id)}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => setPendingDelete(layout)}>
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
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        title="Excluir planta?"
        content={
          pendingDelete
            ? `Remover “${pendingDelete.name}”? Receitas que apontam para essas bancadas ficam sem estação.`
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
