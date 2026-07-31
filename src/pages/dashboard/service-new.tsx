import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeServiceEditorView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Novo serviço - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeServiceEditorView mode="new" />
    </>
  );
}
