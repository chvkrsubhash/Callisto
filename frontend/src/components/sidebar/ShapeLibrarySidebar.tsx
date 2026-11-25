import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Search } from 'lucide-react';
import { SHAPE_CATEGORIES, SHAPE_LIBRARY } from '../../data/shapes';
import { useDiagramStore } from '../../store/diagramStore';
import type { ShapeCategory, ShapeDefinition } from '../../types/diagram';

export const ShapeLibrarySidebar: React.FC = () => {
  const store = useDiagramStore();
  const [query, setQuery] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    general: true,
    flowchart: true,
    software: true,
    uml: true,
    er: true,
  });

  const allShapes = useMemo(
    () => [...SHAPE_LIBRARY, ...store.customShapes],
    [store.customShapes]
  );

  const filteredByCategory = useMemo(() => {
    const q = query.trim().toLowerCase();
    const map = new Map<ShapeCategory, ShapeDefinition[]>();
    for (const cat of SHAPE_CATEGORIES) map.set(cat.id, []);
    for (const shape of allShapes) {
      if (
        !q ||
        shape.name.toLowerCase().includes(q) ||
        shape.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        map.get(shape.category)?.push(shape);
      }
    }
    return map;
  }, [allShapes, query]);

  if (!store.leftSidebarOpen) return null;

  const toggleCat = (id: string) =>
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));

  const handleDragStart = (e: React.DragEvent, shape: ShapeDefinition) => {
    e.dataTransfer.setData('application/callisto-shape', shape.kind);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside
      className="w-60 border-r flex flex-col shrink-0 select-none overflow-hidden"
      style={{
        backgroundColor: 'var(--callisto-sidebar-bg)',
        borderColor: 'var(--callisto-border)',
      }}
    >
      <div className="p-2 border-b" style={{ borderColor: 'var(--callisto-border)' }}>
        <div className="relative flex items-center">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shapes (e.g. UML, AWS, Router)..."
            className="w-full pl-7 pr-2 py-1 text-xs rounded border bg-white focus:border-blue-600 outline-none"
            style={{ borderColor: 'var(--callisto-border)' }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: 'var(--callisto-border)' }}>
        {SHAPE_CATEGORIES.map((cat) => {
          const items = filteredByCategory.get(cat.id) ?? [];
          if (items.length === 0 && query.trim()) return null;
          const isOpen = Boolean(query.trim()) || Boolean(openCategories[cat.id]);

          return (
            <div key={cat.id}>
              <button
                type="button"
                onClick={() => toggleCat(cat.id)}
                className="w-full px-2.5 py-1.5 flex items-center justify-between text-[11px] font-semibold text-slate-700 hover:bg-slate-200/50"
              >
                <span className="flex items-center gap-1">
                  {isOpen ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {cat.label}
                </span>
                <span className="text-[10px] font-mono text-slate-400">{items.length}</span>
              </button>

              {isOpen && (
                <div className="px-2 pb-2 grid grid-cols-2 gap-1.5">
                  {items.map((shape) => (
                    <button
                      key={shape.kind}
                      type="button"
                      draggable
                      onDragStart={(e) => handleDragStart(e, shape)}
                      onClick={() =>
                        store.addNode(shape.kind, {
                          x: 180 + Math.round(Math.random() * 140),
                          y: 120 + Math.round(Math.random() * 120),
                        })
                      }
                      title={`${shape.name} — Drag onto canvas or click to insert`}
                      className="flex flex-col items-center justify-center p-1.5 rounded border bg-white hover:border-blue-600 hover:shadow-xs text-center transition-colors cursor-grab active:cursor-grabbing"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    >
                      <ShapeThumbnail shape={shape} />
                      <span className="mt-1 text-[10px] leading-tight text-slate-700 line-clamp-2">
                        {shape.name}
                      </span>
                    </button>
                  ))}
                  {cat.id === 'custom' && (
                    <button
                      type="button"
                      onClick={() => {
                        const name = window.prompt('Custom shape label:');
                        if (!name?.trim()) return;
                        store.saveCustomShape({
                          kind: 'rounded-rect',
                          name: name.trim(),
                          category: 'custom',
                          defaultWidth: 150,
                          defaultHeight: 74,
                          defaultFill: '#F8FAFC',
                          defaultStroke: '#2563EB',
                          tags: ['custom', name.toLowerCase()],
                        });
                      }}
                      className="col-span-2 py-1 text-[11px] border border-dashed rounded flex items-center justify-center gap-1 text-slate-600 hover:border-blue-600 hover:text-blue-600"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    >
                      <Plus className="w-3 h-3" /> Save Custom Shape
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

const ShapeThumbnail: React.FC<{ shape: ShapeDefinition }> = ({ shape }) => {
  const s = shape.defaultStroke;
  const f = shape.defaultFill === 'transparent' ? '#FFFFFF' : shape.defaultFill;
  const k = shape.kind;

  if (k === 'circle' || k === 'fc-connector' || k === 'bpmn-start' || k === 'bpmn-intermediate' || k === 'bpmn-end') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <circle cx="17" cy="11" r="8.5" fill={f} stroke={s} strokeWidth={k === 'bpmn-end' ? 2.4 : 1.4} />
        {k === 'bpmn-intermediate' && <circle cx="17" cy="11" r="6" fill="none" stroke={s} strokeWidth="1" />}
      </svg>
    );
  }
  if (k === 'ellipse' || k === 'uml-usecase') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <ellipse cx="17" cy="11" rx="14" ry="8" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'rounded-rect' || k === 'uml-state' || k === 'bpmn-task' || k === 'bpmn-subprocess') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <rect x="3" y="3" width="28" height="16" rx="5" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'fc-start-end') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <rect x="3" y="4" width="28" height="14" rx="7" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'triangle') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="17,2 31,20 3,20" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'diamond' || k === 'fc-decision' || k.startsWith('bpmn-gateway')) {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="17,2 31,11 17,20 3,11" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'pentagon') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="17,2 31,9 26,20 8,20 3,9" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'hexagon' || k === 'fc-preparation') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="9,3 25,3 31,11 25,19 9,19 3,11" fill={f} stroke={s} strokeWidth="1.4" />
      </svg>
    );
  }
  if (k === 'star') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon
          points="17,2 20,8 27,8.5 22,13 23.5,20 17,16.5 10.5,20 12,13 7,8.5 14,8"
          fill={f}
          stroke={s}
          strokeWidth="1.3"
        />
      </svg>
    );
  }
  if (k === 'arrow-right') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="3,7 22,7 22,3 31,11 22,19 22,15 3,15" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'cylinder' || k === 'sw-database' || k === 'cloud-db') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <path d="M6,6 A11,3 0 0 1 28,6 L28,17 A11,3 0 0 1 6,17 Z" fill={f} stroke={s} strokeWidth="1.3" />
        <ellipse cx="17" cy="6" rx="11" ry="3" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'cloud' || k === 'net-internet') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <path
          d="M9,18 H26 C29,18 31,16 31,13 C31,10.5 29,8.5 26.5,8.2 C25.5,5 22.5,3 19,3.5 C16,4 14,5.5 13,8 C11.5,7.2 9.5,7.5 8.5,8.5 C5.5,9 3.5,11 3.5,13.5 C3.5,16 6,18 9,18 Z"
          fill={f}
          stroke={s}
          strokeWidth="1.3"
        />
      </svg>
    );
  }
  if (k === 'document' || k === 'fc-multi-doc') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <path d="M4,3 H30 V16 Q23,13 17,17 Q11,20 4,17 Z" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'callout' || k === 'uml-note') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="4,3 25,3 30,8 30,19 4,19" fill={f} stroke={s} strokeWidth="1.3" />
        <polyline points="25,3 25,8 30,8" fill="none" stroke={s} strokeWidth="1.2" />
      </svg>
    );
  }
  if (k === 'speech-bubble') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <path d="M4,3 H30 V15 H14 L9,20 L10,15 H4 Z" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'text') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <text x="17" y="16" textAnchor="middle" fontSize="14" fontWeight="700" fill="#334155">T</text>
      </svg>
    );
  }
  if (k === 'fc-io') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="8,3 31,3 26,19 3,19" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'fc-predefined') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <rect x="3" y="3" width="28" height="16" fill={f} stroke={s} strokeWidth="1.3" />
        <line x1="7" y1="3" x2="7" y2="19" stroke={s} strokeWidth="1.1" />
        <line x1="27" y1="3" x2="27" y2="19" stroke={s} strokeWidth="1.1" />
      </svg>
    );
  }
  if (k === 'fc-delay') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <path d="M4,3 H20 A8,8 0 0 1 20,19 H4 Z" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'fc-manual') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="3,3 31,3 27,19 7,19" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'fc-offpage') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <polygon points="6,3 28,3 28,13 17,20 6,13" fill={f} stroke={s} strokeWidth="1.3" />
      </svg>
    );
  }
  if (k === 'uml-actor') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <circle cx="17" cy="5" r="3" fill={f} stroke={s} strokeWidth="1.2" />
        <line x1="17" y1="8" x2="17" y2="15" stroke={s} strokeWidth="1.2" />
        <line x1="11" y1="11" x2="23" y2="11" stroke={s} strokeWidth="1.2" />
        <line x1="17" y1="15" x2="12" y2="20" stroke={s} strokeWidth="1.2" />
        <line x1="17" y1="15" x2="22" y2="20" stroke={s} strokeWidth="1.2" />
      </svg>
    );
  }
  if (k === 'uml-initial') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <circle cx="17" cy="11" r="6" fill="#1E293B" />
      </svg>
    );
  }
  if (k === 'uml-final') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <circle cx="17" cy="11" r="7" fill="#FFFFFF" stroke="#1E293B" strokeWidth="1.3" />
        <circle cx="17" cy="11" r="4" fill="#1E293B" />
      </svg>
    );
  }
  if (k === 'uml-fork') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <rect x="4" y="9" width="26" height="4" fill="#1E293B" />
      </svg>
    );
  }
  if (k === 'uml-class' || k === 'uml-interface' || k === 'uml-enum' || k === 'er-table' || k === 'er-document') {
    return (
      <svg width="34" height="22" viewBox="0 0 34 22">
        <rect x="3" y="2" width="28" height="18" fill={f} stroke={s} strokeWidth="1.3" />
        <line x1="3" y1="8" x2="31" y2="8" stroke={s} strokeWidth="1" />
        <line x1="3" y1="14" x2="31" y2="14" stroke={s} strokeWidth="1" />
      </svg>
    );
  }
  return (
    <svg width="34" height="22" viewBox="0 0 34 22">
      <rect x="3" y="3" width="28" height="16" rx="1.5" fill={f} stroke={s} strokeWidth="1.4" />
    </svg>
  );
};

