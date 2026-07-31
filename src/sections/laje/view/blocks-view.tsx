import type { FlavorBlock } from 'src/types/library';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import TableRow from '@mui/material/TableRow';
import MenuItem from '@mui/material/MenuItem';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { deleteBlock, useGetBlocks } from 'src/actions/blocks';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { tagId, tagTitle } from '../flavor/tag-utils';

// ----------------------------------------------------------------------

const ORIGIN_LABEL: Record<string, string> = {
  catalog: 'Catálogo',
  custom: 'Custom',
  override: 'Editado',
};

const ORIGIN_COLOR: Record<string, 'default' | 'primary' | 'warning' | 'success'> = {
  catalog: 'default',
  custom: 'success',
  override: 'warning',
};

export function LajeBlocksView() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState('');
  const [origin, setOrigin] = useState('');
  const [pendingDelete, setPendingDelete] = useState<FlavorBlock | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { blocks, blocksLoading, blocksError, mutateBlocks } = useGetBlocks({
    q: search.trim() || undefined,
    origin: origin || undefined,
  });

  const families = useMemo(() => {
    const byId = new Map<string, string>();
    for (const block of blocks) {
      const id = tagId(block.family, 'family');
      const title = tagTitle(block.family, 'family');
      if (id) byId.set(id, title);
    }
    return [...byId.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'pt-BR'));
  }, [blocks]);

  const visibleBlocks = useMemo(
    () => (family ? blocks.filter((b) => tagId(b.family, 'family') === family) : blocks),
    [blocks, family]
  );

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteBlock(pendingDelete.id);
      toast.success(
        pendingDelete.origin === 'override'
          ? 'Override removido — voltou ao catálogo'
          : 'Bloco removido'
      );
      setPendingDelete(null);
      await mutateBlocks();
    } catch (err) {
      const message =
        typeof err === 'string'
          ? err
          : err && typeof err === 'object' && 'detail' in err
            ? String((err as { detail: unknown }).detail)
            : 'Falha ao excluir bloco';
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Blocos"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Blocos' },
        ]}
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.blockNew}
            variant="contained"
            startIcon={<Iconify icon="solar:add-circle-bold" />}
          >
            Novo bloco
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={2} sx={{ mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar bloco…"
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
            label="Família"
            value={family}
            onChange={(e) => setFamily(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="">Todas</MenuItem>
            {families.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.title}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Origem"
            value={origin}
            onChange={(e) => setOrigin(e.target.value)}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="">Todas</MenuItem>
            <MenuItem value="catalog">Catálogo</MenuItem>
            <MenuItem value="override">Editados</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </TextField>
        </Stack>
      </Stack>

      <Card>
        <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
          {blocksLoading && (
            <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
              <CircularProgress />
            </Stack>
          )}

          {!blocksLoading && blocksError && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Não foi possível listar blocos"
                description="Verifique login e API."
              />
            </Box>
          )}

          {!blocksLoading && !blocksError && !visibleBlocks.length && (
            <Box sx={{ p: 3 }}>
              <EmptyContent
                title="Nenhum bloco"
                description="Crie um bloco atômico ou ajuste os filtros."
                action={
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.blockNew}
                    variant="contained"
                    startIcon={<Iconify icon="solar:add-circle-bold" />}
                  >
                    Novo bloco
                  </Button>
                }
              />
            </Box>
          )}

          {!blocksLoading && !blocksError && visibleBlocks.length > 0 && (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nome</TableCell>
                  <TableCell>Família</TableCell>
                  <TableCell>Papéis</TableCell>
                  <TableCell width={120}>Origem</TableCell>
                  <TableCell align="right" width={140}>
                    Ações
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleBlocks.map((block) => (
                  <TableRow
                    key={block.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => router.push(paths.dashboard.block(block.id))}
                  >
                    <TableCell>
                      <Typography variant="subtitle2">{block.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {block.id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Label variant="soft" color="primary" title={tagId(block.family, 'family')}>
                        {tagTitle(block.family, 'family')}
                      </Label>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {block.culinary_roles.slice(0, 3).map((role) => (
                          <Label key={role} variant="soft" color="default">
                            {role}
                          </Label>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Label
                        variant="soft"
                        color={ORIGIN_COLOR[block.origin ?? 'catalog'] ?? 'default'}
                      >
                        {ORIGIN_LABEL[block.origin ?? 'catalog'] ?? block.origin}
                      </Label>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Tooltip title="Editar">
                        <IconButton
                          component={RouterLink}
                          href={paths.dashboard.block(block.id)}
                        >
                          <Iconify icon="solar:pen-bold" />
                        </IconButton>
                      </Tooltip>
                      {(block.origin === 'custom' || block.origin === 'override') && (
                        <Tooltip title="Excluir">
                          <IconButton color="error" onClick={() => setPendingDelete(block)}>
                            <Iconify icon="solar:trash-bin-trash-bold" />
                          </IconButton>
                        </Tooltip>
                      )}
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
        title="Excluir bloco?"
        content={
          pendingDelete
            ? pendingDelete.origin === 'override'
              ? `Remover o override de “${pendingDelete.name}”? O catálogo original volta a valer.`
              : `Remover “${pendingDelete.name}”?`
            : null
        }
        action={
          <Button
            variant="contained"
            color="error"
            disabled={deleting}
            onClick={() => void handleDelete()}
          >
            {deleting ? 'Excluindo…' : 'Excluir'}
          </Button>
        }
      />
    </DashboardContent>
  );
}
