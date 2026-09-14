import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeKitchenEditorView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Editar planta - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeKitchenEditorView mode="edit" />
    </>
  );
}
