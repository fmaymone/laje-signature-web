import type {
  FlavorBlock,
  FlavorBlockListResponse,
  FlavorBlockWrite,
  SensoryProfile,
} from 'src/types/library';

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

export const EMPTY_SENSORY: SensoryProfile = {
  acidity: 0,
  saltiness: 0,
  sweetness: 0,
  bitterness: 0,
  umami: 0,
  fat: 0,
  heat: 0,
  aroma: 0,
  freshness: 0,
};

// ----------------------------------------------------------------------

export function useGetBlocks(params?: { q?: string; family?: string; origin?: string }) {
  const search = new URLSearchParams();
  if (params?.q) search.set('q', params.q);
  if (params?.family) search.set('family', params.family);
  if (params?.origin) search.set('origin', params.origin);
  const qs = search.toString();
  const url = qs ? `${endpoints.blocks.list}?${qs}` : endpoints.blocks.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR<FlavorBlockListResponse>(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      blocks: data?.items ?? [],
      blocksTotal: data?.total ?? 0,
      blocksLoading: isLoading,
      blocksError: error,
      blocksValidating: isValidating,
      blocksEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
      mutateBlocks: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetBlock(blockId: string | null) {
  const url = blockId ? endpoints.blocks.detail(blockId) : null;
  const { data, isLoading, error, mutate } = useSWR<FlavorBlock>(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      block: data,
      blockLoading: isLoading,
      blockError: error,
      mutateBlock: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

async function refreshBlocksCaches(blockId?: string) {
  await globalMutate(
    (key) => typeof key === 'string' && key.startsWith(endpoints.blocks.list),
    undefined,
    { revalidate: true }
  );
  await globalMutate(endpoints.library.flavorBlocks);
  if (blockId) {
    await globalMutate(endpoints.blocks.detail(blockId));
  }
}

export async function createBlock(payload: FlavorBlockWrite): Promise<FlavorBlock> {
  const res = await axios.post(endpoints.blocks.list, payload);
  await refreshBlocksCaches(payload.id);
  return res.data as FlavorBlock;
}

export async function updateBlock(
  blockId: string,
  payload: Partial<FlavorBlockWrite>
): Promise<FlavorBlock> {
  const res = await axios.put(endpoints.blocks.detail(blockId), payload);
  await refreshBlocksCaches(blockId);
  return res.data as FlavorBlock;
}

export async function deleteBlock(blockId: string): Promise<void> {
  await axios.delete(endpoints.blocks.detail(blockId));
  await refreshBlocksCaches(blockId);
}
