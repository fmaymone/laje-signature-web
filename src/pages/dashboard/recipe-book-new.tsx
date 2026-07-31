import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/global-config';

import { LajeRecipeEditorView } from 'src/sections/laje/view';

// ----------------------------------------------------------------------

const metadata = { title: `Nova receita - ${CONFIG.appName}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <LajeRecipeEditorView mode="new" />
    </>
  );
}
