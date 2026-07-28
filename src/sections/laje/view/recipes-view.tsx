import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

export function LajeRecipesView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Receitas"
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Receitas' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <EmptyContent
        filled
        title="Nenhuma receita assinatura ainda"
        description="As composições geradas pela API aparecerão aqui."
        sx={{ py: 10 }}
      />
    </DashboardContent>
  );
}
