import type { FlavorBlock } from 'src/types/library';
import type { Node, NodeProps } from '@xyflow/react';
import type { HandleSide } from 'src/types/compose-graph';

import { Handle, Position } from '@xyflow/react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { Label } from 'src/components/label';

import { sensoryPeaks } from '../flavor/sensory';
import { tagId, tagTitle } from '../flavor/tag-utils';

// ----------------------------------------------------------------------

export type FlavorBlockNodeData = {
  block: FlavorBlock;
};

export type FlavorBlockFlowNode = Node<FlavorBlockNodeData, 'flavorBlock'>;

const HANDLES: { id: HandleSide; position: Position }[] = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
];

// ----------------------------------------------------------------------

export function FlavorBlockNode({ data, selected }: NodeProps<FlavorBlockFlowNode>) {
  const { block } = data;
  const peaks = sensoryPeaks(block.target_sensory_profile).slice(0, 3);

  return (
    <Card
      sx={{
        width: 240,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        boxShadow: (theme) => theme.vars.customShadows.z8,
      }}
    >
      {HANDLES.map(({ id, position }) => (
        <Handle
          key={id}
          id={id}
          type="source"
          position={position}
          className="nodrag nopan"
          isConnectable
          style={{
            width: 12,
            height: 12,
            background: 'var(--mui-palette-primary-main, #1C252E)',
            border: '2px solid var(--mui-palette-background-paper, #fff)',
            borderRadius: '50%',
          }}
        />
      ))}

      <CardContent sx={{ py: 1.5, px: 1.75, '&:last-child': { pb: 1.5 } }}>
        <Stack spacing={1}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="subtitle2" sx={{ lineHeight: 1.3, pr: 0.5 }}>
              {block.name}
            </Typography>
            <Label color="primary" variant="soft" sx={{ flexShrink: 0 }} title={tagId(block.family, 'family')}>
              {tagTitle(block.family, 'family')}
            </Label>
          </Stack>

          {block.culinary_roles.length > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {block.culinary_roles.slice(0, 3).map((role) => (
                <Label key={role} variant="outlined" color="default">
                  {role}
                </Label>
              ))}
            </Stack>
          )}

          {(block.techniques?.length ?? 0) > 0 && (
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {block.techniques!.slice(0, 3).map((technique) => (
                <Label
                  key={tagId(technique, 'technique')}
                  variant="soft"
                  color="info"
                  title={tagId(technique, 'technique')}
                >
                  {tagTitle(technique, 'technique')}
                </Label>
              ))}
            </Stack>
          )}

          {peaks.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              {peaks.map((peak) => (
                <Label key={peak.key} variant="soft" color={peak.color}>
                  {peak.label} {peak.value}
                </Label>
              ))}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
