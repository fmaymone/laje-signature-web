import type {
  KitchenLayout,
  KitchenLayoutCreate,
  KitchenLayoutListResponse,
  KitchenLayoutUpdate,
} from 'src/types/kitchen-layout';

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

// ----------------------------------------------------------------------

export function useGetKitchenLayouts() {
  const url = endpoints.kitchenLayouts.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR<KitchenLayoutListResponse>(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      layouts: data?.items ?? [],
      layoutsTotal: data?.total ?? 0,
      layoutsLoading: isLoading,
      layoutsError: error,
      layoutsValidating: isValidating,
      layoutsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
      mutateLayouts: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetKitchenLayout(layoutId: string | null) {
  const url = layoutId ? endpoints.kitchenLayouts.detail(layoutId) : null;

  const { data, isLoading, error, mutate } = useSWR<KitchenLayout>(url, fetcher, {
    ...swrOptions,
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      layout: data,
      layoutLoading: isLoading,
      layoutError: error,
      mutateLayout: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function refreshKitchenLayouts() {
  await globalMutate(endpoints.kitchenLayouts.list);
}

export async function createKitchenLayout(
  payload: KitchenLayoutCreate = {}
): Promise<KitchenLayout> {
  const res = await axios.post(endpoints.kitchenLayouts.list, {
    name: payload.name ?? 'Cozinha',
    notes: payload.notes ?? null,
    canvas: payload.canvas ?? { width: 1200, height: 800, grid: 20 },
    stations: payload.stations ?? [],
  });
  await refreshKitchenLayouts();
  return res.data as KitchenLayout;
}

export async function updateKitchenLayout(
  layoutId: string,
  payload: KitchenLayoutUpdate
): Promise<KitchenLayout> {
  const res = await axios.put(endpoints.kitchenLayouts.detail(layoutId), payload);
  await Promise.all([
    refreshKitchenLayouts(),
    globalMutate(endpoints.kitchenLayouts.detail(layoutId), res.data, { revalidate: false }),
  ]);
  return res.data as KitchenLayout;
}

export async function deleteKitchenLayout(layoutId: string): Promise<void> {
  await axios.delete(endpoints.kitchenLayouts.detail(layoutId));
  await Promise.all([
    refreshKitchenLayouts(),
    globalMutate(endpoints.kitchenLayouts.detail(layoutId), undefined, { revalidate: false }),
  ]);
}
