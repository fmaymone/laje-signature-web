import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ComposeCanvas } from 'src/sections/laje/compose';

// ----------------------------------------------------------------------

type Props = {
  mode: 'new' | 'edit';
};

export function LajeCompositionEditorView({ mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const graphId = mode === 'edit' ? String(params.id ?? '') : null;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={mode === 'new' ? 'Nova composição' : 'Editar composição'}
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Composições', href: paths.dashboard.compositions },
          { name: mode === 'new' ? 'Nova' : 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ComposeCanvas
        graphId={graphId}
        initialTitle="Nova composição"
        onCreated={(graph) => {
          router.replace(paths.dashboard.composition(graph.id));
        }}
      />
    </DashboardContent>
  );
}
