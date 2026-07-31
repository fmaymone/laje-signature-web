import type {
  ComposeStage,
  GenerateRecipePayload,
  GenerateRecipeResponse,
} from 'src/types/recipe';

import { CONFIG } from 'src/global-config';
import axios, { endpoints } from 'src/lib/axios';

import { JWT_STORAGE_KEY } from 'src/auth/context/jwt/constant';

// ----------------------------------------------------------------------

export type StreamHandlers = {
  onStage?: (stage: ComposeStage) => void;
  onResult?: (result: GenerateRecipeResponse) => void;
  onError?: (message: string) => void;
};

function authHeaders(): HeadersInit {
  const token = localStorage.getItem(JWT_STORAGE_KEY) || sessionStorage.getItem(JWT_STORAGE_KEY);
  const headers: HeadersInit = { 'Content-Type': 'application/json', Accept: 'text/event-stream' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

function parseSseChunk(
  buffer: string,
  handlers: StreamHandlers
): string {
  const parts = buffer.split('\n\n');
  const rest = parts.pop() ?? '';

  for (const part of parts) {
    const lines = part.split('\n');
    let eventType = 'message';
    const dataLines: string[] = [];

    for (const line of lines) {
      if (line.startsWith('event:')) {
        eventType = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        dataLines.push(line.slice(5).trim());
      }
    }

    if (!dataLines.length) continue;

    try {
      const payload = JSON.parse(dataLines.join('\n'));
      if (eventType === 'stage') {
        handlers.onStage?.(payload as ComposeStage);
      } else if (eventType === 'result') {
        handlers.onResult?.(payload as GenerateRecipeResponse);
      } else if (eventType === 'error') {
        handlers.onError?.(String(payload.message ?? 'Erro no agente'));
      }
    } catch {
      // ignore malformed chunk
    }
  }

  return rest;
}

/** Gera receita via SSE (estágios do grafo + resultado final). */
export async function generateRecipeStream(
  payload: GenerateRecipePayload,
  handlers: StreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const url = `${CONFIG.serverUrl}${endpoints.recipes.generateStream}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
    signal,
  });

  if (!res.ok) {
    let message = `Falha ao gerar receita (${res.status})`;
    try {
      const err = await res.json();
      message = String(err.detail ?? err.message ?? message);
    } catch {
      // keep default
    }
    handlers.onError?.(message);
    return;
  }

  if (!res.body) {
    handlers.onError?.('Resposta sem corpo (stream indisponível)');
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    buffer = parseSseChunk(buffer, handlers);
  }

  if (buffer.trim()) {
    parseSseChunk(`${buffer}\n\n`, handlers);
  }
}

/** Fallback sem stream (espera a receita completa). */
export async function generateRecipe(
  payload: GenerateRecipePayload
): Promise<GenerateRecipeResponse> {
  const res = await axios.post(endpoints.recipes.generate, payload);
  return res.data as GenerateRecipeResponse;
}
