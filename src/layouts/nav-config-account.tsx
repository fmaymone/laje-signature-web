import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

import type { AccountDrawerProps } from './components/account-drawer';

// ----------------------------------------------------------------------

export const _account: AccountDrawerProps['data'] = [
  {
    label: 'Início',
    href: paths.dashboard.root,
    icon: <Iconify icon="solar:home-angle-bold-duotone" />,
  },
  {
    label: 'Compor',
    href: paths.dashboard.recipes,
    icon: <Iconify icon="solar:magic-stick-3-bold-duotone" />,
  },
  {
    label: 'Composições',
    href: paths.dashboard.compositions,
    icon: <Iconify icon="solar:widget-5-bold-duotone" />,
  },
  {
    label: 'Blocos',
    href: paths.dashboard.blocks,
    icon: <Iconify icon="solar:chef-hat-bold-duotone" />,
  },
  {
    label: 'Biblioteca',
    href: paths.dashboard.library,
    icon: <Iconify icon="solar:notebook-bold-duotone" />,
  },
];
