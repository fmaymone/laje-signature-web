import type {
  ServiceRecord,
  ServiceRecordCreate,
  ServiceRecordListResponse,
  ServiceRecordUpdate,
} from 'src/types/service-record';

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

export function useGetServiceRecords() {
  const url = endpoints.services.list;

  const { data, isLoading, error, isValidating, mutate } = useSWR<ServiceRecordListResponse>(
    url,
    fetcher,
    swrOptions
  );

  return useMemo(
    () => ({
      services: data?.items ?? [],
      servicesTotal: data?.total ?? 0,
      servicesLoading: isLoading,
      servicesError: error,
      servicesValidating: isValidating,
      servicesEmpty: !isLoading && !isValidating && !(data?.items?.length ?? 0),
      mutateServices: mutate,
    }),
    [data, error, isLoading, isValidating, mutate]
  );
}

export function useGetServiceRecord(serviceId: string | null) {
  const url = serviceId ? endpoints.services.detail(serviceId) : null;

  const { data, isLoading, error, mutate } = useSWR<ServiceRecord>(url, fetcher, {
    ...swrOptions,
    revalidateOnFocus: false,
  });

  return useMemo(
    () => ({
      service: data,
      serviceLoading: isLoading,
      serviceError: error,
      mutateService: mutate,
    }),
    [data, error, isLoading, mutate]
  );
}

async function refreshServiceCaches(serviceId?: string) {
  await globalMutate(endpoints.services.list);
  if (serviceId) {
    await globalMutate(endpoints.services.detail(serviceId));
  }
}

export async function createServiceRecord(
  payload: ServiceRecordCreate
): Promise<ServiceRecord> {
  const res = await axios.post(endpoints.services.list, {
    name: payload.name ?? 'Serviço',
    notes: payload.notes ?? null,
    service_date: payload.service_date,
    recipe_ids: payload.recipe_ids ?? [],
  });
  await refreshServiceCaches(res.data?.id);
  return res.data as ServiceRecord;
}

export async function updateServiceRecord(
  serviceId: string,
  payload: ServiceRecordUpdate
): Promise<ServiceRecord> {
  const res = await axios.put(endpoints.services.detail(serviceId), payload);
  await refreshServiceCaches(serviceId);
  return res.data as ServiceRecord;
}

export async function deleteServiceRecord(serviceId: string): Promise<void> {
  await axios.delete(endpoints.services.detail(serviceId));
  await refreshServiceCaches(serviceId);
}
