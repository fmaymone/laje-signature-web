import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useGetRecipeRecord } from 'src/actions/recipe-records';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { RecipeForm } from '../recipes/recipe-form';

// ----------------------------------------------------------------------

type Props = {
  mode: 'new' | 'edit';
};

export function LajeRecipeEditorView({ mode }: Props) {
  const router = useRouter();
  const params = useParams();
  const recipeId = mode === 'edit' ? String(params.id ?? '') : null;
  const { recipe, recipeLoading } = useGetRecipeRecord(recipeId);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={mode === 'new' ? 'Nova receita' : recipe?.title || 'Editar receita'}
        links={[
          { name: 'Atelier', href: paths.dashboard.root },
          { name: 'Receitas', href: paths.dashboard.recipeRecords },
          { name: mode === 'new' ? 'Nova' : 'Editar' },
        ]}
        action={
          mode === 'edit' && recipe?.id ? (
            <Button
              component={RouterLink}
              href={paths.dashboard.recipeRecordPrint(recipe.id)}
              variant="outlined"
              startIcon={<Iconify icon="solar:printer-minimalistic-bold" />}
            >
              Ficha técnica
            </Button>
          ) : undefined
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <RecipeForm
          mode={mode === 'new' ? 'create' : 'edit'}
          recipe={mode === 'edit' ? recipe : null}
          loading={mode === 'edit' && recipeLoading && !recipe}
          onSaved={(saved) => {
            // Troca /new → /:id sem remount destrutivo do form (já tem estado local).
            if (mode === 'new' || params.id !== saved.id) {
              router.replace(paths.dashboard.recipeRecord(saved.id));
            }
          }}
        />
      </Stack>
    </DashboardContent>
  );
}
