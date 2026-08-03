import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useGetIngredients } from 'src/actions/ingredients';
import { useGetRecipeRecord } from 'src/actions/recipe-records';
import { DashboardContent } from 'src/layouts/dashboard';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { printRecipeSheet } from '../recipes/print/print-sheet';
import { RecipeTechSheet } from '../recipes/print/recipe-tech-sheet';
import { RecipeTimelineSheet } from '../recipes/print/recipe-timeline-sheet';

import '../recipes/print/recipe-print.css';

// ----------------------------------------------------------------------

export function LajeRecipePrintView() {
  const params = useParams();
  const recipeId = String(params.id ?? '');
  const { recipe, recipeLoading, recipeError } = useGetRecipeRecord(recipeId || null);
  const { ingredients } = useGetIngredients();

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients]
  );

  if (recipeLoading && !recipe) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (recipeError || !recipe) {
    return (
      <DashboardContent>
        <EmptyContent
          title="Receita não encontrada"
          description="Volte ao livro de receitas e abra uma ficha salva."
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.recipeRecords}
              variant="contained"
            >
              Receitas
            </Button>
          }
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent className="recipe-print-root">
      <Box className="recipe-print-toolbar no-print">
        <CustomBreadcrumbs
          heading="Ficha técnica"
          links={[
            { name: 'Atelier', href: paths.dashboard.root },
            { name: 'Receitas', href: paths.dashboard.recipeRecords },
            { name: recipe.title, href: paths.dashboard.recipeRecord(recipe.id) },
            { name: 'Impressão' },
          ]}
          action={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                component={RouterLink}
                href={paths.dashboard.recipeRecord(recipe.id)}
                color="inherit"
                variant="outlined"
                startIcon={<Iconify icon="solar:arrow-left-bold" />}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="solar:document-text-bold" />}
                onClick={() => printRecipeSheet('portrait')}
              >
                Imprimir ficha (A4)
              </Button>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:chart-2-bold" />}
                onClick={() => printRecipeSheet('landscape')}
              >
                Imprimir timeline (A4 paisagem)
              </Button>
            </Stack>
          }
          sx={{ mb: { xs: 3, md: 4 } }}
        />

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Duas folhas A4: a ficha em retrato (ingredientes e processos) e a timeline em
              paisagem (marcadores no tempo + legenda com títulos inteiros). Na caixa de
              impressão, confirme orientação Retrato ou Paisagem conforme o botão escolhido.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box className="recipe-print-preview">
        <Box>
          <Label className="recipe-print-sheet-label no-print" variant="soft" color="default">
            Folha 1 · A4 retrato
          </Label>
          <RecipeTechSheet recipe={recipe} ingredientsById={ingredientsById} />
        </Box>

        <Box>
          <Label className="recipe-print-sheet-label no-print" variant="soft" color="warning">
            Folha 2 · A4 paisagem
          </Label>
          <RecipeTimelineSheet recipe={recipe} />
        </Box>
      </Box>
    </DashboardContent>
  );
}
