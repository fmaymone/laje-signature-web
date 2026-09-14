import type { KitchenStationType } from 'src/types/kitchen-layout';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import Stack from '@mui/material/Stack';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';

import { STATION_TYPES } from './station-types';

// ----------------------------------------------------------------------

type Props = {
  onAdd: (type: KitchenStationType) => void;
};

export function StationPalette({ onAdd }: Props) {
  return (
    <Stack sx={{ height: '100%', minHeight: 0 }}>
      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant="subtitle2">Estações</Typography>
        <Typography variant="caption" color="text.secondary">
          Clique para colocar na planta.
        </Typography>
      </Box>

      <Scrollbar sx={{ flex: 1, minHeight: 0 }}>
        <List dense disablePadding sx={{ px: 1, pb: 1 }}>
          {STATION_TYPES.map((item) => (
            <ListItemButton
              key={item.type}
              onClick={() => onAdd(item.type)}
              sx={{ borderRadius: 1, mb: 0.25 }}
            >
              <Iconify icon={item.icon} width={20} sx={{ mr: 1.25, color: item.color }} />
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ variant: 'body2' }}
              />
            </ListItemButton>
          ))}
        </List>
      </Scrollbar>
    </Stack>
  );
}
