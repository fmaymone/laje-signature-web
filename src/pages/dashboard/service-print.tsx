import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeServicePrintView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Plano do serviço - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeServicePrintView />
    </>
  );
}
