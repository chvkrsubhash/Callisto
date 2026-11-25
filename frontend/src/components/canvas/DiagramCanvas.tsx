import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  BackgroundVariant,
  MiniMap,
  ReactFlow,
  SelectionMode,
  useReactFlow,
  type ReactFlowInstance,
} from '@xyflow/react';
import type { CallistoEdge as CallistoEdgeType, CallistoNode as CallistoNodeType, ShapeKind } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';
import { CallistoNode } from './CallistoNode';
import { CallistoEdge } from './CallistoEdge';
import { EdgeMarkers } from './EdgeMarkers';

const nodeTypes = { callisto: CallistoNode };
const edgeTypes = { callisto: CallistoEdge };

interface DiagramCanvasProps {
  onFlowInit: (instance: ReactFlowInstance<CallistoNodeType, CallistoEdgeType>) => void;
}

export const DiagramCanvas: React.FC<DiagramCanvasProps> = ({ onFlowInit }) => {
  const store = useDiagramStore();
  const page = store.getActivePage();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const visibleNodes = useMemo(
    () => (page?.nodes ?? []).filter((n) => !n.hidden),
    [page?.nodes]
  );

  // Global engineering keyboard shortcuts (disabled while typing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping =
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable);

      if (isTyping) return;

      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        store.undo();
      } else if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        store.redo();
      } else if (mod && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        store.copySelected();
      } else if (mod && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        store.pasteClipboard();
      } else if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        store.duplicateSelected();
      } else if (mod && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        store.selectAll();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        store.ungroupSelected();
      } else if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        store.groupSelected();
      } else if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void store.saveNow();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        store.deleteSelected();
      } else if (e.key === 'Escape') {
        store.clearSelection();
        store.setToolMode('select');
      } else if (!mod) {
        const k = e.key.toLowerCase();
        if (k === 'v') store.setToolMode('select');
        else if (k === 'h') store.setToolMode('pan');
        else if (k === 't') store.setToolMode('text');
        else if (k === 'r') store.setToolMode('rectangle');
        else if (k === 'o') store.setToolMode('ellipse');
        else if (k === 'l') store.setToolMode('connector');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [store]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const shapeKind = e.dataTransfer.getData('application/callisto-shape') as ShapeKind;
      if (!shapeKind) return;
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      store.addNode(shapeKind, pos);
    },
    [screenToFlowPosition, store]
  );

  const onPaneClick = useCallback(
    (e: React.MouseEvent) => {
      if (
        store.toolMode === 'rectangle' ||
        store.toolMode === 'ellipse' ||
        store.toolMode === 'text'
      ) {
        const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        store.addNode(store.toolMode, pos);
        store.setToolMode('select');
      }
    },
    [screenToFlowPosition, store]
  );

  if (!page) return null;

  return (
    <div
      ref={wrapperRef}
      className="relative flex-1 h-full overflow-hidden"
      style={{ backgroundColor: page.background || 'var(--callisto-canvas-bg)' }}
      onMouseMove={(e) => {
        const rect = wrapperRef.current?.getBoundingClientRect();
        if (rect) {
          store.setCursorCoords({
            x: Math.round(e.clientX - rect.left),
            y: Math.round(e.clientY - rect.top),
          });
        }
      }}
    >
      <EdgeMarkers />

      {/* Top & Left Rulers */}
      {store.showRulers && (
        <>
          <div
            className="absolute top-0 left-0 w-5 h-5 border-r border-b z-20 pointer-events-none"
            style={{
              backgroundColor: 'var(--callisto-sidebar-bg)',
              borderColor: 'var(--callisto-border)',
            }}
          />
          <div
            className="absolute top-0 left-5 right-0 h-5 border-b z-20 pointer-events-none flex items-center text-[9px] font-mono text-slate-400 overflow-hidden"
            style={{
              backgroundColor: 'var(--callisto-sidebar-bg)',
              borderColor: 'var(--callisto-border)',
            }}
          >
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-20 shrink-0 border-l border-slate-300 pl-1">
                {i * 100}
              </div>
            ))}
          </div>
          <div
            className="absolute top-5 left-0 bottom-0 w-5 border-r z-20 pointer-events-none flex flex-col text-[9px] font-mono text-slate-400 overflow-hidden"
            style={{
              backgroundColor: 'var(--callisto-sidebar-bg)',
              borderColor: 'var(--callisto-border)',
            }}
          >
            {Array.from({ length: 16 }).map((_, i) => (
              <div key={i} className="h-20 shrink-0 border-t border-slate-300 pt-0.5 text-center">
                {i * 100}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Fixed Page Boundary Indicator */}
      {page.canvasMode === 'fixed' && (
        <div
          className="absolute pointer-events-none border-2 border-dashed border-slate-400/70 z-10"
          style={{
            left: store.showRulers ? 40 : 20,
            top: store.showRulers ? 40 : 20,
            width: page.orientation === 'landscape' ? page.pageWidth : page.pageHeight,
            height: page.orientation === 'landscape' ? page.pageHeight : page.pageWidth,
          }}
        />
      )}

      <ReactFlow<CallistoNodeType, CallistoEdgeType>
        className="bg-white"
        style={{ backgroundColor: '#FFFFFF' }}
        nodes={visibleNodes}
        edges={page.edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onInit={onFlowInit}
        onNodesChange={store.onNodesChange}
        onEdgesChange={store.onEdgesChange}
        onConnect={store.onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onPaneClick={onPaneClick}
        onMoveEnd={(_, viewport) => store.setZoom(viewport.zoom)}
        snapToGrid={store.snapToGrid}
        snapGrid={[store.gridSize, store.gridSize]}
        panOnDrag={store.toolMode === 'pan' ? true : [1, 2]}
        selectionOnDrag={store.toolMode === 'select'}
        selectionMode={SelectionMode.Partial}
        panOnScroll
        fitView={visibleNodes.length > 0}
        deleteKeyCode={null}
      >
        {store.showGrid && (
          <Background
            variant={BackgroundVariant.Lines}
            gap={store.gridSize}
            color="#E2E8F0"
            bgColor="#FFFFFF"
          />
        )}
        {store.showMinimap && (
          <MiniMap
            pannable
            zoomable
            nodeColor={(n) => (n.selected ? '#2563EB' : '#94A3B8')}
            className="!border !border-slate-300 !bg-white/90"
          />
        )}
      </ReactFlow>
    </div>
  );
};

