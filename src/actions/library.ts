import type { SWRConfiguration } from 'swr';
import type { FlavorBlock, LibrarySummary } from 'src/types/library';

import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/lib/axios';

// ----------------------------------------------------------------------

const swrOptions: SWRConfiguration = {
  revalidateIfStale: false,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
};

// ----------------------------------------------------------------------

export function useGetFlavorBlocks() {
  const url = endpoints.library.flavorBlocks;

  const { data, isLoading, error, isValidating } = useSWR<FlavorBlock[]>(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      blocks: data ?? [],
      blocksLoading: isLoading,
      blocksError: error,
      blocksValidating: isValidating,
      blocksEmpty: !isLoading && !isValidating && !(data?.length ?? 0),
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetLibrarySummary() {
  const url = endpoints.library.summary;

  const { data, isLoading, error } = useSWR<LibrarySummary>(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      summary: data,
      summaryLoading: isLoading,
      summaryError: error,
    }),
    [data, error, isLoading]
  );
}
