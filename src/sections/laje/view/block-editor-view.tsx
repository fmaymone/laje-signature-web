import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { useGetBlock } from 'src/actions/blocks';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { BlockForm } from '../blocks/block-form';
import { BlockLinksPanel } from '../blocks/block-links-panel';

// ----------------------------------------------------------------------

type Props = {
  mode: 'new' | 'edit';
};

export function LajeBlockEditorView({ mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const blockId = mode === 'edit' ? String(params.id ?? '') : null;
  const { block, blockLoading } = useGetBlock(blockId);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={mode === 'new' ? 'Novo bloco' : block?.name || 'Editar bloco'}
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Blocos', href: paths.dashboard.blocks },
          { name: mode === 'new' ? 'Novo' : 'Editar' },
        ]}
        action={
          block?.origin ? (
            <Label
              variant="soft"
              color={
                block.origin === 'custom'
                  ? 'success'
                  : block.origin === 'override'
                    ? 'warning'
                    : 'default'
              }
            >
              {block.origin === 'custom'
                ? 'Custom'
                : block.origin === 'override'
                  ? 'Editado'
                  : 'Catálogo'}
            </Label>
          ) : null
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <BlockForm
          mode={mode === 'new' ? 'create' : 'edit'}
          block={mode === 'edit' ? block : null}
          loading={mode === 'edit' && blockLoading}
          onSaved={(saved) => {
            router.replace(paths.dashboard.block(saved.id));
          }}
        />

        {mode === 'edit' && blockId && !blockLoading && <BlockLinksPanel blockId={blockId} />}
      </Stack>
    </DashboardContent>
  );
}
