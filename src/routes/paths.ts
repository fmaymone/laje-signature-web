// ----------------------------------------------------------------------

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  page403: '/error/403',
  page404: '/error/404',
  page500: '/error/500',
  auth: {
    jwt: {
      signIn: `${ROOTS.AUTH}/jwt/sign-in`,
      signUp: `${ROOTS.AUTH}/jwt/sign-up`,
    },
  },
  dashboard: {
    root: ROOTS.DASHBOARD,
    recipes: `${ROOTS.DASHBOARD}/recipes`,
    recipeRecords: `${ROOTS.DASHBOARD}/recipe-book`,
    recipeRecordNew: `${ROOTS.DASHBOARD}/recipe-book/new`,
    recipeRecord: (id: string) => `${ROOTS.DASHBOARD}/recipe-book/${id}`,
    services: `${ROOTS.DASHBOARD}/services`,
    serviceNew: `${ROOTS.DASHBOARD}/services/new`,
    service: (id: string) => `${ROOTS.DASHBOARD}/services/${id}`,
    compositions: `${ROOTS.DASHBOARD}/compositions`,
    compositionNew: `${ROOTS.DASHBOARD}/compositions/new`,
    composition: (id: string) => `${ROOTS.DASHBOARD}/compositions/${id}`,
    blocks: `${ROOTS.DASHBOARD}/blocks`,
    blockNew: `${ROOTS.DASHBOARD}/blocks/new`,
    block: (id: string) => `${ROOTS.DASHBOARD}/blocks/${id}`,
    ingredients: `${ROOTS.DASHBOARD}/ingredients`,
    library: `${ROOTS.DASHBOARD}/library`,
  },
};
