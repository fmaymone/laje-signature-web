export type HandleSide = 'top' | 'right' | 'bottom' | 'left';

/** 1 = leve, 2 = média, 3 = forte */
export type LinkWeight = 1 | 2 | 3;

export type GraphNodePosition = {
  x: number;
  y: number;
};

export type CompositionGraphNode = {
  id: string;
  block_id: string;
  position: GraphNodePosition;
};

export type CompositionGraphEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: HandleSide | null;
  targetHandle?: HandleSide | null;
  weight?: LinkWeight;
};

export type CompositionGraph = {
  id: string;
  title: string;
  notes?: string | null;
  owner_id?: string | null;
  nodes: CompositionGraphNode[];
  edges: CompositionGraphEdge[];
  created_at: string;
  updated_at: string;
};

export type CompositionGraphCreate = {
  title?: string;
  notes?: string | null;
  nodes?: CompositionGraphNode[];
  edges?: CompositionGraphEdge[];
};

export type CompositionGraphUpdate = {
  title?: string;
  notes?: string | null;
  nodes?: CompositionGraphNode[];
  edges?: CompositionGraphEdge[];
};

export type CompositionGraphListResponse = {
  items: CompositionGraph[];
  total: number;
};

export type BlockLink = {
  id: string;
  source_block_id: string;
  target_block_id: string;
  weight: LinkWeight;
  notes?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
};

export type BlockLinkCreate = {
  source_block_id: string;
  target_block_id: string;
  weight?: LinkWeight;
  notes?: string | null;
};

export type BlockLinkUpdate = {
  weight?: LinkWeight;
  notes?: string | null;
};

export type BlockLinkListResponse = {
  items: BlockLink[];
  total: number;
};

export type BlockLinkBulkItem = {
  target_block_id: string;
  weight?: LinkWeight;
  notes?: string | null;
};

export type BlockLinkBulkCreate = {
  source_block_id: string;
  links: BlockLinkBulkItem[];
};

export type BlockLinkBulkResult = {
  created: number;
  updated: number;
  skipped: number;
  items: BlockLink[];
};
