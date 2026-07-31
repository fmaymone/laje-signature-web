import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeBlockEditorView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Novo bloco - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeBlockEditorView mode="new" />
    </>
  );
}
