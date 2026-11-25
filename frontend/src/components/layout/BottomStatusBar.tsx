import React from 'react';
import { CheckCircle2, CloudOff, Grid, Loader2, Map as MapIcon, Plus, X } from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';

export const BottomStatusBar: React.FC = () => {
  const store = useDiagramStore();
  const project = store.getActiveProject();
  const page = store.getActivePage();

  if (!project || !page) return null;

  const selectedCount =
    page.nodes.filter((n) => n.selected).length +
    page.edges.filter((e) => e.selected).length;

  return (
    <footer
      className="h-7 border-t px-2 flex items-center justify-between text-[11px] select-none shrink-0"
      style={{
        backgroundColor: 'var(--callisto-sidebar-bg)',
        borderColor: 'var(--callisto-border)',
      }}
    >
      {/* Page Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto max-w-[55%]">
        {project.pages.map((pg) => {
          const active = pg.id === page.id;
          return (
            <div
              key={pg.id}
              className={`flex items-center gap-1 px-2 py-0.5 rounded cursor-pointer border ${
                active
                  ? 'bg-white border-slate-300 font-semibold text-slate-900'
                  : 'border-transparent text-slate-600 hover:bg-slate-200/60'
              }`}
              onClick={() => store.switchPage(pg.id)}
              onDoubleClick={() => {
                const next = window.prompt('Rename page:', pg.name);
                if (next?.trim()) store.renamePage(pg.id, next.trim());
              }}
            >
              <span className="truncate max-w-28">{pg.name}</span>
              {project.pages.length > 1 && (
                <button
                  type="button"
                  title="Delete page"
                  onClick={(e) => {
                    e.stopPropagation();
                    store.deletePage(pg.id);
                  }}
                  className="hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          title="Add Page"
          onClick={() => store.addPage()}
          className="p-0.5 rounded hover:bg-slate-200 text-slate-600"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Status & Controls */}
      <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600">
        <span>Selected: {selectedCount}</span>
        <span>
          X:{store.cursorCoords.x} Y:{store.cursorCoords.y}
        </span>
        <span>{Math.round(store.zoom * 100)}%</span>

        <button
          type="button"
          onClick={() => store.setShowGrid(!store.showGrid)}
          title="Toggle Grid"
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
            store.showGrid ? 'bg-slate-200 text-slate-900' : ''
          }`}
        >
          <Grid className="w-3 h-3" />
          <span>Grid</span>
        </button>

        <button
          type="button"
          onClick={() => store.setShowMinimap(!store.showMinimap)}
          title="Toggle Minimap"
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${
            store.showMinimap ? 'bg-slate-200 text-slate-900' : ''
          }`}
        >
          <MapIcon className="w-3 h-3" />
          <span>Map</span>
        </button>

        <span className="flex items-center gap-1 font-sans">
          {store.saveStatus === 'saving' && (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
              <span>Saving</span>
            </>
          )}
          {store.saveStatus === 'saved' && (
            <>
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Saved</span>
            </>
          )}
          {store.saveStatus === 'offline' && (
            <>
              <CloudOff className="w-3 h-3 text-amber-600" />
              <span>Offline (Local)</span>
            </>
          )}
        </span>
      </div>
    </footer>
  );
};

