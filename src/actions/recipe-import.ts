import type { RecipeImageImportResponse } from 'src/types/recipe-import';

import axios, { endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

export async function importRecipeFromImage(file: File): Promise<RecipeImageImportResponse> {
  const form = new FormData();
  form.append('file', file);

  const res = await axios.post(endpoints.recipeRecords.importFromImage, form);

  return res.data as RecipeImageImportResponse;
}

export async function generateRecipeFromText(
  prompt: string
): Promise<RecipeImageImportResponse> {
  const res = await axios.post(endpoints.recipeRecords.generateFromText, { prompt });
  return res.data as RecipeImageImportResponse;
}
