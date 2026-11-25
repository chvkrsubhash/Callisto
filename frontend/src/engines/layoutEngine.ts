import dagre from '@dagrejs/dagre';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { CallistoEdge, CallistoNode } from '../types/diagram';

export type LayoutAlgorithm =
  | 'dagre-tb'
  | 'dagre-lr'
  | 'dagre-bt'
  | 'dagre-rl'
  | 'elk-layered-tb'
  | 'elk-layered-lr'
  | 'elk-tree'
  | 'elk-radial'
  | 'elk-force'
  | 'circular'
  | 'grid';

export interface LayoutOptions {
  algorithm: LayoutAlgorithm;
  nodeSpacing?: number;
  layerSpacing?: number;
  selectedOnly?: boolean;
}

const elk = new ELK();

export async function applyAutomaticLayout(
  nodes: CallistoNode[],
  edges: CallistoEdge[],
  options: LayoutOptions
): Promise<CallistoNode[]> {
  const nodeSpacing = options.nodeSpacing ?? 48;
  const layerSpacing = options.layerSpacing ?? 72;

  const targetNodes = options.selectedOnly
    ? nodes.filter((n) => n.selected && !n.data.locked)
    : nodes.filter((n) => !n.data.locked);

  if (targetNodes.length === 0) return nodes;

  const targetIds = new Set(targetNodes.map((n) => n.id));
  const relevantEdges = edges.filter(
    (e) => targetIds.has(e.source) && targetIds.has(e.target)
  );

  const posMap = new Map<string, { x: number; y: number }>();

  if (options.algorithm === 'grid') {
    const cols = Math.max(1, Math.ceil(Math.sqrt(targetNodes.length)));
    const cellW = 240 + nodeSpacing;
    const cellH = 140 + layerSpacing * 0.5;
    targetNodes.forEach((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      posMap.set(n.id, { x: 80 + col * cellW, y: 80 + row * cellH });
    });
  } else if (options.algorithm === 'circular') {
    const cx = 420;
    const cy = 320;
    const radius = Math.max(160, targetNodes.length * 38);
    targetNodes.forEach((n, idx) => {
      const angle = (2 * Math.PI * idx) / targetNodes.length;
      const w = (n.width as number | undefined) ?? 140;
      const h = (n.height as number | undefined) ?? 72;
      posMap.set(n.id, {
        x: Math.round(cx + radius * Math.cos(angle) - w / 2),
        y: Math.round(cy + radius * Math.sin(angle) - h / 2),
      });
    });
  } else if (options.algorithm.startsWith('dagre-')) {
    const rankdir = options.algorithm.replace('dagre-', '').toUpperCase() as
      | 'TB'
      | 'LR'
      | 'BT'
      | 'RL';
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({
      rankdir,
      nodesep: nodeSpacing,
      ranksep: layerSpacing,
      marginx: 60,
      marginy: 60,
    });

    for (const n of targetNodes) {
      g.setNode(n.id, {
        width: (n.width as number | undefined) ?? 140,
        height: (n.height as number | undefined) ?? 72,
      });
    }
    for (const e of relevantEdges) {
      g.setEdge(e.source, e.target);
    }

    dagre.layout(g);

    for (const n of targetNodes) {
      const laid = g.node(n.id);
      if (laid) {
        const w = (n.width as number | undefined) ?? 140;
        const h = (n.height as number | undefined) ?? 72;
        posMap.set(n.id, {
          x: Math.round(laid.x - w / 2),
          y: Math.round(laid.y - h / 2),
        });
      }
    }
  } else {
    const elkAlgo =
      options.algorithm === 'elk-tree'
        ? 'mrtree'
        : options.algorithm === 'elk-radial'
          ? 'radial'
          : options.algorithm === 'elk-force'
            ? 'force'
            : 'layered';

    const direction = options.algorithm === 'elk-layered-lr' ? 'RIGHT' : 'DOWN';

    const graph = {
      id: 'root',
      layoutOptions: {
        'elk.algorithm': elkAlgo,
        'elk.direction': direction,
        'elk.spacing.nodeNode': String(nodeSpacing),
        'elk.layered.spacing.nodeNodeBetweenLayers': String(layerSpacing),
      },
      children: targetNodes.map((n) => ({
        id: n.id,
        width: (n.width as number | undefined) ?? 140,
        height: (n.height as number | undefined) ?? 72,
      })),
      edges: relevantEdges.map((e) => ({
        id: e.id,
        sources: [e.source],
        targets: [e.target],
      })),
    };

    const result = await elk.layout(graph);
    for (const child of result.children ?? []) {
      if (typeof child.x === 'number' && typeof child.y === 'number') {
        posMap.set(child.id, {
          x: Math.round(child.x + 60),
          y: Math.round(child.y + 60),
        });
      }
    }
  }

  return nodes.map((n) =>
    posMap.has(n.id) ? { ...n, position: posMap.get(n.id)! } : n
  );
}

