import React, { useState } from 'react';
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  AlignEndHorizontal,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignStartVertical,
  Circle,
  ClipboardPaste,
  Copy,
  Download,
  FilePlus,
  FolderOpen,
  Hand,
  LayoutGrid,
  MousePointer2,
  Redo2,
  Save,
  Share2,
  Cpu,
  Spline,
  Square,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { applyAutomaticLayout, type LayoutAlgorithm } from '../../engines/layoutEngine';

interface MainToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
}

export const MainToolbar: React.FC<MainToolbarProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
}) => {
  const store = useDiagramStore();
  const page = store.getActivePage();
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false);

  const runLayout = async (algo: LayoutAlgorithm) => {
    setLayoutMenuOpen(false);
    if (!page) return;
    const nextNodes = await applyAutomaticLayout(page.nodes, page.edges, {
      algorithm: algo,
      selectedOnly: page.nodes.some((n) => n.selected),
    });
    store.replacePageGraph(nextNodes, page.edges);
  };

  const btnCls = (active = false) =>
    `p-1.5 rounded text-slate-700 transition-colors ${
      active
        ? 'bg-blue-600 text-white hover:bg-blue-700'
        : 'hover:bg-slate-200/80'
    }`;

  return (
    <div
      className="h-9 border-b px-2 flex items-center gap-0.5 overflow-x-auto shrink-0 select-none"
      style={{
        backgroundColor: 'var(--callisto-panel-bg)',
        borderColor: 'var(--callisto-border)',
      }}
    >
      {/* File actions */}
      <button type="button" title="New Diagram" onClick={() => store.createProject('Untitled Diagram')} className={btnCls()}>
        <FilePlus className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Open Dashboard" onClick={() => store.setViewMode('dashboard')} className={btnCls()}>
        <FolderOpen className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Save (Ctrl+S)" onClick={() => void store.saveNow()} className={btnCls()}>
        <Save className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 mx-1" />

      {/* History & Clipboard */}
      <button type="button" title="Undo (Ctrl+Z)" onClick={() => store.undo()} className={btnCls()}>
        <Undo2 className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Redo (Ctrl+Y)" onClick={() => store.redo()} className={btnCls()}>
        <Redo2 className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Copy (Ctrl+C)" onClick={() => store.copySelected()} className={btnCls()}>
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Paste (Ctrl+V)" onClick={() => store.pasteClipboard()} className={btnCls()}>
        <ClipboardPaste className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Delete (Del)" onClick={() => store.deleteSelected()} className={btnCls()}>
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 mx-1" />

      {/* Zoom */}
      <button type="button" title="Zoom Out" onClick={onZoomOut} className={btnCls()}>
        <ZoomOut className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        title="Fit View"
        onClick={onFitView}
        className="px-1.5 py-0.5 text-[11px] font-mono rounded hover:bg-slate-200 min-w-11 text-center"
      >
        {Math.round(store.zoom * 100)}%
      </button>
      <button type="button" title="Zoom In" onClick={onZoomIn} className={btnCls()}>
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 mx-1" />

      {/* Tools */}
      <button type="button" title="Selection Tool (V)" onClick={() => store.setToolMode('select')} className={btnCls(store.toolMode === 'select')}>
        <MousePointer2 className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Pan Tool (H / Space)" onClick={() => store.setToolMode('pan')} className={btnCls(store.toolMode === 'pan')}>
        <Hand className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Connector Tool (L)" onClick={() => store.setToolMode('connector')} className={btnCls(store.toolMode === 'connector')}>
        <Spline className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Text Tool (T)" onClick={() => store.setToolMode('text')} className={btnCls(store.toolMode === 'text')}>
        <Type className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Rectangle Tool (R)" onClick={() => store.setToolMode('rectangle')} className={btnCls(store.toolMode === 'rectangle')}>
        <Square className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Ellipse Tool (O)" onClick={() => store.setToolMode('ellipse')} className={btnCls(store.toolMode === 'ellipse')}>
        <Circle className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 mx-1" />

      {/* Alignment */}
      <button type="button" title="Align Left" onClick={() => store.alignSelected('left')} className={btnCls()}>
        <AlignStartVertical className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Align Center" onClick={() => store.alignSelected('center')} className={btnCls()}>
        <AlignCenterVertical className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Align Right" onClick={() => store.alignSelected('right')} className={btnCls()}>
        <AlignEndVertical className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Align Top" onClick={() => store.alignSelected('top')} className={btnCls()}>
        <AlignStartHorizontal className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Align Middle" onClick={() => store.alignSelected('middle')} className={btnCls()}>
        <AlignCenterHorizontal className="w-3.5 h-3.5" />
      </button>
      <button type="button" title="Align Bottom" onClick={() => store.alignSelected('bottom')} className={btnCls()}>
        <AlignEndHorizontal className="w-3.5 h-3.5" />
      </button>

      <div className="h-4 w-px bg-slate-300 mx-1" />

      {/* Automatic Layout */}
      <div className="relative">
        <button
          type="button"
          title="Automatic Layout (ELK.js / Dagre)"
          onClick={() => setLayoutMenuOpen(!layoutMenuOpen)}
          className="px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 hover:bg-slate-200"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Layout</span>
        </button>

        {layoutMenuOpen && (
          <div
            className="absolute left-0 top-full mt-1 w-56 py-1 rounded border shadow-lg z-50 text-xs"
            style={{
              backgroundColor: 'var(--callisto-panel-bg)',
              borderColor: 'var(--callisto-border)',
            }}
          >
            {(
              [
                ['dagre-tb', 'Hierarchical (Top → Bottom)'],
                ['dagre-lr', 'Hierarchical (Left → Right)'],
                ['dagre-bt', 'Hierarchical (Bottom → Top)'],
                ['dagre-rl', 'Hierarchical (Right → Left)'],
                ['elk-layered-tb', 'ELK Layered (TB)'],
                ['elk-layered-lr', 'ELK Layered (LR)'],
                ['elk-tree', 'ELK Tree'],
                ['elk-radial', 'ELK Radial'],
                ['elk-force', 'ELK Force-Directed'],
                ['circular', 'Circular'],
                ['grid', 'Grid'],
              ] as Array<[LayoutAlgorithm, string]>
            ).map(([algo, label]) => (
              <button
                key={algo}
                type="button"
                onClick={() => void runLayout(algo)}
                className="w-full px-3 py-1.5 text-left hover:bg-blue-600 hover:text-white"
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        title="Export Diagram"
        onClick={() => store.setActiveDialog('export')}
        className="px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 hover:bg-slate-200"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden lg:inline">Export</span>
      </button>

      <button
        type="button"
        title="Share & Collaborate"
        onClick={() => store.setActiveDialog('share')}
        className={btnCls()}
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        title="AI Diagram Assistant"
        onClick={() => store.setRightTab('ai')}
        className={`ml-auto px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 ${
          store.rightSidebarOpen && store.rightTab === 'ai'
            ? 'bg-blue-600 text-white'
            : 'hover:bg-slate-200'
        }`}
      >
        <Cpu className="w-3.5 h-3.5" />
        <span>Model Assistant</span>
      </button>
    </div>
  );
};

