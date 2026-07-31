import type { FlavorBlock } from 'src/types/library';
import type { LinkWeight } from 'src/types/compose-graph';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import {
  LINK_WEIGHT_LABEL,
  bulkUpsertBlockLinks,
  deleteBlockLink,
  updateBlockLink,
  useGetBlockLinks,
} from 'src/actions/block-links';
import { useGetBlocks } from 'src/actions/blocks';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import {
  parseFlavorBibleLines,
  resolvePairingTargets,
  toBulkItems,
} from './flavor-bible-parse';

// ----------------------------------------------------------------------

function errorMessage(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  return 'Falha na ligação';
}

type Props = {
  blockId: string;
};

export function BlockLinksPanel({ blockId }: Props) {
  const { links, linksLoading, mutateLinks } = useGetBlockLinks(blockId);
  const { blocks } = useGetBlocks();

  const [selected, setSelected] = useState<FlavorBlock[]>([]);
  const [weight, setWeight] = useState<LinkWeight>(2);
  const [pasteText, setPasteText] = useState('');
  const [plainWeight, setPlainWeight] = useState<LinkWeight>(2);
  const [saving, setSaving] = useState(false);

  const blockNameById = useMemo(
    () => new Map(blocks.map((b) => [b.id, b.name])),
    [blocks]
  );

  const options = useMemo(
    () =>
      blocks
        .filter((b) => b.id !== blockId)
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    [blockId, blocks]
  );

  const linkedTargetIds = useMemo(() => {
    const ids = new Set<string>();
    for (const link of links) {
      if (link.source_block_id === blockId) ids.add(link.target_block_id);
      if (link.target_block_id === blockId) ids.add(link.source_block_id);
    }
    return ids;
  }, [blockId, links]);

  const pastePreview = useMemo(() => {
    if (!pasteText.trim()) return [];
    return resolvePairingTargets(parseFlavorBibleLines(pasteText, plainWeight), blocks, blockId);
  }, [pasteText, plainWeight, blocks, blockId]);

  const pasteMatched = pastePreview.filter((row) => row.block);
  const pasteMissed = pastePreview.filter((row) => !row.block);

  const outgoing = useMemo(
    () => links.filter((link) => link.source_block_id === blockId),
    [blockId, links]
  );
  const incoming = useMemo(
    () => links.filter((link) => link.target_block_id === blockId),
    [blockId, links]
  );

  const handleAddSelected = async () => {
    if (!selected.length) {
      toast.error('Escolha ao menos um bloco');
      return;
    }
    setSaving(true);
    try {
      const result = await bulkUpsertBlockLinks({
        source_block_id: blockId,
        links: selected.map((block) => ({
          target_block_id: block.id,
          weight,
        })),
      });
      toast.success(
        `Combinações: ${result.created} novas, ${result.updated} atualizadas`
      );
      setSelected([]);
      await mutateLinks();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleApplyPaste = async () => {
    const items = toBulkItems(pastePreview);
    if (!items.length) {
      toast.error('Nenhuma combinação casou com blocos existentes');
      return;
    }
    setSaving(true);
    try {
      const result = await bulkUpsertBlockLinks({
        source_block_id: blockId,
        links: items,
      });
      toast.success(
        `Importadas: ${result.created} novas, ${result.updated} atualizadas` +
          (pasteMissed.length ? ` · ${pasteMissed.length} sem bloco` : '')
      );
      setPasteText('');
      await mutateLinks();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleCycleWeight = async (linkId: string, current: LinkWeight) => {
    const next = current === 1 ? 2 : current === 2 ? 3 : 1;
    try {
      await updateBlockLink(linkId, { weight: next });
      await mutateLinks();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const handleDelete = async (linkId: string) => {
    try {
      await deleteBlockLink(linkId, [blockId]);
      toast.success('Ligação removida');
      await mutateLinks();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  return (
    <Card>
      <CardContent>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h6">Combinações (bíblia de sabores)</Typography>
            <Typography variant="body2" color="text.secondary">
              Relacionamentos permanentes deste bloco com outros. Peso 1 leve · 2 média · 3 forte
              (negrito na Flavor Bible).
            </Typography>
          </Box>

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Adicionar por seleção</Typography>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems={{ md: 'flex-start' }}>
              <Autocomplete
                multiple
                fullWidth
                options={options}
                value={selected}
                onChange={(_e, next) => setSelected(next)}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(a, b) => a.id === b.id}
                filterSelectedOptions
                renderOption={(props, option) => (
                  <li {...props} key={option.id}>
                    <Stack>
                      <Typography variant="body2">{option.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {option.id}
                        {linkedTargetIds.has(option.id) ? ' · já ligado' : ''}
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
                        label={option.name}
                        size="small"
                        color="info"
                        variant="soft"
                      />
                    );
                  })
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Blocos que combinam"
                    placeholder="Buscar e selecionar vários…"
                  />
                )}
              />
              <TextField
                select
                size="small"
                label="Peso"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value) as LinkWeight)}
                sx={{ minWidth: 140 }}
              >
                <MenuItem value={1}>1 — Leve</MenuItem>
                <MenuItem value={2}>2 — Média</MenuItem>
                <MenuItem value={3}>3 — Forte</MenuItem>
              </TextField>
              <Button
                variant="contained"
                disabled={saving || !selected.length}
                onClick={() => void handleAddSelected()}
                startIcon={
                  saving ? (
                    <CircularProgress size={16} color="inherit" />
                  ) : (
                    <Iconify icon="solar:link-bold" />
                  )
                }
                sx={{ whiteSpace: 'nowrap' }}
              >
                Ligar
              </Button>
            </Stack>
          </Stack>

          <Divider />

          <Stack spacing={1.5}>
            <Typography variant="subtitle2">Colar lista (Flavor Bible)</Typography>
            <Typography variant="caption" color="text.secondary">
              Uma combinação por linha. Use <strong>**nome**</strong> para peso 3 (forte). Linhas
              normais usam o peso padrão abaixo. Casamos com id/nome dos blocos existentes.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <TextField
                select
                size="small"
                label="Peso das linhas sem negrito"
                value={plainWeight}
                onChange={(e) => setPlainWeight(Number(e.target.value) as LinkWeight)}
                sx={{ minWidth: 220 }}
              >
                <MenuItem value={1}>1 — Leve</MenuItem>
                <MenuItem value={2}>2 — Média</MenuItem>
                <MenuItem value={3}>3 — Forte</MenuItem>
              </TextField>
            </Stack>
            <TextField
              multiline
              minRows={5}
              fullWidth
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder={'**pimenta_malagueta**\ncoentro\nlimao_galego\n**azeite**'}
            />
            {pastePreview.length > 0 && (
              <Stack spacing={1}>
                {pasteMatched.length > 0 && (
                  <Alert severity="success">
                    {pasteMatched.length} casaram:{' '}
                    {pasteMatched
                      .slice(0, 8)
                      .map((row) => `${row.block!.name} (${row.weight})`)
                      .join(', ')}
                    {pasteMatched.length > 8 ? '…' : ''}
                  </Alert>
                )}
                {pasteMissed.length > 0 && (
                  <Alert severity="warning">
                    Sem bloco correspondente: {pasteMissed.map((row) => row.query).join(', ')}
                  </Alert>
                )}
                <Box>
                  <Button
                    variant="soft"
                    color="primary"
                    disabled={saving || !pasteMatched.length}
                    onClick={() => void handleApplyPaste()}
                    startIcon={<Iconify icon="solar:import-bold" />}
                  >
                    Importar {pasteMatched.length} combinações
                  </Button>
                </Box>
              </Stack>
            )}
          </Stack>

          <Divider />

          {linksLoading ? (
            <Stack alignItems="center" sx={{ py: 3 }}>
              <CircularProgress size={24} />
            </Stack>
          ) : outgoing.length === 0 && incoming.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Nenhuma combinação ainda. Selecione blocos ou cole uma lista.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {outgoing.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Este bloco combina com ({outgoing.length})
                  </Typography>
                  <LinksTable
                    links={outgoing}
                    blockNameById={blockNameById}
                    peerKey="target_block_id"
                    onCycleWeight={handleCycleWeight}
                    onDelete={handleDelete}
                  />
                </Box>
              )}
              {incoming.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Outros blocos apontam para este ({incoming.length})
                  </Typography>
                  <LinksTable
                    links={incoming}
                    blockNameById={blockNameById}
                    peerKey="source_block_id"
                    onCycleWeight={handleCycleWeight}
                    onDelete={handleDelete}
                  />
                </Box>
              )}
            </Stack>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

type LinkRow = {
  id: string;
  source_block_id: string;
  target_block_id: string;
  weight: LinkWeight;
};

function LinksTable({
  links,
  blockNameById,
  peerKey,
  onCycleWeight,
  onDelete,
}: {
  links: LinkRow[];
  blockNameById: Map<string, string>;
  peerKey: 'source_block_id' | 'target_block_id';
  onCycleWeight: (id: string, weight: LinkWeight) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...links].sort((a, b) => b.weight - a.weight);
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Bloco</TableCell>
          <TableCell width={140}>Peso</TableCell>
          <TableCell align="right" width={72} />
        </TableRow>
      </TableHead>
      <TableBody>
        {sorted.map((link) => {
          const peerId = link[peerKey];
          const name = blockNameById.get(peerId) ?? peerId;
          return (
            <TableRow key={link.id}>
              <TableCell>
                <Typography variant="body2">{name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {peerId}
                </Typography>
              </TableCell>
              <TableCell>
                <Label
                  variant="soft"
                  color={link.weight === 3 ? 'warning' : link.weight === 2 ? 'primary' : 'default'}
                  onClick={() => onCycleWeight(link.id, link.weight)}
                  sx={{ cursor: 'pointer' }}
                >
                  {link.weight} · {LINK_WEIGHT_LABEL[link.weight]}
                </Label>
              </TableCell>
              <TableCell align="right">
                <IconButton color="error" onClick={() => onDelete(link.id)}>
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
