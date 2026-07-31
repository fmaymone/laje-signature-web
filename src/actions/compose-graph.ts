import type {
  CompositionGraph,
  CompositionGraphCreate,
  CompositionGraphListResponse,
  CompositionGraphUpdate,
} from 'src/types/compose-graph';

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

export function useGetCompositionGraphs() {
  const url = endpoints.compose.graphs;

  const { data, isLoading, error, isValidating, mutate } = useSWR<CompositionGraphListResponse>(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      graphs: data?.items ?? [],
      graphsTotal: data?.total ?? 0,
      graphsLoading: isLoading,
      graphsError: error,
      graphsValidating: isValidating,
      graphsEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
      mutateGraphs: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetCompositionGraph(graphId: string | null) {
  const url = graphId ? endpoints.compose.graph(graphId) : null;

  const { data, isLoading, error, mutate } = useSWR<CompositionGraph>(url, fetcher, {
    ...swrOptions,
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      graph: data,
      graphLoading: isLoading,
      graphError: error,
      mutateGraph: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

export async function refreshCompositionGraphs() {
  await globalMutate(endpoints.compose.graphs);
}

export async function createCompositionGraph(
  payload: CompositionGraphCreate = {}
): Promise<CompositionGraph> {
  const res = await axios.post(endpoints.compose.graphs, {
    title: payload.title ?? 'Composição',
    notes: payload.notes ?? null,
    nodes: payload.nodes ?? [],
    edges: payload.edges ?? [],
  });
  await refreshCompositionGraphs();
  return res.data as CompositionGraph;
}

export async function updateCompositionGraph(
  graphId: string,
  payload: CompositionGraphUpdate
): Promise<CompositionGraph> {
  const res = await axios.put(endpoints.compose.graph(graphId), payload);
  await Promise.all([
    refreshCompositionGraphs(),
    globalMutate(endpoints.compose.graph(graphId), res.data, { revalidate: false }),
  ]);
  return res.data as CompositionGraph;
}

export async function deleteCompositionGraph(graphId: string): Promise<void> {
  await axios.delete(endpoints.compose.graph(graphId));
  await Promise.all([
    refreshCompositionGraphs(),
    globalMutate(endpoints.compose.graph(graphId), undefined, { revalidate: false }),
  ]);
}
