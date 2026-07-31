import type { CompositionGraph } from 'src/types/compose-graph';

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

import {
  deleteCompositionGraph,
  useGetCompositionGraphs,
} from 'src/actions/compose-graph';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LajeCompositionsView() {
  const router = useRouter();
  const { graphs, graphsLoading, graphsError, graphsEmpty, mutateGraphs } = useGetCompositionGraphs();

  const [pendingDelete, setPendingDelete] = useState<CompositionGraph | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteCompositionGraph(pendingDelete.id);
      toast.success('Composição removida');
      setPendingDelete(null);
      await mutateGraphs();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err && typeof err === 'object' && 'detail' in err
            ? String((err as { detail: unknown }).detail)
            : 'Falha ao remover composição';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [mutateGraphs, pendingDelete]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Composições"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Composições' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.compositionNew}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Nova composição
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {graphsLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          )}

          {!graphsLoading && graphsError && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Não foi possível listar"
                description={
                  typeof graphsError === 'string'
                    ? graphsError
                    : graphsError && typeof graphsError === 'object' && 'detail' in graphsError
                      ? String((graphsError as { detail: unknown }).detail)
                      : 'Faça login e confira se a API está no ar.'
                }
              />
            </Box>
          )}

          {!graphsLoading && !graphsError && graphsEmpty && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Nenhuma composição"
                description="Crie um desenho de blocos com título e ligações entre eles."
                action={
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.compositionNew}
                    variant="contained"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Nova composição
                  </Button>
                }
              />
            </Box>
          )}

          {!graphsLoading && !graphsError && graphs.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell width={120}>Blocos</TableCell>
                  <TableCell width={120}>Ligações</TableCell>
                  <TableCell width={180}>Atualizado</TableCell>
                  <TableCell align="right" width={120}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {graphs.map((graph) => (
                  <TableRow
                    key={graph.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.composition(graph.id))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{graph.title}</Typography>
                    </TableCell>
                    <TableCell>{graph.nodes.length}</TableCell>
                    <TableCell>{graph.edges.length}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {fDateTime(graph.updated_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton
                          component={RouterLink}
                          href={paths.dashboard.composition(graph.id)}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Excluir">
                        <IconButton color="error" onClick={() => setPendingDelete(graph)}>
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
        title="Excluir composição?"
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
