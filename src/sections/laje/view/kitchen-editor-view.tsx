import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { KitchenCanvas } from 'src/sections/laje/kitchen/kitchen-canvas';

// ----------------------------------------------------------------------

type Props = {
  mode: 'new' | 'edit';
};

export function LajeKitchenEditorView({ mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const layoutId = mode === 'edit' ? String(params.id ?? '') : null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={mode === 'new' ? 'Nova planta' : 'Editar planta'}
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Cozinha', href: paths.dashboard.kitchen },
          { name: mode === 'new' ? 'Nova' : 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <KitchenCanvas
        layoutId={layoutId}
        initialName="Cozinha Laje"
        onCreated={(layout) => {
          router.replace(paths.dashboard.kitchenLayout(layout.id));
        }}
      />
    </DashboardContent>
  );
}
