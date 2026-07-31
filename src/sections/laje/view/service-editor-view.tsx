import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { useGetServiceRecord } from 'src/actions/service-records';
import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ServiceForm } from '../services/service-form';

// ----------------------------------------------------------------------

type Props = {
  mode: 'new' | 'edit';
};

export function LajeServiceEditorView({ mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const serviceId = mode === 'edit' ? String(params.id ?? '') : null;
  const { service, serviceLoading } = useGetServiceRecord(serviceId);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={mode === 'new' ? 'Novo serviço' : service?.name || 'Editar serviço'}
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Serviços', href: paths.dashboard.services },
          { name: mode === 'new' ? 'Novo' : 'Editar' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <ServiceForm
          mode={mode === 'new' ? 'create' : 'edit'}
          service={mode === 'edit' ? service : null}
          loading={mode === 'edit' && serviceLoading}
          onSaved={(saved) => {
            router.replace(paths.dashboard.service(saved.id));
          }}
        />
      </Stack>
    </DashboardContent>
  );
}
