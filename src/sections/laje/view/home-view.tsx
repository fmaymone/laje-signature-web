import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function LajeHomeView() {
  const { user } = useAuthContext();
  const name = user?.displayName || user?.email || 'chef';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Início"
        links={[{ name: 'Atelier', href: paths.dashboard.root }, { name: 'Início' }]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <Box>
          <Typography variant="h3" sx={{ mb: 1 }}>
            Olá, {name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Atelier Laje Signature — composição de pratos nordestinos com identidade e técnica.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Iconify icon="solar:chef-hat-bold-duotone" width={36} sx={{ mb: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Receitas assinatura
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Organize e revise pratos compostos pelo motor Laje.
              </Typography>
              <Button
                component={RouterLink}
                href={paths.dashboard.recipes}
                variant="contained"
                color="primary"
              >
                Ver receitas
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Iconify icon="solar:notebook-bold-duotone" width={36} sx={{ mb: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Biblioteca de sabor
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ingredientes, blocos e regras da cozinha nordestina.
              </Typography>
              <Button
                component={RouterLink}
                href={paths.dashboard.library}
                variant="outlined"
                color="inherit"
              >
                Abrir biblioteca
              </Button>
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Iconify icon="solar:magic-stick-3-bold-duotone" width={36} sx={{ mb: 1, color: 'primary.main' }} />
              <Typography variant="h6" sx={{ mb: 1 }}>
                Compor prato
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Em breve: pedido → blocos → receita executável.
              </Typography>
              <Button variant="soft" color="primary" disabled>
                Em breve
              </Button>
            </CardContent>
          </Card>
        </Stack>
      </Stack>
    </DashboardContent>
  );
}
