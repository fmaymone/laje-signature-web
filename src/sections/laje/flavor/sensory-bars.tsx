import type { Theme } from '@mui/material/styles';
import type { SensoryProfile } from 'src/types/library';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { sensoryEntries, SENSORY_MAX } from './sensory';

import type { SensoryAxis } from './sensory';

// ----------------------------------------------------------------------

type Props = {
  profile: SensoryProfile;
  /** Show all axes (default) or only the highest N */
  top?: number;
  dense?: boolean;
};

function axisColor(theme: Theme, color: SensoryAxis['color']) {
  if (color === 'default') {
    return theme.vars.palette.text.secondary;
  }
  return theme.vars.palette[color].main;
}

export function SensoryBars({ profile, top, dense }: Props) {
  const theme = useTheme();
  let entries = sensoryEntries(profile);

  if (top != null) {
    entries = [...entries].sort((a, b) => b.value - a.value).slice(0, top);
  }

  return (
    <Stack spacing={dense ? 0.75 : 1}>
      {entries.map((entry) => {
        const pct = (entry.value / SENSORY_MAX) * 100;
        const color = axisColor(theme, entry.color);

        return (
          <Stack
            key={entry.key}
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ minHeight: dense ? 16 : 20 }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ width: dense ? 44 : 56, flexShrink: 0, lineHeight: 1.2 }}
            >
              {dense ? entry.short : entry.label}
            </Typography>

            <Box
              sx={{
                flex: 1,
                height: dense ? 6 : 8,
                borderRadius: 1,
                bgcolor: 'grey.200',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: `${pct}%`,
                  height: '100%',
                  borderRadius: 1,
                  bgcolor: color,
                  transition: theme.transitions.create('width'),
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{ width: 16, textAlign: 'right', flexShrink: 0, fontWeight: 600 }}
            >
              {entry.value}
            </Typography>
          </Stack>
        );
      })}
    </Stack>
  );
}
