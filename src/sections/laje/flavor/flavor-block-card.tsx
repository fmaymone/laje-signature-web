import type { FlavorBlock } from 'src/types/library';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

import { sensoryPeaks } from './sensory';
import { SensoryBars } from './sensory-bars';
import { SensoryRadar } from './sensory-radar';
import { tagId, tagTitle } from './tag-utils';

// ----------------------------------------------------------------------

function formatId(id: string) {
  return id.replace(/_/g, ' ');
}

type Props = {
  block: FlavorBlock;
};

export function FlavorBlockCard({ block }: Props) {
  const [open, setOpen] = useState(false);
  const peaks = sensoryPeaks(block.target_sensory_profile);

  return (
    <>
      <Card
        onClick={() => setOpen(true)}
        sx={{
          height: '100%',
          cursor: 'pointer',
          transition: (theme) =>
            theme.transitions.create(['box-shadow', 'transform'], { duration: 160 }),
          '&:hover': {
            boxShadow: (theme) => theme.vars.customShadows.z8,
            transform: 'translateY(-2px)',
          },
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
            <Typography variant="h6" sx={{ pr: 1 }}>
              {block.name}
            </Typography>
            <Label color="primary" variant="soft" title={tagId(block.family, 'family')}>
              {tagTitle(block.family, 'family')}
            </Label>
          </Stack>

          {block.culinary_roles.length > 0 && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {block.culinary_roles.map((role) => (
                <Label key={role} variant="outlined" color="default">
                  {role}
                </Label>
              ))}
            </Stack>
          )}

          {peaks.length > 0 && (
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {peaks.map((peak) => (
                <Label key={peak.key} variant="soft" color={peak.color}>
                  {peak.label} {peak.value}
                </Label>
              ))}
            </Stack>
          )}

          <Box>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 1 }}>
              Perfil sensorial
            </Typography>
            <SensoryBars profile={block.target_sensory_profile} dense />
          </Box>

          {block.texture_targets.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Textura: {block.texture_targets.join(', ')}
            </Typography>
          )}

          <Box sx={{ mt: 'auto' }}>
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 0.75 }}>
              Ingredientes
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {block.ingredient_ids.map((id) => (
                <Label key={id} variant="soft" color="warning">
                  {formatId(id)}
                </Label>
              ))}
            </Stack>
          </Box>

          <Typography
            variant="caption"
            color="primary.main"
            sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}
          >
            <Iconify icon="solar:chart-2-bold-duotone" width={16} />
            Ver radar completo
          </Typography>
        </CardContent>
      </Card>

      <FlavorBlockDialog block={block} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

// ----------------------------------------------------------------------

type DialogProps = {
  block: FlavorBlock;
  open: boolean;
  onClose: () => void;
};

function FlavorBlockDialog({ block, open, onClose }: DialogProps) {
  const peaks = sensoryPeaks(block.target_sensory_profile, 9);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pr: 6 }}>
        {block.name}
        <IconButton
          aria-label="Fechar"
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12 }}
        >
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={3}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
            <Label color="primary" variant="soft" title={tagId(block.family, 'family')}>
              {tagTitle(block.family, 'family')}
            </Label>
            {block.culinary_roles.map((role) => (
              <Label key={role} variant="outlined" color="default">
                {role}
              </Label>
            ))}
          </Stack>

          {block.notes ? (
            <Typography variant="body2" color="text.secondary">
              {block.notes}
            </Typography>
          ) : null}

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              alignItems: 'start',
            }}
          >
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Radar sensorial
              </Typography>
              <SensoryRadar profile={block.target_sensory_profile} height={300} />
            </Box>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
                Intensidades (0–10)
              </Typography>
              <SensoryBars profile={block.target_sensory_profile} />

              {peaks.length > 0 && (
                <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 2 }}>
                  {peaks.map((peak) => (
                    <Label key={peak.key} variant="soft" color={peak.color}>
                      {peak.label} {peak.value}
                    </Label>
                  ))}
                </Stack>
              )}
            </Box>
          </Box>

          <Divider />

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Ingredientes
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {block.ingredient_ids.map((id) => (
                <Label key={id} variant="soft" color="warning">
                  {formatId(id)}
                </Label>
              ))}
            </Stack>
          </Box>

          {(block.techniques?.length ?? 0) > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Técnicas
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {block.techniques!.map((technique) => (
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
            </Box>
          )}

          {block.compatible_protagonists.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Protagonistas compatíveis
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                {block.compatible_protagonists.map((id) => (
                  <Label key={id} variant="outlined" color="default">
                    {formatId(id)}
                  </Label>
                ))}
              </Stack>
            </Box>
          )}

          {block.texture_targets.length > 0 && (
            <Typography variant="body2" color="text.secondary">
              Texturas: {block.texture_targets.join(', ')}
            </Typography>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">
          Fechar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
