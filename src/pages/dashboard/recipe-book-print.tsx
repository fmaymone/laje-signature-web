import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeRecipePrintView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Ficha técnica - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeRecipePrintView />
    </>
  );
}
