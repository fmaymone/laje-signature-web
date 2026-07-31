import type {
  Ingredient,
  IngredientCreate,
  IngredientListResponse,
  IngredientStockPatch,
} from 'src/types/ingredient';

import type { SWRConfiguration } from 'swr';
import useSWR, { mutate as globalMutate } from 'swr';
import { useMemo } from 'react';

import axios, { endpoints, fetcher } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: true,
  revalidateOnFocus: true,
  revalidateOnReconnect: true,
};

export function useGetIngredients(params?: { q?: string; status?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.status) search.set('status', params.status);
  const qs = search.toString();
  const url = qs ? `${endpoints.ingredients.list}?${qs}` : endpoints.ingredients.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR<IngredientListResponse>(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      ingredients: data?.items ?? [],
      ingredientsTotal: data?.total ?? 0,
      ingredientsLoading: isLoading,
      ingredientsError: error,
      ingredientsValidating: isValidating,
      mutateIngredients: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

async function refreshIngredientCaches() {
  await globalMutate(
    (key) => typeof key === 'string' && key.startsWith(endpoints.ingredients.list),
    undefined,
    { revalidate: true }
  );
}

export async function seedIngredients() {
  const res = await axios.post(endpoints.ingredients.seed);
  await refreshIngredientCaches();
  return res.data as { created: number; skipped: number; total: number };
}

export async function createIngredient(payload: IngredientCreate): Promise<Ingredient> {
  const res = await axios.post(endpoints.ingredients.list, payload);
  await refreshIngredientCaches();
  return res.data as Ingredient;
}

export async function updateIngredientStock(
  ingredientId: string,
  payload: IngredientStockPatch
): Promise<Ingredient> {
  const res = await axios.put(endpoints.ingredients.stock(ingredientId), payload);
  await refreshIngredientCaches();
  return res.data as Ingredient;
}
