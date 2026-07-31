import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeCompositionsView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Composições - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeCompositionsView />
    </>
  );
}
