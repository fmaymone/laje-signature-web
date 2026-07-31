import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeCompositionEditorView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Editar composição - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeCompositionEditorView mode="edit" />
    </>
  );
}
