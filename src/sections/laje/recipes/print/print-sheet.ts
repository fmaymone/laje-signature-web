export type RecipePrintMode =
  | 'portrait'
  | 'landscape'
  | 'mise'
  | 'shopping-missing'
  | 'by-recipe';

const STYLE_ID = 'laje-recipe-print-page';
const BODY_CLASS_PORTRAIT = 'recipe-print-mode-portrait';
const BODY_CLASS_LANDSCAPE = 'recipe-print-mode-landscape';
const BODY_CLASS_MISE = 'recipe-print-mode-mise';
const BODY_CLASS_SHOPPING_MISSING = 'recipe-print-mode-shopping-missing';
const BODY_CLASS_BY_RECIPE = 'recipe-print-mode-by-recipe';

const BODY_CLASSES = [
  BODY_CLASS_PORTRAIT,
  BODY_CLASS_LANDSCAPE,
  BODY_CLASS_MISE,
  BODY_CLASS_SHOPPING_MISSING,
  BODY_CLASS_BY_RECIPE,
] as const;

function cleanupPrintMode() {
  document.body.classList.remove(...BODY_CLASSES);
  document.getElementById(STYLE_ID)?.remove();
}

function bodyClass(mode: RecipePrintMode) {
  if (mode === 'landscape') return BODY_CLASS_LANDSCAPE;
  if (mode === 'mise') return BODY_CLASS_MISE;
  if (mode === 'shopping-missing') return BODY_CLASS_SHOPPING_MISSING;
  if (mode === 'by-recipe') return BODY_CLASS_BY_RECIPE;
  return BODY_CLASS_PORTRAIT;
}

/** Imprime uma folha A4 (retrato, paisagem, mise, compras faltando ou por receitas). */
export function printRecipeSheet(mode: RecipePrintMode) {
  cleanupPrintMode();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    mode === 'landscape'
      ? '@page { size: A4 landscape; margin: 8mm; }'
      : '@page { size: A4 portrait; margin: 10mm; }';
  document.head.appendChild(style);

  document.body.classList.add(bodyClass(mode));

  const onAfterPrint = () => {
    cleanupPrintMode();
    window.removeEventListener('afterprint', onAfterPrint);
  };
  window.addEventListener('afterprint', onAfterPrint);

  window.print();
}
