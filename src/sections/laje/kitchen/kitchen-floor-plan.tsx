import type { KitchenCanvasSize, KitchenStation } from 'src/types/kitchen-layout';
import type { OnNodesChange, Node } from '@xyflow/react';

import { useCallback, useEffect, useMemo } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useNodesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { DEFAULT_KITCHEN_CANVAS } from 'src/types/kitchen-layout';

import {
  KitchenStationNode,
  type KitchenMiseLine,
  type KitchenStationFlowNode,
} from './kitchen-station-node';

// ----------------------------------------------------------------------

const nodeTypes = { kitchenStation: KitchenStationNode };

function nodeWidth(node: Node): number {
  const fromStyle = Number(node.style?.width);
  if (Number.isFinite(fromStyle) && fromStyle > 0) return fromStyle;
  const measured = Number(node.measured?.width);
  if (Number.isFinite(measured) && measured > 0) return measured;
  return 180;
}

function nodeHeight(node: Node): number {
  const fromStyle = Number(node.style?.height);
  if (Number.isFinite(fromStyle) && fromStyle > 0) return fromStyle;
  const measured = Number(node.measured?.height);
  if (Number.isFinite(measured) && measured > 0) return measured;
  return 100;
}

function toFlowStations(
  stations: KitchenStation[],
  itemsByStation?: Map<string, KitchenMiseLine[]>,
  readOnly?: boolean
): KitchenStationFlowNode[] {
  return stations.map((station) => ({
    id: station.id,
    type: 'kitchenStation' as const,
    position: { x: station.x, y: station.y },
    style: {
      width: station.width,
      height: readOnly ? Math.max(station.height, 168) : station.height,
    },
    data: {
      stationType: station.type,
      name: station.name,
      color: station.color,
      items: itemsByStation?.get(station.id) ?? [],
      readOnly,
    },
    draggable: !readOnly,
    selectable: true,
  }));
}

function fromFlowStations(
  nodes: KitchenStationFlowNode[],
  previous: KitchenStation[]
): KitchenStation[] {
  const byId = new Map(previous.map((station) => [station.id, station]));
  return nodes.map((node) => {
    const prev = byId.get(node.id);
    return {
      id: node.id,
      type: node.data.stationType,
      name: node.data.name,
      x: node.position.x,
      y: node.position.y,
      width: nodeWidth(node),
      height: nodeHeight(node),
      rotation: prev?.rotation ?? 0,
      color: node.data.color ?? prev?.color ?? null,
    };
  });
}

type FloorInnerProps = {
  stations: KitchenStation[];
  canvas?: KitchenCanvasSize;
  itemsByStation?: Map<string, KitchenMiseLine[]>;
  readOnly?: boolean;
  emptyHint?: string;
  onStationsChange?: (stations: KitchenStation[]) => void;
  onSelectStation?: (stationId: string | null) => void;
};

function KitchenFloorPlanInner({
  stations,
  canvas = DEFAULT_KITCHEN_CANVAS,
  itemsByStation,
  readOnly = false,
  emptyHint,
  onStationsChange,
  onSelectStation,
}: FloorInnerProps) {
  const [nodes, setNodes, onNodesChangeBase] = useNodesState<KitchenStationFlowNode>([]);

  const signature = useMemo(
    () =>
      JSON.stringify({
        stations,
        readOnly,
        items: itemsByStation ? [...itemsByStation.entries()] : [],
      }),
    [itemsByStation, readOnly, stations]
  );

  useEffect(() => {
    setNodes(toFlowStations(stations, itemsByStation, readOnly));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, setNodes]);

  const emitStations = useCallback(() => {
    if (readOnly || !onStationsChange) return;
    setNodes((current) => {
      onStationsChange(fromFlowStations(current, stations));
      return current;
    });
  }, [onStationsChange, readOnly, setNodes, stations]);

  const onNodesChange: OnNodesChange<KitchenStationFlowNode> = useCallback(
    (changes) => {
      onNodesChangeBase(changes);
      if (readOnly || !onStationsChange) return;
      const shouldEmit = changes.some((change) => {
        if (change.type === 'remove' || change.type === 'add') return true;
        if (change.type === 'dimensions') return change.resizing === false;
        if (change.type === 'position' && change.dragging === false) return true;
        return false;
      });
      if (shouldEmit) {
        queueMicrotask(emitStations);
      }
    },
    [emitStations, onNodesChangeBase, onStationsChange, readOnly]
  );

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight: 0 }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onNodeClick={(_event, node) => onSelectStation?.(node.id)}
        onPaneClick={() => onSelectStation?.(null)}
        nodeTypes={nodeTypes}
        nodesConnectable={false}
        elementsSelectable
        nodesDraggable={!readOnly}
        panOnDrag
        zoomOnScroll
        snapToGrid
        snapGrid={[canvas.grid, canvas.grid]}
        fitView
        minZoom={0.35}
        maxZoom={1.8}
        deleteKeyCode={readOnly ? null : ['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={canvas.grid} size={1} />
        <Controls showInteractive={!readOnly} />
        <MiniMap pannable zoomable />
      </ReactFlow>

      {stations.length === 0 && emptyHint ? (
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
            {emptyHint}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}

type Props = FloorInnerProps;

export function KitchenFloorPlan(props: Props) {
  return (
    <ReactFlowProvider>
      <KitchenFloorPlanInner {...props} />
    </ReactFlowProvider>
  );
}
