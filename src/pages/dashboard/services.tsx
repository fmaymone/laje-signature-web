import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeServicesView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Serviços - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeServicesView />
    </>
  );
}
