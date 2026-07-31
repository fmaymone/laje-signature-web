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
        title: 'Compor',
        path: paths.dashboard.recipes,
        icon: <Iconify width={24} icon="solar:magic-stick-3-bold-duotone" />,
      },
      {
        title: 'Receitas',
        path: paths.dashboard.recipeRecords,
        icon: <Iconify width={24} icon="solar:document-text-bold-duotone" />,
      },
      {
        title: 'Serviços',
        path: paths.dashboard.services,
        icon: <Iconify width={24} icon="solar:calendar-bold-duotone" />,
      },
      {
        title: 'Composições',
        path: paths.dashboard.compositions,
        icon: <Iconify width={24} icon="solar:widget-5-bold-duotone" />,
      },
      {
        title: 'Blocos',
        path: paths.dashboard.blocks,
        icon: <Iconify width={24} icon="solar:chef-hat-bold-duotone" />,
      },
      {
        title: 'Ingredientes',
        path: paths.dashboard.ingredients,
        icon: <Iconify width={24} icon="solar:fridge-bold-duotone" />,
      },
      {
        title: 'Biblioteca',
        path: paths.dashboard.library,
        icon: <Iconify width={24} icon="solar:notebook-bold-duotone" />,
      },
    ],
  },
];
