import type { FlavorBlock } from 'src/types/library';

import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import { Iconify } from 'src/components/iconify';
import { Label } from 'src/components/label';
import { Scrollbar } from 'src/components/scrollbar';

import { tagId, tagTitle } from '../flavor/tag-utils';

// ----------------------------------------------------------------------

type Props = {
  blocks: FlavorBlock[];
  disabledIds?: Set<string>;
  onAdd: (block: FlavorBlock) => void;
};

export function BlockPalette({ blocks, disabledIds, onAdd }: Props) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return blocks;
    return blocks.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        tagId(b.family, 'family').includes(q) ||
        tagTitle(b.family, 'family').toLowerCase().includes(q) ||
        b.culinary_roles.some((r) => r.toLowerCase().includes(q))
    );
  }, [blocks, query]);

  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Blocos
        </Typography>
        <TextField
          size="small"
          fullWidth
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar bloco…"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Iconify icon="eva:search-fill" width={18} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Scrollbar sx={{ flex: 1, minHeight: 0 }}>
        <List dense disablePadding sx={{ px: 1, pb: 1 }}>
          {filtered.map((block) => {
            const already = disabledIds?.has(block.id);
            return (
              <ListItemButton
                key={block.id}
                disabled={already}
                onClick={() => onAdd(block)}
                sx={{ borderRadius: 1, mb: 0.25, alignItems: 'flex-start' }}
              >
                <ListItemText
                  primary={block.name}
                  secondary={
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                      <Label color="primary" variant="soft" title={tagId(block.family, 'family')}>
                        {tagTitle(block.family, 'family')}
                      </Label>
                      {already && (
                        <Label color="default" variant="outlined">
                          no canvas
                        </Label>
                      )}
                    </Stack>
                  }
                  primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                  secondaryTypographyProps={{ component: 'div' }}
                />
              </ListItemButton>
            );
          })}
        </List>
      </Scrollbar>
    </Stack>
  );
}
