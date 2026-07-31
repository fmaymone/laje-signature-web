import type {
  RecipeRecord,
  RecipeRecordCreate,
  RecipeRecordListResponse,
  RecipeRecordUpdate,
} from 'src/types/recipe-record';

import type { SWRConfiguration } from 'swr';
import useSWR, { mutate as globalMutate } from 'swr';
import { useMemo, startTransition } from 'react';

import axios, { endpoints, fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

// ----------------------------------------------------------------------

export function useGetRecipeRecords() {
  const url = endpoints.recipeRecords.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR<RecipeRecordListResponse>(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      recipes: data?.items ?? [],
      recipesTotal: data?.total ?? 0,
      recipesLoading: isLoading,
      recipesError: error,
      recipesValidating: isValidating,
      recipesEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
      mutateRecipes: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetRecipeRecord(recipeId: string | null) {
  const url = recipeId ? endpoints.recipeRecords.detail(recipeId) : null;

  const { data, isLoading, error, mutate } = useSWR<RecipeRecord>(url, fetcher, {
    ...swrOptions,
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      recipe: data,
      recipeLoading: isLoading,
      recipeError: error,
      mutateRecipe: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

function patchListCache(recipe: RecipeRecord) {
  return globalMutate(
    endpoints.recipeRecords.list,
    (current: RecipeRecordListResponse | undefined) => {
      if (!current) {
        return { items: [recipe], total: 1 };
      }
      const idx = current.items.findIndex((item) => item.id === recipe.id);
      if (idx === -1) {
        return { items: [recipe, ...current.items], total: current.total + 1 };
      }
      const items = [...current.items];
      items[idx] = recipe;
      return { ...current, items };
    },
    { revalidate: false }
  );
}

async function refreshRecipeCaches(recipeId?: string) {
  await globalMutate(endpoints.recipeRecords.list);
  if (recipeId) {
    await globalMutate(endpoints.recipeRecords.detail(recipeId));
  }
}

export async function createRecipeRecord(
  payload: RecipeRecordCreate = {}
): Promise<RecipeRecord> {
  const res = await axios.post(endpoints.recipeRecords.list, {
    title: payload.title ?? 'Receita',
    notes: payload.notes ?? null,
    composition_id: payload.composition_id ?? null,
    servings: payload.servings ?? 4,
    block_ids: payload.block_ids ?? [],
    ingredients: payload.ingredients ?? [],
    lanes: payload.lanes ?? [{ id: 'main', name: 'Principal' }],
    steps: payload.steps ?? [],
  });
  const recipe = res.data as RecipeRecord;
  startTransition(() => {
    void globalMutate(endpoints.recipeRecords.detail(recipe.id), recipe, { revalidate: false });
    void patchListCache(recipe);
  });
  return recipe;
}

export async function updateRecipeRecord(
  recipeId: string,
  payload: RecipeRecordUpdate,
  options?: { previous?: RecipeRecord | null }
): Promise<RecipeRecord> {
  const previous = options?.previous ?? null;
  if (previous) {
    const optimistic: RecipeRecord = {
      ...previous,
      ...payload,
      id: recipeId,
      title: payload.title ?? previous.title,
      notes: payload.notes !== undefined ? payload.notes : previous.notes,
      composition_id:
        payload.composition_id !== undefined ? payload.composition_id : previous.composition_id,
      servings: payload.servings ?? previous.servings,
      block_ids: payload.block_ids ?? previous.block_ids,
      ingredients: payload.ingredients ?? previous.ingredients,
      lanes: payload.lanes ?? previous.lanes,
      steps: payload.steps ?? previous.steps,
      updated_at: new Date().toISOString(),
    };
    await globalMutate(endpoints.recipeRecords.detail(recipeId), optimistic, {
      revalidate: false,
    });
    await patchListCache(optimistic);
  }

  try {
    const res = await axios.put(endpoints.recipeRecords.detail(recipeId), payload);
    const recipe = res.data as RecipeRecord;
    startTransition(() => {
      void globalMutate(endpoints.recipeRecords.detail(recipeId), recipe, { revalidate: false });
      void patchListCache(recipe);
    });
    return recipe;
  } catch (err) {
    if (previous) {
      await globalMutate(endpoints.recipeRecords.detail(recipeId), previous, {
        revalidate: false,
      });
      await patchListCache(previous);
    }
    throw err;
  }
}

export async function deleteRecipeRecord(recipeId: string): Promise<void> {
  await axios.delete(endpoints.recipeRecords.detail(recipeId));
  await refreshRecipeCaches(recipeId);
}
