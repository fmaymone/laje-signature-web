import type { AxiosRequestConfig } from 'axios';

import axios from 'axios';

import { CONFIG } from 'src/global-config';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });

axiosInstance.interceptors.request.use((config) => {
  const headers = config.headers ?? {};
  const hasAuth =
    typeof headers.Authorization === 'string'
      ? headers.Authorization.length > 0
      : Boolean(headers.Authorization);

  if (!hasAuth) {
    const token =
      localStorage.getItem(JWT_STORAGE_KEY) || sessionStorage.getItem(JWT_STORAGE_KEY);
    if (token) {
      headers.Authorization = `Bearer ${token}`;
      config.headers = headers;
    }
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong!')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/api/chat',
  kanban: '/api/kanban',
  calendar: '/api/calendar',
  auth: { me: '/api/auth/me', signIn: '/api/auth/sign-in', signUp: '/api/auth/sign-up' },
  library: {
    summary: '/v1/library/summary',
    flavorBlocks: '/v1/library/flavor_blocks',
    collection: (name: string) => `/v1/library/${name}`,
  },
  recipes: {
    parse: '/v1/chat/parse',
    generate: '/v1/recipes/generate',
    generateStream: '/v1/recipes/generate/stream',
    composePreview: '/v1/compose/preview',
  },
  recipeRecords: {
    list: '/v1/recipes',
    detail: (id: string) => `/v1/recipes/${id}`,
  },
  ingredients: {
    list: '/v1/ingredients',
    detail: (id: string) => `/v1/ingredients/${id}`,
    stock: (id: string) => `/v1/ingredients/${id}/stock`,
    seed: '/v1/ingredients/seed',
  },
  services: {
    list: '/v1/services',
    detail: (id: string) => `/v1/services/${id}`,
  },
  compose: {
    graphs: '/v1/compose/graphs',
    graph: (id: string) => `/v1/compose/graphs/${id}`,
  },
  blocks: {
    list: '/v1/blocks',
    detail: (id: string) => `/v1/blocks/${id}`,
  },
  blockLinks: {
    list: '/v1/block-links',
    detail: (id: string) => `/v1/block-links/${id}`,
    bulk: '/v1/block-links/bulk',
  },
  mail: { list: '/api/mail/list', details: '/api/mail/details', labels: '/api/mail/labels' },
  post: {
    list: '/api/post/list',
    details: '/api/post/details',
    latest: '/api/post/latest',
    search: '/api/post/search',
  },
  product: {
    list: '/api/product/list',
    details: '/api/product/details',
    search: '/api/product/search',
  },
};
