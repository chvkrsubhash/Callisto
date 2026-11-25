import React, { useMemo, useState } from 'react';
import {
  Copy,
  FilePlus,
  Folder,
  Grid,
  Home,
  LayoutTemplate,
  List,
  RotateCcw,
  Search,
  Star,
  Trash2,
} from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { DIAGRAM_TEMPLATES } from '../../data/templates';
import { serializePageToSVG } from '../../engines/exportEngine';

type NavSection = 'home' | 'my' | 'recent' | 'favorites' | 'templates' | 'trash';

export const DashboardView: React.FC = () => {
  const store = useDiagramStore();
  const [section, setSection] = useState<NavSection>('home');
  const [search, setSearch] = useState('');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');

  const visibleProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.projects.filter((p) => {
      if (section === 'trash') {
        if (!p.trashed) return false;
      } else {
        if (p.trashed) return false;
        if (section === 'favorites' && !p.favorite) return false;
      }
      if (q && !p.name.toLowerCase().includes(q) && !p.diagramType.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [store.projects, section, search]);

  const navItems: Array<{ id: NavSection; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Home', icon: <Home className="w-4 h-4" /> },
    { id: 'my', label: 'My Diagrams', icon: <Folder className="w-4 h-4" /> },
    { id: 'recent', label: 'Recent', icon: <RotateCcw className="w-4 h-4" /> },
    { id: 'favorites', label: 'Favorites', icon: <Star className="w-4 h-4" /> },
    { id: 'templates', label: 'Templates', icon: <LayoutTemplate className="w-4 h-4" /> },
    { id: 'trash', label: 'Trash', icon: <Trash2 className="w-4 h-4" /> },
  ];

  return (
    <div className="h-screen w-screen flex bg-white text-slate-800">
      {/* Left Navigation */}
      <aside
        className="w-56 border-r flex flex-col justify-between p-3 shrink-0"
        style={{
          backgroundColor: 'var(--callisto-sidebar-bg)',
          borderColor: 'var(--callisto-border)',
        }}
      >
        <div className="space-y-4">
          <div className="px-2 py-1">
            <div className="font-bold text-base tracking-tight text-slate-900">
              Callisto
            </div>
            <div className="text-[11px] text-slate-500">
              A product of AkashaVyom Labs
            </div>
          </div>

          <button
            type="button"
            onClick={() => store.createProject('Untitled Diagram')}
            className="w-full py-2 px-3 rounded bg-slate-600 hover:bg-slate-700 text-white text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <FilePlus className="w-3.5 h-3.5" /> New Diagram
          </button>

          <nav className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full px-2.5 py-1.5 rounded text-xs font-medium flex items-center gap-2 ${
                  section === item.id
                    ? 'bg-slate-200 text-slate-900'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="text-[10px] text-slate-500 px-2">
          Connect Ideas. Design Systems.
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header
          className="h-12 border-b px-5 flex items-center justify-between gap-4 shrink-0"
          style={{ borderColor: 'var(--callisto-border)' }}
        >
          <div className="relative flex-1 max-w-md flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search diagrams by title or type..."
              className="w-full pl-8 pr-3 py-1.5 text-xs border rounded bg-slate-50 outline-none focus:border-blue-600"
              style={{ borderColor: 'var(--callisto-border)' }}
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setLayoutMode('grid')}
              className={`p-1.5 rounded ${layoutMode === 'grid' ? 'bg-slate-200' : ''}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayoutMode('list')}
              className={`p-1.5 rounded ${layoutMode === 'list' ? 'bg-slate-200' : ''}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {section === 'templates' ? (
            <div>
              <h2 className="text-sm font-semibold mb-3">Engineering & Modeling Templates</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DIAGRAM_TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => store.createProject(tpl.name, tpl.diagramType, tpl.buildPages())}
                    className="p-3.5 rounded border text-left hover:border-blue-600 bg-white transition-colors"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  >
                    <div className="text-[10px] font-mono uppercase text-blue-600">{tpl.category}</div>
                    <div className="text-xs font-semibold mt-1">{tpl.name}</div>
                    <div className="text-[11px] text-slate-500 mt-1">{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {section === 'home' && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                    Quick Start Templates
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {DIAGRAM_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => store.createProject(tpl.name, tpl.diagramType, tpl.buildPages())}
                        className="p-2.5 rounded border text-left hover:border-blue-600 bg-slate-50"
                        style={{ borderColor: 'var(--callisto-border)' }}
                      >
                        <div className="text-[10px] font-mono text-blue-600 truncate">{tpl.category}</div>
                        <div className="text-[11px] font-medium mt-0.5 line-clamp-2">{tpl.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
                  {section === 'trash' ? 'Trash' : 'Diagrams'} ({visibleProjects.length})
                </h2>

                {visibleProjects.length === 0 ? (
                  <div
                    className="p-8 border border-dashed rounded text-center text-xs text-slate-500"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  >
                    No diagrams in this view. Create a blank diagram or start from a template above.
                  </div>
                ) : layoutMode === 'grid' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {visibleProjects.map((p) => {
                      const firstPage = p.pages[0];
                      const thumbSvg = firstPage ? serializePageToSVG(firstPage) : '';
                      return (
                        <div
                          key={p.id}
                          className="border rounded overflow-hidden bg-white flex flex-col"
                          style={{ borderColor: 'var(--callisto-border)' }}
                        >
                          <div
                            onClick={() => !p.trashed && store.openProject(p.id)}
                            className="h-32 bg-slate-50 border-b flex items-center justify-center overflow-hidden cursor-pointer p-2"
                            style={{ borderColor: 'var(--callisto-border)' }}
                          >
                            {firstPage && firstPage.nodes.length > 0 ? (
                              <img
                                alt={p.name}
                                src={`data:image/svg+xml;utf8,${encodeURIComponent(thumbSvg)}`}
                                className="max-h-full max-w-full object-contain"
                              />
                            ) : (
                              <span className="text-[11px] text-slate-400">Empty Canvas</span>
                            )}
                          </div>
                          <div className="p-2.5 flex items-center justify-between gap-2">
                            <div
                              onClick={() => !p.trashed && store.openProject(p.id)}
                              className="min-w-0 cursor-pointer"
                            >
                              <div className="text-xs font-semibold truncate">{p.name}</div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                {p.pages.length} page(s) · {new Date(p.updatedAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {!p.trashed ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => store.toggleFavoriteProject(p.id)}
                                    title="Favorite"
                                    className="p-1 rounded hover:bg-slate-100"
                                  >
                                    <Star className={`w-3.5 h-3.5 ${p.favorite ? 'fill-amber-400 text-amber-500' : 'text-slate-400'}`} />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => store.duplicateProject(p.id)}
                                    title="Duplicate"
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => store.trashProject(p.id)}
                                    title="Move to Trash"
                                    className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-red-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => store.restoreProject(p.id)}
                                    className="px-2 py-0.5 text-[10px] border rounded text-blue-600"
                                  >
                                    Restore
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => store.deleteProjectPermanently(p.id)}
                                    className="px-2 py-0.5 text-[10px] border rounded text-red-600"
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border rounded divide-y" style={{ borderColor: 'var(--callisto-border)' }}>
                    {visibleProjects.map((p) => (
                      <div
                        key={p.id}
                        className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50"
                      >
                        <button
                          type="button"
                          onClick={() => !p.trashed && store.openProject(p.id)}
                          className="font-medium text-left flex-1 truncate"
                        >
                          {p.name}
                        </button>
                        <span className="text-[11px] font-mono text-slate-500 mx-4">{p.diagramType}</span>
                        <span className="text-[11px] text-slate-500">{new Date(p.updatedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

