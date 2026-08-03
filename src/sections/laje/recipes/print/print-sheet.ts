export type RecipePrintMode = 'portrait' | 'landscape';

const STYLE_ID = 'laje-recipe-print-page';
const BODY_CLASS_PORTRAIT = 'recipe-print-mode-portrait';
const BODY_CLASS_LANDSCAPE = 'recipe-print-mode-landscape';

function cleanupPrintMode() {
  document.body.classList.remove(BODY_CLASS_PORTRAIT, BODY_CLASS_LANDSCAPE);
  document.getElementById(STYLE_ID)?.remove();
}

/** Imprime uma folha A4 (retrato ou paisagem). */
export function printRecipeSheet(mode: RecipePrintMode) {
  cleanupPrintMode();

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent =
    mode === 'landscape'
      ? '@page { size: A4 landscape; margin: 8mm; }'
      : '@page { size: A4 portrait; margin: 10mm; }';
  document.head.appendChild(style);

  document.body.classList.add(
    mode === 'landscape' ? BODY_CLASS_LANDSCAPE : BODY_CLASS_PORTRAIT
  );

  const onAfterPrint = () => {
    cleanupPrintMode();
    window.removeEventListener('afterprint', onAfterPrint);
  };
  window.addEventListener('afterprint', onAfterPrint);

  // Fallback se afterprint não disparar (alguns browsers).
  window.setTimeout(() => {
    if (
      document.body.classList.contains(BODY_CLASS_PORTRAIT) ||
      document.body.classList.contains(BODY_CLASS_LANDSCAPE)
    ) {
      // ainda em modo print — afterprint provavelmente virá; não limpa cedo demais
    }
  }, 0);

  window.print();
}
