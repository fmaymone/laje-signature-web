import type { FlavorBlock } from 'src/types/library';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { useGetFlavorBlocks } from 'src/actions/library';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { FlavorBlockCard } from '../flavor';
import { tagId, tagTitle } from '../flavor/tag-utils';

// ----------------------------------------------------------------------

function matchesQuery(block: FlavorBlock, query: string) {
  if (!query) return true;
  const haystack = [
    block.name,
    tagId(block.family, 'family'),
    tagTitle(block.family, 'family'),
    block.id,
    ...block.culinary_roles,
    ...block.texture_targets,
    ...block.ingredient_ids,
    ...block.compatible_protagonists,
    ...(block.techniques ?? []).flatMap((t) => [tagId(t, 'technique'), tagTitle(t, 'technique')]),
  ]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

// ----------------------------------------------------------------------

export function LajeLibraryView() {
  const { blocks, blocksLoading, blocksError, blocksEmpty } = useGetFlavorBlocks();
  const [search, setSearch] = useState('');
  const [family, setFamily] = useState<string | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blocks.filter((block) => {
      if (family && tagId(block.family, 'family') !== family) return false;
      return matchesQuery(block, q);
    });
  }, [blocks, family, search]);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Biblioteca"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Biblioteca' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Blocos de sabor
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Catálogo canônico da cozinha Laje — {blocksLoading ? '…' : `${blocks.length} blocos`}.
            Clique num bloco para ver o radar sensorial.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            fullWidth
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, família, ingrediente…"
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" width={20} />
                  </InputAdornment>
                ),
              },
            }}
            sx={{ maxWidth: { sm: 420 } }}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              size="small"
              variant={family === null ? 'contained' : 'soft'}
              color={family === null ? 'primary' : 'inherit'}
              onClick={() => setFamily(null)}
            >
              Todas
            </Button>
            {families.map((f) => (
              <Button
                key={f.id}
                size="small"
                variant={family === f.id ? 'contained' : 'soft'}
                color={family === f.id ? 'primary' : 'inherit'}
                onClick={() => setFamily(f.id)}
              >
                {f.title}
              </Button>
            ))}
          </Stack>
        </Stack>

        {blocksLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {!!blocksError && (
          <EmptyContent
            filled
            title="Não foi possível carregar a biblioteca"
            description="Verifique VITE_SERVER_URL e se a API está no ar."
            sx={{ py: 8 }}
          />
        )}

        {!blocksLoading && !blocksError && blocksEmpty && (
          <EmptyContent filled title="Nenhum bloco encontrado" sx={{ py: 8 }} />
        )}

        {!blocksLoading && !blocksError && !blocksEmpty && filtered.length === 0 && (
          <EmptyContent
            filled
            title="Nenhum resultado"
            description="Ajuste a busca ou o filtro de família."
            sx={{ py: 8 }}
          />
        )}

        {!blocksLoading && filtered.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gap: 2,
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)',
              },
            }}
          >
            {filtered.map((block) => (
              <FlavorBlockCard key={block.id} block={block} />
            ))}
          </Box>
        )}
      </Stack>
    </DashboardContent>
  );
}
