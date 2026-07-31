import type { FlavorBlock } from 'src/types/library';
import type { BlockLinkBulkItem, LinkWeight } from 'src/types/compose-graph';

// ----------------------------------------------------------------------

export type ParsedPairingLine = {
  raw: string;
  query: string;
  weight: LinkWeight;
  note?: string;
};

/** Parse cola estilo Flavor Bible: uma linha por combinação; **negrito** = peso 3. */
export function parseFlavorBibleLines(
  text: string,
  plainWeight: LinkWeight = 2
): ParsedPairingLine[] {
  const lines = text.split(/\r?\n/);
  const result: ParsedPairingLine[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) continue;

    // Markdown bold **x** or __x__
    const boldMatch = trimmed.match(/^\*\*(.+?)\*\*$/) || trimmed.match(/^__(.+?)__$/);
    const weight: LinkWeight = boldMatch ? 3 : plainWeight;
    let body = (boldMatch ? boldMatch[1] : trimmed).trim();

    // Strip trailing parenthetical note: cilantro (garnish)
    let note: string | undefined;
    const noteMatch = body.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (noteMatch) {
      body = noteMatch[1].trim();
      note = noteMatch[2].trim();
    }

    // "beans: black, cranberry" → use head as query (beans)
    const colonIdx = body.indexOf(':');
    if (colonIdx > 0) {
      const head = body.slice(0, colonIdx).trim();
      const variants = body.slice(colonIdx + 1).trim();
      if (variants) note = note ? `${variants}; ${note}` : variants;
      body = head;
    }

    if (!body) continue;
    result.push({ raw: trimmed, query: body, weight, note });
  }

  return result;
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export type ResolvedPairing = {
  query: string;
  weight: LinkWeight;
  notes?: string;
  block: FlavorBlock | null;
};

/** Resolve texto/id para bloco existente (id exato, nome, alias aproximado). */
export function resolvePairingTargets(
  lines: ParsedPairingLine[],
  blocks: FlavorBlock[],
  excludeBlockId: string
): ResolvedPairing[] {
  const candidates = blocks.filter((b) => b.id !== excludeBlockId);

  const byId = new Map(candidates.map((b) => [b.id, b]));
  const byNormName = new Map<string, FlavorBlock>();
  for (const block of candidates) {
    byNormName.set(normalize(block.name), block);
    byNormName.set(normalize(block.id), block);
  }

  return lines.map((line) => {
    const q = line.query.trim();
    const slug = q
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

    let block =
      byId.get(q) ||
      byId.get(slug) ||
      byNormName.get(normalize(q)) ||
      null;

    if (!block) {
      // contains / starts-with soft match on name
      const nq = normalize(q);
      block =
        candidates.find(
          (b) => normalize(b.name) === nq || normalize(b.name).includes(nq) || nq.includes(normalize(b.name))
        ) ?? null;
    }

    return {
      query: line.query,
      weight: line.weight,
      notes: line.note,
      block,
    };
  });
}

export function toBulkItems(resolved: ResolvedPairing[]): BlockLinkBulkItem[] {
  const seen = new Set<string>();
  const items: BlockLinkBulkItem[] = [];
  for (const row of resolved) {
    if (!row.block || seen.has(row.block.id)) continue;
    seen.add(row.block.id);
    items.push({
      target_block_id: row.block.id,
      weight: row.weight,
      notes: row.notes ?? null,
    });
  }
  return items;
}
