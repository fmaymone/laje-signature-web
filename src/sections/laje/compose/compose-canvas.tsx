import type { FlavorBlock } from 'src/types/library';
import type {
  CompositionGraph,
  CompositionGraphEdge,
  CompositionGraphNode,
  HandleSide,
  LinkWeight,
} from 'src/types/compose-graph';
import type {
  Connection,
  Edge,
  OnConnect,
  OnEdgesChange,
  OnNodesChange,
} from '@xyflow/react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  ConnectionMode,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  createCompositionGraph,
  updateCompositionGraph,
  useGetCompositionGraph,
} from 'src/actions/compose-graph';
import { useGetFlavorBlocks } from 'src/actions/library';

import { Iconify } from 'src/components/iconify';
import { toast } from 'src/components/snackbar';

import { BlockPalette } from './block-palette';
import { FlavorBlockNode, type FlavorBlockFlowNode } from './flavor-block-node';
import { WeightedEdge, type WeightedFlowEdge } from './weighted-edge';

// ----------------------------------------------------------------------

const nodeTypes = { flavorBlock: FlavorBlockNode };
const edgeTypes = { weighted: WeightedEdge };

const HANDLE_SIDES = new Set<HandleSide>(['top', 'right', 'bottom', 'left']);

function asHandle(value: string | null | undefined): HandleSide | null {
  if (!value) return null;
  return HANDLE_SIDES.has(value as HandleSide) ? (value as HandleSide) : null;
}

function asWeight(value: unknown): LinkWeight {
  if (value === 1 || value === 2 || value === 3) return value;
  return 2;
}

function nextWeight(weight: LinkWeight): LinkWeight {
  if (weight === 1) return 2;
  if (weight === 2) return 3;
  return 1;
}

function toFlowNodes(
  graphNodes: CompositionGraphNode[],
  blocksById: Map<string, FlavorBlock>
): FlavorBlockFlowNode[] {
  return graphNodes
    .map((n) => {
      const block = blocksById.get(n.block_id);
      if (!block) return null;
      return {
        id: n.id,
        type: 'flavorBlock' as const,
        position: n.position,
        data: { block },
      };
    })
    .filter(Boolean) as FlavorBlockFlowNode[];
}

function toFlowEdges(graphEdges: CompositionGraphEdge[]): WeightedFlowEdge[] {
  return graphEdges.map((e) => {
    const weight = asWeight(e.weight);
    return {
      id: e.id,
      type: 'weighted',
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle ?? undefined,
      targetHandle: e.targetHandle ?? undefined,
      data: { weight },
    };
  });
}

function fromFlowNodes(nodes: FlavorBlockFlowNode[]): CompositionGraphNode[] {
  return nodes.map((n) => ({
    id: n.id,
    block_id: n.data.block.id,
    position: { x: n.position.x, y: n.position.y },
  }));
}

function fromFlowEdges(edges: Edge[]): CompositionGraphEdge[] {
  return edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: asHandle(e.sourceHandle),
    targetHandle: asHandle(e.targetHandle),
    weight: asWeight((e.data as { weight?: LinkWeight } | undefined)?.weight),
  }));
}

function nextPosition(count: number): { x: number; y: number } {
  const col = count % 3;
  const row = Math.floor(count / 3);
  return { x: 80 + col * 280, y: 80 + row * 200 };
}

function errorMessage(err: unknown, fallback: string) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'detail' in err) {
    return String((err as { detail: unknown }).detail);
  }
  if (err instanceof Error) return err.message;
  return fallback;
}

// ----------------------------------------------------------------------

type CanvasInnerProps = {
  graphId?: string | null;
  initialTitle?: string;
  onCreated?: (graph: CompositionGraph) => void;
  onSaved?: (graph: CompositionGraph) => void;
};

function ComposeCanvasInner({
  graphId: graphIdProp = null,
  initialTitle = 'Nova composição',
  onCreated,
  onSaved,
}: CanvasInnerProps) {
  const { blocks, blocksLoading } = useGetFlavorBlocks();
  const { graph, graphLoading, graphError, mutateGraph } = useGetCompositionGraph(graphIdProp);

  const blocksById = useMemo(() => new Map(blocks.map((b) => [b.id, b])), [blocks]);

  const [graphId, setGraphId] = useState<string | null>(graphIdProp);
  const [title, setTitle] = useState(initialTitle);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [hydrated, setHydrated] = useState(!graphIdProp);
  const [defaultWeight, setDefaultWeight] = useState<LinkWeight>(2);

  const [nodes, setNodes, onNodesChangeBase] = useNodesState<FlavorBlockFlowNode>([]);
  const [edges, setEdges, onEdgesChangeBase] = useEdgesState<WeightedFlowEdge>([]);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedIdRef = useRef<string | null>(null);

  const markDirty = useCallback(() => setDirty(true), []);

  useEffect(() => {
    setGraphId(graphIdProp);
    if (!graphIdProp) {
      setTitle(initialTitle);
      setNodes([]);
      setEdges([]);
      setDirty(false);
      setHydrated(true);
      loadedIdRef.current = null;
    }
  }, [graphIdProp, initialTitle, setEdges, setNodes]);

  useEffect(() => {
    if (!graph || !blocks.length) return;
    if (loadedIdRef.current === graph.id) return;

    loadedIdRef.current = graph.id;
    setGraphId(graph.id);
    setTitle(graph.title);
    setNodes(toFlowNodes(graph.nodes, blocksById));
    setEdges(toFlowEdges(graph.edges));
    setDirty(false);
    setHydrated(true);
  }, [blocks.length, blocksById, graph, setEdges, setNodes]);

  const onNodesChange: OnNodesChange<FlavorBlockFlowNode> = useCallback(
    (changes) => {
      onNodesChangeBase(changes);
      if (changes.some((c) => c.type === 'position' || c.type === 'remove' || c.type === 'add')) {
        markDirty();
      }
    },
    [markDirty, onNodesChangeBase]
  );

  const onEdgesChange: OnEdgesChange<WeightedFlowEdge> = useCallback(
    (changes) => {
      onEdgesChangeBase(changes);
      if (changes.some((c) => c.type === 'remove' || c.type === 'add')) {
        markDirty();
      }
    },
    [markDirty, onEdgesChangeBase]
  );

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: crypto.randomUUID(),
            type: 'weighted',
            data: { weight: defaultWeight },
          },
          eds
        )
      );
      markDirty();
    },
    [defaultWeight, markDirty, setEdges]
  );

  const onEdgeClick = useCallback(
    (_event: React.MouseEvent, edge: WeightedFlowEdge) => {
      const current = asWeight(edge.data?.weight);
      const weight = nextWeight(current);
      setEdges((eds) =>
        eds.map((item) =>
          item.id === edge.id ? { ...item, data: { ...item.data, weight } } : item
        )
      );
      markDirty();
    },
    [markDirty, setEdges]
  );

  const placedBlockIds = useMemo(
    () => new Set(nodes.map((n) => n.data.block.id)),
    [nodes]
  );

  const handleAddBlock = (block: FlavorBlock) => {
    if (placedBlockIds.has(block.id)) return;
    setNodes((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        type: 'flavorBlock',
        position: nextPosition(prev.length),
        data: { block },
      },
    ]);
    markDirty();
  };

  const persist = useCallback(async () => {
    const payload = {
      title: title.trim() || 'Composição',
      nodes: fromFlowNodes(nodes),
      edges: fromFlowEdges(edges),
    };

    setSaving(true);
    try {
      if (graphId) {
        const updated = await updateCompositionGraph(graphId, payload);
        setDirty(false);
        await mutateGraph();
        onSaved?.(updated);
        return updated;
      }
      const created = await createCompositionGraph(payload);
      setGraphId(created.id);
      loadedIdRef.current = created.id;
      setDirty(false);
      toast.success('Composição criada');
      onCreated?.(created);
      return created;
    } catch (err) {
      toast.error(errorMessage(err, 'Falha ao salvar composição'));
      return null;
    } finally {
      setSaving(false);
    }
  }, [edges, graphId, mutateGraph, nodes, onCreated, onSaved, title]);

  useEffect(() => {
    if (!dirty || !graphId || !hydrated) return undefined;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persist();
    }, 900);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [dirty, graphId, hydrated, persist]);

  if (graphIdProp && graphLoading && !hydrated) {
    return (
      <Card>
        <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
          <CircularProgress />
        </Stack>
      </Card>
    );
  }

  if (graphIdProp && graphError && !hydrated) {
    return (
      <Alert severity="error">
        Não foi possível carregar esta composição. Verifique se ela existe e se você está logado.
      </Alert>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'center' }}
        justifyContent="space-between"
        sx={{ px: 2, py: 1.5 }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap sx={{ flex: 1 }}>
          <TextField
            size="small"
            label="Título"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            sx={{ minWidth: 220, flex: 1, maxWidth: 420 }}
          />
          {dirty && (
            <Typography variant="caption" color="warning.main">
              alterações não salvas
            </Typography>
          )}
          {!dirty && graphId && (
            <Typography variant="caption" color="text.secondary">
              salvo
            </Typography>
          )}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Typography variant="caption" color="text.secondary">
            Peso nova ligação
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={defaultWeight}
            onChange={(_e, value: LinkWeight | null) => {
              if (value) setDefaultWeight(value);
            }}
          >
            <ToggleButton value={1}>1 leve</ToggleButton>
            <ToggleButton value={2}>2 média</ToggleButton>
            <ToggleButton value={3}>3 forte</ToggleButton>
          </ToggleButtonGroup>
          <Button
            size="small"
            variant="contained"
            disabled={saving || (!dirty && !!graphId)}
            onClick={() => void persist()}
            startIcon={
              saving ? (
                <CircularProgress size={16} color="inherit" />
              ) : (
                <Iconify icon="solar:diskette-bold" />
              )
            }
          >
            {graphId ? 'Salvar' : 'Criar composição'}
          </Button>
        </Stack>
      </Stack>

      <Divider />

      <Alert severity="info" sx={{ borderRadius: 0 }}>
        Ligue pelas 4 arestas do card. O peso da ligação é 1 (leve), 2 (média) ou 3 (forte). Clique
        numa linha para ciclar o peso. Delete com Backspace/Delete.
      </Alert>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
          height: { xs: 560, md: 640 },
        }}
      >
        <Box
          sx={{
            borderRight: (theme) => ({ md: `1px solid ${theme.vars.palette.divider}` }),
            borderBottom: (theme) => ({ xs: `1px solid ${theme.vars.palette.divider}`, md: 'none' }),
            minHeight: 0,
            maxHeight: { xs: 220, md: 'none' },
          }}
        >
          {blocksLoading ? (
            <Stack alignItems="center" justifyContent="center" sx={{ height: '100%', py: 4 }}>
              <CircularProgress size={28} />
            </Stack>
          ) : (
            <BlockPalette blocks={blocks} disabledIds={placedBlockIds} onAdd={handleAddBlock} />
          )}
        </Box>

        <Box sx={{ position: 'relative', minHeight: 0, bgcolor: 'background.neutral' }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={{ type: 'weighted', data: { weight: 2 } }}
            connectionMode={ConnectionMode.Loose}
            connectOnClick
            fitView
            deleteKeyCode={['Backspace', 'Delete']}
            proOptions={{ hideAttribution: true }}
          >
            <Background gap={18} size={1} />
            <Controls />
            <MiniMap pannable zoomable />
          </ReactFlow>

          {nodes.length === 0 && (
            <Box
              sx={{
                pointerEvents: 'none',
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 3,
              }}
            >
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Adicione blocos pela lista à esquerda para começar a desenhar.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
}

// ----------------------------------------------------------------------

type Props = {
  graphId?: string | null;
  initialTitle?: string;
  onCreated?: (graph: CompositionGraph) => void;
  onSaved?: (graph: CompositionGraph) => void;
};

export function ComposeCanvas({ graphId, initialTitle, onCreated, onSaved }: Props) {
  return (
    <ReactFlowProvider>
      <ComposeCanvasInner
        key={graphId ?? 'new'}
        graphId={graphId}
        initialTitle={initialTitle}
        onCreated={onCreated}
        onSaved={onSaved}
      />
    </ReactFlowProvider>
  );
}
