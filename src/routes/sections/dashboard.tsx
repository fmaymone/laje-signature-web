import type { RouteObject } from 'react-router';

import { Outlet } from 'react-router';
import { lazy, Suspense } from 'react';

import { CONFIG } from 'src/global-config';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

import { usePathname } from '../hooks';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard'));
const RecipesPage = lazy(() => import('src/pages/dashboard/recipes'));
const RecipeBookPage = lazy(() => import('src/pages/dashboard/recipe-book'));
const RecipeBookNewPage = lazy(() => import('src/pages/dashboard/recipe-book-new'));
const RecipeBookEditPage = lazy(() => import('src/pages/dashboard/recipe-book-edit'));
const RecipeBookPrintPage = lazy(() => import('src/pages/dashboard/recipe-book-print'));
const ServicesPage = lazy(() => import('src/pages/dashboard/services'));
const ServiceNewPage = lazy(() => import('src/pages/dashboard/service-new'));
const ServiceEditPage = lazy(() => import('src/pages/dashboard/service-edit'));
const ServicePrintPage = lazy(() => import('src/pages/dashboard/service-print'));
const CompositionsPage = lazy(() => import('src/pages/dashboard/compositions'));
const CompositionNewPage = lazy(() => import('src/pages/dashboard/composition-new'));
const CompositionEditPage = lazy(() => import('src/pages/dashboard/composition-edit'));
const BlocksPage = lazy(() => import('src/pages/dashboard/blocks'));
const BlockNewPage = lazy(() => import('src/pages/dashboard/block-new'));
const BlockEditPage = lazy(() => import('src/pages/dashboard/block-edit'));
const IngredientsPage = lazy(() => import('src/pages/dashboard/ingredients'));
const LibraryPage = lazy(() => import('src/pages/dashboard/library'));

// ----------------------------------------------------------------------

function SuspenseOutlet() {
  const pathname = usePathname();
  return (
    <Suspense key={pathname} fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  );
}

const dashboardLayout = () => (
  <DashboardLayout>
    <SuspenseOutlet />
  </DashboardLayout>
);

export const dashboardRoutes: RouteObject[] = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? dashboardLayout() : <AuthGuard>{dashboardLayout()}</AuthGuard>,
    children: [
      { index: true, element: <IndexPage /> },
      { path: 'recipes', element: <RecipesPage /> },
      { path: 'recipe-book', element: <RecipeBookPage /> },
      { path: 'recipe-book/new', element: <RecipeBookNewPage /> },
      { path: 'recipe-book/:id/print', element: <RecipeBookPrintPage /> },
      { path: 'recipe-book/:id', element: <RecipeBookEditPage /> },
      { path: 'services', element: <ServicesPage /> },
      { path: 'services/new', element: <ServiceNewPage /> },
      { path: 'services/:id/print', element: <ServicePrintPage /> },
      { path: 'services/:id', element: <ServiceEditPage /> },
      { path: 'compositions', element: <CompositionsPage /> },
      { path: 'compositions/new', element: <CompositionNewPage /> },
      { path: 'compositions/:id', element: <CompositionEditPage /> },
      { path: 'blocks', element: <BlocksPage /> },
      { path: 'blocks/new', element: <BlockNewPage /> },
      { path: 'blocks/:id', element: <BlockEditPage /> },
      { path: 'ingredients', element: <IngredientsPage /> },
      { path: 'library', element: <LibraryPage /> },
    ],
  },
];
