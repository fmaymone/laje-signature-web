import type {
  BlockLink,
  BlockLinkBulkCreate,
  BlockLinkBulkResult,
  BlockLinkCreate,
  BlockLinkListResponse,
  BlockLinkUpdate,
  LinkWeight,
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

export const LINK_WEIGHT_LABEL: Record<LinkWeight, string> = {
  1: 'Leve',
  2: 'Média',
  3: 'Forte',
};

// ----------------------------------------------------------------------

export function useGetBlockLinks(blockId?: string | null) {
  const url = blockId
    ? `${endpoints.blockLinks.list}?block_id=${encodeURIComponent(blockId)}`
    : endpoints.blockLinks.list;

  const { data, isLoading, error, mutate } = useSWR<BlockLinkListResponse>(url, fetcher, swrOptions);

  return useMemo(
    () => ({
      links: data?.items ?? [],
      linksTotal: data?.total ?? 0,
      linksLoading: isLoading,
      linksError: error,
      mutateLinks: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

async function refreshLinks(blockId?: string) {
  await globalMutate(endpoints.blockLinks.list);
  if (blockId) {
    await globalMutate(
      `${endpoints.blockLinks.list}?block_id=${encodeURIComponent(blockId)}`
    );
  }
}

export async function createBlockLink(payload: BlockLinkCreate): Promise<BlockLink> {
  const res = await axios.post(endpoints.blockLinks.list, {
    weight: 2,
    ...payload,
  });
  await refreshLinks(payload.source_block_id);
  await refreshLinks(payload.target_block_id);
  return res.data as BlockLink;
}

export async function bulkUpsertBlockLinks(
  payload: BlockLinkBulkCreate
): Promise<BlockLinkBulkResult> {
  const res = await axios.post(endpoints.blockLinks.bulk, payload);
  await refreshLinks(payload.source_block_id);
  for (const item of payload.links) {
    await refreshLinks(item.target_block_id);
  }
  return res.data as BlockLinkBulkResult;
}

export async function updateBlockLink(
  linkId: string,
  payload: BlockLinkUpdate
): Promise<BlockLink> {
  const res = await axios.put(endpoints.blockLinks.detail(linkId), payload);
  const link = res.data as BlockLink;
  await refreshLinks(link.source_block_id);
  await refreshLinks(link.target_block_id);
  return link;
}

export async function deleteBlockLink(
  linkId: string,
  relatedBlockIds: string[] = []
): Promise<void> {
  await axios.delete(endpoints.blockLinks.detail(linkId));
  await refreshLinks();
  await Promise.all(relatedBlockIds.map((id) => refreshLinks(id)));
}
