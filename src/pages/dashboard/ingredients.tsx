import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeIngredientsView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Ingredientes - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeIngredientsView />
    </>
  );
}
