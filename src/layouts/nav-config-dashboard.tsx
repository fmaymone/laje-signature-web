import type { NavSectionProps } from 'src/components/nav-section';

import { paths } from 'src/routes/paths';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const navData: NavSectionProps['data'] = [
  {
    subheader: 'Atelier',
    items: [
      {
        title: 'Início',
        path: paths.dashboard.root,
        icon: <Iconify width={24} icon="solar:home-angle-bold-duotone" />,
      },
      {
        title: 'Receitas',
        path: paths.dashboard.recipes,
        icon: <Iconify width={24} icon="solar:chef-hat-bold-duotone" />,
      },
      {
        title: 'Biblioteca',
        path: paths.dashboard.library,
        icon: <Iconify width={24} icon="solar:notebook-bold-duotone" />,
      },
    ],
  },
];
