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
import { useGetRecipeRecords } from 'src/actions/recipe-records';
import { useGetServiceRecord } from 'src/actions/service-records';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { printRecipeSheet } from '../recipes/print/print-sheet';
import { ServiceShoppingSheet } from '../services/print/service-shopping-sheet';
import { ServiceTimelineSheet } from '../services/print/service-timeline-sheet';

import '../recipes/print/recipe-print.css';

// ----------------------------------------------------------------------

export function LajeServicePrintView() {
  const params = useParams();
  const serviceId = String(params.id ?? '');
  const { service, serviceLoading, serviceError } = useGetServiceRecord(serviceId || null);
  const { recipes, recipesLoading } = useGetRecipeRecords();
  const { ingredients } = useGetIngredients();

  const selectedRecipes = useMemo(() => {
    if (!service) return [];
    const byId = new Map(recipes.map((r) => [r.id, r]));
    return (service.recipe_ids ?? [])
      .map((id) => byId.get(id))
      .filter(Boolean) as typeof recipes;
  }, [service, recipes]);

  const ingredientsById = useMemo(
    () => new Map(ingredients.map((item) => [item.id, item])),
    [ingredients]
  );

  const loading = (serviceLoading && !service) || recipesLoading;

  if (loading) {
    return (
      <DashboardContent>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 10 }}>
          <CircularProgress />
        </Stack>
      </DashboardContent>
    );
  }

  if (serviceError || !service) {
    return (
      <DashboardContent>
        <EmptyContent
          title="Serviço não encontrado"
          description="Volte à lista e abra um serviço salvo."
          action={
            <Button component={RouterLink} href={paths.dashboard.services} variant="contained">
              Serviços
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
          heading="Plano do serviço"
          links={[
            { name: 'Atelier', href: paths.dashboard.root },
            { name: 'Serviços', href: paths.dashboard.services },
            { name: service.name, href: paths.dashboard.service(service.id) },
            { name: 'Impressão' },
          ]}
          action={
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              <Button
                component={RouterLink}
                href={paths.dashboard.service(service.id)}
                color="inherit"
                variant="outlined"
                startIcon={<Iconify icon="solar:arrow-left-bold" />}
              >
                Voltar
              </Button>
              <Button
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="solar:cart-large-2-bold" />}
                onClick={() => printRecipeSheet('portrait')}
              >
                Imprimir compras (A4)
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
              Duas folhas A4: lista de compras em retrato e timeline agregada em paisagem. Na
              caixa de impressão, confirme a orientação conforme o botão escolhido.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Box className="recipe-print-preview">
        <Box className="recipe-print-sheet-label no-print">
          <Typography variant="caption" color="text.secondary">
            Folha 1 · Lista de compras (A4 retrato)
          </Typography>
        </Box>
        <ServiceShoppingSheet
          service={service}
          recipes={selectedRecipes}
          ingredientsById={ingredientsById}
        />

        <Box className="recipe-print-sheet-label no-print" sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Folha 2 · Timeline (A4 paisagem)
          </Typography>
        </Box>
        <ServiceTimelineSheet service={service} recipes={selectedRecipes} />
      </Box>
    </DashboardContent>
  );
}
