import React, { useState } from 'react';
import {
  ChevronDown,
  Home,
} from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { applyAutomaticLayout } from '../../engines/layoutEngine';

interface MenuItem {
  label: string;
  shortcut?: string;
  action?: () => void;
  divider?: boolean;
}

export const TopMenuBar: React.FC = () => {
  const store = useDiagramStore();
  const project = store.getActiveProject();
  const page = store.getActivePage();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const runLayout = async (algo: 'dagre-tb' | 'dagre-lr' | 'elk-layered-tb' | 'grid') => {
    if (!page) return;
    const nextNodes = await applyAutomaticLayout(page.nodes, page.edges, { algorithm: algo });
    store.replacePageGraph(nextNodes, page.edges);
  };

  const menus: Record<string, MenuItem[]> = {
    File: [
      { label: 'New Blank Diagram', action: () => store.createProject('Untitled Diagram') },
      { label: 'New from Template...', action: () => store.setActiveDialog('templates') },
      { label: 'Open Dashboard', action: () => store.setViewMode('dashboard') },
      { label: '', divider: true },
      { label: 'Save Now', shortcut: 'Ctrl+S', action: () => void store.saveNow() },
      { label: 'Save Named Version...', action: () => store.setActiveDialog('versions') },
      { label: '', divider: true },
      { label: 'Import (JSON / Draw.io / SQL / Mermaid)...', action: () => store.setActiveDialog('import') },
      { label: 'Export (PNG / SVG / PDF / SQL / ZIP)...', action: () => store.setActiveDialog('export') },
    ],
    Edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => store.undo() },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => store.redo() },
      { label: '', divider: true },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => store.copySelected() },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => store.pasteClipboard() },
      { label: 'Duplicate', shortcut: 'Ctrl+D', action: () => store.duplicateSelected() },
      { label: 'Delete Selected', shortcut: 'Del', action: () => store.deleteSelected() },
      { label: '', divider: true },
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => store.selectAll() },
      { label: 'Clear Selection', shortcut: 'Esc', action: () => store.clearSelection() },
    ],
    View: [
      { label: `${store.showGrid ? '✓ ' : ''}Show Grid`, action: () => store.setShowGrid(!store.showGrid) },
      { label: `${store.snapToGrid ? '✓ ' : ''}Snap to Grid`, action: () => store.setSnapToGrid(!store.snapToGrid) },
      { label: `${store.showRulers ? '✓ ' : ''}Show Rulers`, action: () => store.setShowRulers(!store.showRulers) },
      { label: `${store.showMinimap ? '✓ ' : ''}Show Minimap`, action: () => store.setShowMinimap(!store.showMinimap) },
      { label: '', divider: true },
      {
        label: page?.canvasMode === 'fixed' ? 'Switch to Infinite Canvas' : 'Switch to Fixed Page Bounds',
        action: () =>
          page &&
          store.updatePageSettings(page.id, {
            canvasMode: page.canvasMode === 'fixed' ? 'infinite' : 'fixed',
          }),
      },
      { label: 'Toggle Left Shape Library', action: () => store.setLeftSidebarOpen(!store.leftSidebarOpen) },
      { label: 'Toggle Right Inspector', action: () => store.setRightSidebarOpen(!store.rightSidebarOpen) },
    ],
    Insert: [
      { label: 'Rectangle', shortcut: 'R', action: () => store.addNode('rectangle', { x: 220, y: 160 }) },
      { label: 'Ellipse', shortcut: 'O', action: () => store.addNode('ellipse', { x: 240, y: 180 }) },
      { label: 'UML Class', action: () => store.addNode('uml-class', { x: 220, y: 140 }) },
      { label: 'Database Table (ER)', action: () => store.addNode('er-table', { x: 220, y: 140 }) },
      { label: 'Security / VPC Zone', action: () => store.addNode('zone-boundary', { x: 160, y: 120 }) },
      { label: 'New Page', action: () => store.addPage() },
    ],
    Arrange: [
      { label: 'Align Left', action: () => store.alignSelected('left') },
      { label: 'Align Center', action: () => store.alignSelected('center') },
      { label: 'Align Right', action: () => store.alignSelected('right') },
      { label: 'Align Top', action: () => store.alignSelected('top') },
      { label: 'Align Middle', action: () => store.alignSelected('middle') },
      { label: 'Align Bottom', action: () => store.alignSelected('bottom') },
      { label: '', divider: true },
      { label: 'Distribute Horizontally', action: () => store.distributeSelected('horizontal') },
      { label: 'Distribute Vertically', action: () => store.distributeSelected('vertical') },
      { label: 'Match Width & Height', action: () => store.matchSelectedDimensions('both') },
      { label: '', divider: true },
      { label: 'Group Selected', shortcut: 'Ctrl+G', action: () => store.groupSelected() },
      { label: 'Ungroup', shortcut: 'Ctrl+Shift+G', action: () => store.ungroupSelected() },
      { label: 'Bring to Front', action: () => store.bringToFront() },
      { label: 'Send to Back', action: () => store.sendToBack() },
    ],
    Diagram: [
      { label: 'Auto Layout: Hierarchical (Top → Bottom)', action: () => void runLayout('dagre-tb') },
      { label: 'Auto Layout: Hierarchical (Left → Right)', action: () => void runLayout('dagre-lr') },
      { label: 'Auto Layout: ELK Layered', action: () => void runLayout('elk-layered-tb') },
      { label: 'Auto Layout: Grid', action: () => void runLayout('grid') },
      { label: '', divider: true },
      { label: 'Open Diagram-as-Code Editor', action: () => store.setRightTab('code') },
      { label: 'Generate / Import SQL DDL', action: () => store.setActiveDialog('sql') },
    ],
    Tools: [
      { label: 'Validate Diagram', action: () => store.setRightTab('validation') },
      { label: 'Layers & Hierarchy', action: () => store.setRightTab('layers') },
      { label: 'AI Diagram Assistant', action: () => store.setRightTab('ai') },
    ],
    Review: [
      { label: 'Comments & Mentions', action: () => store.setRightTab('comments') },
      { label: 'Version History', action: () => store.setActiveDialog('versions') },
      { label: 'Share & Permissions', action: () => store.setActiveDialog('share') },
    ],
    Help: [
      { label: 'Keyboard Shortcuts', action: () => store.setActiveDialog('shortcuts') },
      { label: 'Template Gallery', action: () => store.setActiveDialog('templates') },
    ],
  };

  return (
    <header
      className="h-9 border-b flex items-center justify-between px-2 text-xs select-none shrink-0 relative z-40"
      style={{
        backgroundColor: 'var(--callisto-sidebar-bg)',
        borderColor: 'var(--callisto-border)',
      }}
      onMouseLeave={() => setOpenMenu(null)}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => store.setViewMode('dashboard')}
          title="Return to Callisto Dashboard"
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-200/70 font-semibold text-slate-800"
        >
          <Home className="w-3.5 h-3.5 text-slate-600" />
          <span>Callisto</span>
        </button>

        <span className="text-slate-300 mx-0.5">|</span>

        {Object.keys(menus).map((menuName) => (
          <div key={menuName} className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === menuName ? null : menuName)}
              onMouseEnter={() => openMenu && setOpenMenu(menuName)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                openMenu === menuName
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-700 hover:bg-slate-200/60'
              }`}
            >
              {menuName}
            </button>

            {openMenu === menuName && (
              <div
                className="absolute left-0 top-full mt-0.5 w-64 py-1 rounded border shadow-lg z-50"
                style={{
                  backgroundColor: 'var(--callisto-panel-bg)',
                  borderColor: 'var(--callisto-border)',
                }}
              >
                {menus[menuName].map((item, idx) =>
                  item.divider ? (
                    <div
                      key={idx}
                      className="my-1 border-t"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    />
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setOpenMenu(null);
                        item.action?.();
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-blue-600 hover:text-white text-slate-700"
                    >
                      <span>{item.label}</span>
                      {item.shortcut && (
                        <span className="text-[10px] opacity-70 font-mono">{item.shortcut}</span>
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {project && (
          <input
            aria-label="Project Name"
            value={project.name}
            onChange={(e) => store.renameProject(project.id, e.target.value)}
            className="px-2 py-0.5 text-xs font-medium bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-600 rounded outline-none text-center max-w-56 truncate"
          />
        )}
        <span className="hidden md:inline text-[11px] text-slate-500">
          AkashaVyom Labs
        </span>
        <button
          type="button"
          onClick={() => store.setActiveDialog('share')}
          className="px-2.5 py-1 rounded bg-slate-600 hover:bg-slate-700 text-white text-[11px] font-medium flex items-center gap-1"
        >
          Share <ChevronDown className="w-3 h-3" />
        </button>
      </div>
    </header>
  );
};

