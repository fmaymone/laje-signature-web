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
    label: 'Receitas',
    href: paths.dashboard.recipes,
    icon: <Iconify icon="solar:chef-hat-bold-duotone" />,
  },
  {
    label: 'Biblioteca',
    href: paths.dashboard.library,
    icon: <Iconify icon="solar:notebook-bold-duotone" />,
  },
];
