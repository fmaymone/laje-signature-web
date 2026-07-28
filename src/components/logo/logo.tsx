import type { LinkProps } from '@mui/material/Link';

import { forwardRef } from 'react';
import { mergeClasses } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import { styled, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export type LogoProps = LinkProps & {
  isSingle?: boolean;
  disabled?: boolean;
};

export const Logo = forwardRef<HTMLAnchorElement, LogoProps>((props, ref) => {
  const { className, href = paths.dashboard.root, isSingle = true, disabled, sx, ...other } = props;

  const theme = useTheme();
  const primary = theme.vars.palette.primary.main;
  const text = theme.vars.palette.text.primary;

  const singleLogo = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 1,
        height: 1,
        borderRadius: 1.5,
        bgcolor: primary,
        color: theme.vars.palette.primary.contrastText,
        typography: 'h6',
        fontFamily: theme.typography.fontSecondaryFamily,
        fontWeight: 800,
        letterSpacing: 0.5,
      }}
    >
      L
    </Box>
  );

  const fullLogo = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'baseline',
        gap: 0.75,
        width: 1,
        height: 1,
        typography: 'h6',
        fontFamily: theme.typography.fontSecondaryFamily,
        fontWeight: 800,
        color: text,
        whiteSpace: 'nowrap',
      }}
    >
      Laje
      <Box component="span" sx={{ color: primary, fontWeight: 600, typography: 'subtitle2' }}>
        Signature
      </Box>
    </Box>
  );

  return (
    <LogoRoot
      ref={ref}
      component={RouterLink}
      href={href}
      aria-label="Laje Signature"
      underline="none"
      className={mergeClasses([logoClasses.root, className])}
      sx={[
        {
          width: 40,
          height: 40,
          ...(!isSingle && { width: 160, height: 36 }),
          ...(disabled && { pointerEvents: 'none' }),
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {isSingle ? singleLogo : fullLogo}
    </LogoRoot>
  );
});

// ----------------------------------------------------------------------

const LogoRoot = styled(Link)(() => ({
  flexShrink: 0,
  color: 'inherit',
  display: 'inline-flex',
  verticalAlign: 'middle',
}));
