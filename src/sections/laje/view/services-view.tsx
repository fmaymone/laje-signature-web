import type { ServiceRecord } from 'src/types/service-record';

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

import { deleteServiceRecord, useGetServiceRecords } from 'src/actions/service-records';
import { DashboardContent } from 'src/layouts/dashboard';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LajeServicesView() {
  const router = useRouter();
  const { services, servicesLoading, servicesError, servicesEmpty, mutateServices } =
    useGetServiceRecords();

  const [pendingDelete, setPendingDelete] = useState<ServiceRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteServiceRecord(pendingDelete.id);
      toast.success('Serviço removido');
      setPendingDelete(null);
      await mutateServices();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err && typeof err === 'object' && 'detail' in err
            ? String((err as { detail: unknown }).detail)
            : 'Falha ao remover serviço';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  }, [mutateServices, pendingDelete]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Serviços"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Serviços' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.serviceNew}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Novo serviço
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {servicesLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          )}

          {!servicesLoading && servicesError && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Não foi possível listar"
                description="Faça login e confira se a API está no ar."
              />
            </Box>
          )}

          {!servicesLoading && !servicesError && servicesEmpty && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Nenhum serviço"
                description="Crie um serviço com nome, data/hora e as receitas do evento."
                action={
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.serviceNew}
                    variant="contained"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Novo serviço
                  </Button>
                }
              />
            </Box>
          )}

          {!servicesLoading && !servicesError && services.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell width={180}>Data e hora</TableCell>
                  <TableCell width={100}>Receitas</TableCell>
                  <TableCell align="right" width={120}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.service(item.id))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{item.name}</Typography>
                    </TableCell>
                    <TableCell>{fDateTime(item.service_date)}</TableCell>
                    <TableCell>{item.recipe_ids?.length ?? 0}</TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton component={RouterLink} href={paths.dashboard.service(item.id)}>
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
        title="Excluir serviço?"
        content={
          pendingDelete
            ? `Remover “${pendingDelete.name}”? Esta ação não pode ser desfeita.`
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
