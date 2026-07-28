import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';
import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LajeLibraryView() {
  const apiHint = CONFIG.serverUrl
    ? `API: ${CONFIG.serverUrl}/v1/library/summary`
    : 'Configure VITE_SERVER_URL para conectar à biblioteca.';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Biblioteca"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Biblioteca' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EmptyContent
        filled
        title="Biblioteca de blocos de sabor"
        description={`Catálogo nordestino (ingredientes, blocos, regras). ${apiHint}`}
        sx={{ py: 10 }}
      />
    </DashboardContent>
  );
}
