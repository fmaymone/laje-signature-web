import type { Node, NodeProps } from '@xyflow/react';
import type { KitchenStationType } from 'src/types/kitchen-layout';

import { NodeResizer } from '@xyflow/react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { stationTypeMeta } from './station-types';

// ----------------------------------------------------------------------

export type KitchenMiseLine = {
  id: string;
  name: string;
  quantityLabel?: string;
  recipeTitle?: string;
  readyLabel?: string;
};

export type KitchenStationNodeData = {
  stationType: KitchenStationType;
  name: string;
  color?: string | null;
  items?: KitchenMiseLine[];
  readOnly?: boolean;
};

export type KitchenStationFlowNode = Node<KitchenStationNodeData, 'kitchenStation'>;

export function KitchenStationNode({ data, selected }: NodeProps<KitchenStationFlowNode>) {
  const meta = stationTypeMeta(data.stationType);
  const color = data.color || meta.color;
  const items = data.items ?? [];
  const readOnly = Boolean(data.readOnly);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        borderRadius: 1.5,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : color,
        bgcolor: 'background.paper',
        boxShadow: (theme) => theme.vars.customShadows.z8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {!readOnly && (
        <NodeResizer
          minWidth={80}
          minHeight={64}
          isVisible={selected}
          lineStyle={{ borderColor: color }}
          handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
        />
      )}

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
          px: 1.25,
          py: 0.75,
          bgcolor: color,
          color: '#fff',
          minHeight: 40,
        }}
      >
        <Iconify icon={meta.icon} width={18} />
        <Typography variant="subtitle2" noWrap sx={{ flex: 1, fontWeight: 700, lineHeight: 1.2 }}>
          {data.name}
        </Typography>
      </Stack>

      {readOnly ? (
        <Box sx={{ px: 1.25, py: 0.75, flex: 1, overflow: 'auto', minHeight: 0 }}>
          {items.length === 0 ? (
            <Typography variant="caption" color="text.secondary">
              Nada atribuído
            </Typography>
          ) : (
            <Stack spacing={0.5}>
              {items.map((item) => (
                <Box key={item.id}>
                  <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, lineHeight: 1.25 }}>
                    {item.name}
                    {item.quantityLabel ? ` · ${item.quantityLabel}` : ''}
                  </Typography>
                  {(item.recipeTitle || item.readyLabel) && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.2 }}>
                      {[item.recipeTitle, item.readyLabel].filter(Boolean).join(' · ')}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <Box sx={{ px: 1.25, py: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            {meta.label}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
