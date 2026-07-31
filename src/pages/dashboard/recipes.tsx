import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeRecipesView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Compor - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeRecipesView />
    </>
  );
}
