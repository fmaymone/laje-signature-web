import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeRecipeRecordsView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Receitas - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeRecipeRecordsView />
    </>
  );
}
