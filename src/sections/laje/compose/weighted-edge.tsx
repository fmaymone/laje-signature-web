import type { LinkWeight } from 'src/types/compose-graph';
import type { Edge, EdgeProps } from '@xyflow/react';

import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export type WeightedEdgeData = {
  weight: LinkWeight;
};

export type WeightedFlowEdge = Edge<WeightedEdgeData, 'weighted'>;

const STROKE: Record<LinkWeight, { width: number; color: string }> = {
  1: { width: 1.5, color: 'var(--mui-palette-grey-500, #919EAB)' },
  2: { width: 2.5, color: 'var(--mui-palette-primary-main, #1C252E)' },
  3: { width: 4, color: 'var(--mui-palette-warning-dark, #B76E00)' },
};

const LABEL: Record<LinkWeight, string> = {
  1: '1 leve',
  2: '2 média',
  3: '3 forte',
};

export function WeightedEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<WeightedFlowEdge>) {
  const weight = (data?.weight ?? 2) as LinkWeight;
  const stroke = STROKE[weight];
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: stroke.color,
          strokeWidth: selected ? stroke.width + 1 : stroke.width,
        }}
      />
      <EdgeLabelRenderer>
        <Box
          className="nodrag nopan"
          sx={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: selected ? 'primary.main' : 'divider',
            borderRadius: 1,
            px: 0.75,
            py: 0.25,
            pointerEvents: 'all',
            boxShadow: 1,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
            {LABEL[weight]}
          </Typography>
        </Box>
      </EdgeLabelRenderer>
    </>
  );
}
