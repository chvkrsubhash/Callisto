import { create } from 'zustand';
import {
  type OnNodesChange,
  type OnEdgesChange,
  type Connection,
} from '@xyflow/react';
import type {
  CallistoEdge,
  CallistoEdgeData,
  CallistoNode,
  CallistoNodeData,
  DiagramComment,
  DiagramLayer,
  DiagramPage,
  DiagramProject,
  DiagramType,
  DiagramVersion,
  SaveStatus,
  ShapeDefinition,
  ShapeKind,
  ToolMode,
} from '../types/diagram';
import { getShapeDefinition } from '../data/shapes';
import { createId } from '../utils/ids';
import {
  deleteProjectLocal,
  loadAllProjectsLocal,
  loadCustomShapesLocal,
  loadSessionCookie,
  markPendingSync,
  saveCustomShapeLocal,
  saveProjectCacheSync,
  saveProjectLocal,
  saveSessionCookie,
} from '../utils/storage';

const MAX_HISTORY = 60;

interface HistorySnapshot {
  pages: DiagramPage[];
  activePageId: string;
}

export interface DiagramStoreState {
  projects: DiagramProject[];
  activeProjectId: string | null;
  viewMode: 'dashboard' | 'editor';
  toolMode: ToolMode;
  showGrid: boolean;
  snapToGrid: boolean;
  snapToObject: boolean;
  gridSize: number;
  showRulers: boolean;
  showMinimap: boolean;
  zoom: number;
  cursorCoords: { x: number; y: number };
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  customShapes: ShapeDefinition[];

  // Panels
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  rightTab: 'properties' | 'layers' | 'code' | 'validation' | 'ai' | 'comments';
  activeDialog:
    | null
    | 'export'
    | 'import'
    | 'templates'
    | 'shortcuts'
    | 'versions'
    | 'share'
    | 'sql';

  // History & Clipboard
  past: HistorySnapshot[];
  future: HistorySnapshot[];
  clipboard: { nodes: CallistoNode[]; edges: CallistoEdge[] } | null;

  // Initialization & Navigation
  initStore: () => Promise<void>;
  setViewMode: (mode: 'dashboard' | 'editor') => void;
  setToolMode: (mode: ToolMode) => void;
  setZoom: (zoom: number) => void;
  setCursorCoords: (coords: { x: number; y: number }) => void;
  setShowGrid: (v: boolean) => void;
  setSnapToGrid: (v: boolean) => void;
  setSnapToObject: (v: boolean) => void;
  setGridSize: (size: number) => void;
  setShowRulers: (v: boolean) => void;
  setShowMinimap: (v: boolean) => void;
  setLeftSidebarOpen: (v: boolean) => void;
  setRightSidebarOpen: (v: boolean) => void;
  setRightTab: (tab: DiagramStoreState['rightTab']) => void;
  setActiveDialog: (dialog: DiagramStoreState['activeDialog']) => void;

  // Project CRUD
  createProject: (name: string, diagramType?: DiagramType, initialPages?: DiagramPage[]) => DiagramProject;
  openProject: (projectId: string) => void;
  renameProject: (projectId: string, name: string) => void;
  duplicateProject: (projectId: string) => void;
  toggleFavoriteProject: (projectId: string) => void;
  trashProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  deleteProjectPermanently: (projectId: string) => void;
  saveNow: () => Promise<void>;

  // Helpers
  getActiveProject: () => DiagramProject | undefined;
  getActivePage: () => DiagramPage | undefined;

  // Canvas & Nodes & Edges
  onNodesChange: OnNodesChange<CallistoNode>;
  onEdgesChange: OnEdgesChange<CallistoEdge>;
  onConnect: (connection: Connection) => void;
  addNode: (kind: ShapeKind, position: { x: number; y: number }, overrides?: Partial<CallistoNodeData>) => CallistoNode;
  updateNodeData: (nodeId: string, patch: Partial<CallistoNodeData>) => void;
  updateNodePositionAndSize: (
    nodeId: string,
    rect: { x?: number; y?: number; width?: number; height?: number }
  ) => void;
  updateEdgeData: (edgeId: string, patch: Partial<CallistoEdgeData>) => void;
  replacePageGraph: (nodes: CallistoNode[], edges: CallistoEdge[], recordHistory?: boolean) => void;
  deleteSelected: () => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Object Manipulation
  duplicateSelected: () => void;
  copySelected: () => void;
  pasteClipboard: () => void;
  groupSelected: () => void;
  ungroupSelected: () => void;
  toggleLockSelected: (locked: boolean) => void;
  bringToFront: () => void;
  sendToBack: () => void;
  bringForward: () => void;
  sendBackward: () => void;

  // Alignment & Distribution
  alignSelected: (direction: 'left' | 'right' | 'top' | 'bottom' | 'center' | 'middle') => void;
  distributeSelected: (axis: 'horizontal' | 'vertical') => void;
  matchSelectedDimensions: (dimension: 'width' | 'height' | 'both') => void;

  // Undo / Redo
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Pages
  addPage: (name?: string, diagramType?: DiagramType) => void;
  switchPage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  duplicatePage: (pageId: string) => void;
  deletePage: (pageId: string) => void;
  updatePageSettings: (pageId: string, patch: Partial<DiagramPage>) => void;

  // Layers
  addLayer: (name: string) => void;
  renameLayer: (layerId: string, name: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  moveSelectedToLayer: (layerId: string) => void;

  // Comments & Versions & Custom Shapes
  addComment: (text: string, nodeId?: string) => void;
  resolveComment: (commentId: string) => void;
  createNamedVersion: (label: string) => void;
  restoreVersion: (versionId: string) => void;
  saveCustomShape: (shape: ShapeDefinition) => void;
}

function createDefaultLayer(): DiagramLayer {
  return {
    id: createId('layer'),
    name: 'Default Layer',
    visible: true,
    locked: false,
    order: 0,
  };
}

export function createBlankPage(name = 'Page 1', diagramType: DiagramType = 'generic'): DiagramPage {
  const defaultLayer = createDefaultLayer();
  return {
    id: createId('page'),
    name,
    diagramType,
    canvasMode: 'infinite',
    pageWidth: 1123,
    pageHeight: 794,
    orientation: 'landscape',
    background: '#FFFFFF',
    nodes: [],
    edges: [],
    layers: [defaultLayer],
    activeLayerId: defaultLayer.id,
  };
}

function clonePages(pages: DiagramPage[]): DiagramPage[] {
  return JSON.parse(JSON.stringify(pages)) as DiagramPage[];
}

export function buildNodeFromShape(
  kind: ShapeKind,
  position: { x: number; y: number },
  layerId: string,
  overrides?: Partial<CallistoNodeData>
): CallistoNode {
  const def = getShapeDefinition(kind);
  const id = createId('node');
  const data: CallistoNodeData = {
    shapeKind: kind,
    label: def.name,
    fill: def.defaultFill,
    stroke: def.defaultStroke,
    strokeWidth: 1.5,
    strokeStyle: 'solid',
    textColor: '#1E293B',
    fontSize: 13,
    fontWeight: 'medium',
    textAlign: 'center',
    rotation: 0,
    locked: false,
    layerId,
    metadata: {},
    ...overrides,
  };

  if ((kind === 'uml-class' || kind === 'uml-interface' || kind === 'uml-enum') && !data.umlClass) {
    data.umlClass = {
      stereotype: kind === 'uml-interface' ? 'interface' : kind === 'uml-enum' ? 'enum' : undefined,
      attributes: [
        { id: createId('attr'), visibility: '-', name: 'id', type: 'string' },
        { id: createId('attr'), visibility: '+', name: 'name', type: 'string' },
      ],
      methods:
        kind === 'uml-enum'
          ? []
          : [{ id: createId('meth'), visibility: '+', name: 'execute', params: '', returnType: 'void' }],
    };
  }

  if ((kind === 'er-table' || kind === 'er-document') && !data.erEntity) {
    data.erEntity = {
      tableName: kind === 'er-document' ? 'documents' : 'users',
      dialect: kind === 'er-document' ? 'mongodb' : 'postgresql',
      columns: [
        { id: createId('col'), name: 'id', dataType: kind === 'er-document' ? 'ObjectId' : 'UUID', isPrimaryKey: true, isNullable: false },
        { id: createId('col'), name: 'email', dataType: 'VARCHAR(255)', isUnique: true, isNullable: false },
        { id: createId('col'), name: 'created_at', dataType: 'TIMESTAMP', isNullable: false },
      ],
    };
  }

  return {
    id,
    type: 'callisto',
    position,
    width: def.defaultWidth,
    height: def.defaultHeight,
    style: { width: def.defaultWidth, height: def.defaultHeight },
    data,
  };
}

let autosaveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleAutosave(get: () => DiagramStoreState, set: (partial: Partial<DiagramStoreState>) => void) {
  const active = get().getActiveProject();
  if (active) {
    saveProjectCacheSync(active);
  }
  set({ saveStatus: navigator.onLine ? 'saving' : 'offline' });
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(async () => {
    const project = get().getActiveProject();
    if (!project) return;
    await saveProjectLocal(project);
    if (!navigator.onLine) {
      await markPendingSync(project.id);
      set({ saveStatus: 'offline', lastSavedAt: new Date().toISOString() });
    } else {
      set({ saveStatus: 'saved', lastSavedAt: new Date().toISOString() });
    }
  }, 350);
}

export const useDiagramStore = create<DiagramStoreState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  viewMode: 'dashboard',
  toolMode: 'select',
  showGrid: true,
  snapToGrid: true,
  snapToObject: true,
  gridSize: 16,
  showRulers: true,
  showMinimap: true,
  zoom: 1,
  cursorCoords: { x: 0, y: 0 },
  saveStatus: 'saved',
  lastSavedAt: null,
  customShapes: [],
  leftSidebarOpen: true,
  rightSidebarOpen: true,
  rightTab: 'properties',
  activeDialog: null,
  past: [],
  future: [],
  clipboard: null,

  initStore: async () => {
    const [storedProjects, storedShapes] = await Promise.all([
      loadAllProjectsLocal(),
      loadCustomShapesLocal(),
    ]);
    const session = loadSessionCookie();
    const sorted = storedProjects.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const restoredProject =
      session?.activeProjectId && sorted.find((p) => p.id === session.activeProjectId && !p.trashed);

    set({
      projects: sorted,
      customShapes: storedShapes,
      activeProjectId: restoredProject ? restoredProject.id : null,
      viewMode: restoredProject && session?.viewMode === 'editor' ? 'editor' : 'dashboard',
    });
  },

  setViewMode: (mode) => {
    saveSessionCookie({ activeProjectId: get().activeProjectId, viewMode: mode });
    set({ viewMode: mode });
  },
  setToolMode: (mode) => set({ toolMode: mode }),
  setZoom: (zoom) => set({ zoom }),
  setCursorCoords: (coords) => set({ cursorCoords: coords }),
  setShowGrid: (v) => set({ showGrid: v }),
  setSnapToGrid: (v) => set({ snapToGrid: v }),
  setSnapToObject: (v) => set({ snapToObject: v }),
  setGridSize: (size) => set({ gridSize: size }),
  setShowRulers: (v) => set({ showRulers: v }),
  setShowMinimap: (v) => set({ showMinimap: v }),
  setLeftSidebarOpen: (v) => set({ leftSidebarOpen: v }),
  setRightSidebarOpen: (v) => set({ rightSidebarOpen: v }),
  setRightTab: (tab) => set({ rightTab: tab, rightSidebarOpen: true }),
  setActiveDialog: (dialog) => set({ activeDialog: dialog }),

  getActiveProject: () => {
    const { projects, activeProjectId } = get();
    return projects.find((p) => p.id === activeProjectId);
  },

  getActivePage: () => {
    const project = get().getActiveProject();
    if (!project) return undefined;
    return project.pages.find((pg) => pg.id === project.activePageId) ?? project.pages[0];
  },

  createProject: (name, diagramType = 'generic', initialPages) => {
    const pages = initialPages && initialPages.length > 0 ? clonePages(initialPages) : [createBlankPage('Page 1', diagramType)];
    const now = new Date().toISOString();
    const project: DiagramProject = {
      id: createId('proj'),
      name,
      folder: 'General',
      favorite: false,
      trashed: false,
      diagramType,
      pages,
      activePageId: pages[0].id,
      comments: [],
      versions: [],
      createdAt: now,
      updatedAt: now,
      ownerId: 'local-user',
    };
    set((state) => ({
      projects: [project, ...state.projects],
      activeProjectId: project.id,
      viewMode: 'editor',
      past: [],
      future: [],
    }));
    saveSessionCookie({ activeProjectId: project.id, viewMode: 'editor' });
    void saveProjectLocal(project);
    return project;
  },

  openProject: (projectId) => {
    saveSessionCookie({ activeProjectId: projectId, viewMode: 'editor' });
    set({
      activeProjectId: projectId,
      viewMode: 'editor',
      past: [],
      future: [],
    });
  },

  renameProject: (projectId, name) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, name, updatedAt: new Date().toISOString() } : p
      ),
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) void saveProjectLocal(updated);
  },

  duplicateProject: (projectId) => {
    const src = get().projects.find((p) => p.id === projectId);
    if (!src) return;
    const now = new Date().toISOString();
    const copy: DiagramProject = {
      ...JSON.parse(JSON.stringify(src)),
      id: createId('proj'),
      name: `${src.name} (Copy)`,
      createdAt: now,
      updatedAt: now,
    };
    set((state) => ({ projects: [copy, ...state.projects] }));
    void saveProjectLocal(copy);
  },

  toggleFavoriteProject: (projectId) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, favorite: !p.favorite } : p
      ),
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) void saveProjectLocal(updated);
  },

  trashProject: (projectId) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, trashed: true } : p
      ),
      activeProjectId: state.activeProjectId === projectId ? null : state.activeProjectId,
      viewMode: state.activeProjectId === projectId ? 'dashboard' : state.viewMode,
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) void saveProjectLocal(updated);
  },

  restoreProject: (projectId) => {
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, trashed: false } : p
      ),
    }));
    const updated = get().projects.find((p) => p.id === projectId);
    if (updated) void saveProjectLocal(updated);
  },

  deleteProjectPermanently: (projectId) => {
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
    }));
    void deleteProjectLocal(projectId);
  },

  saveNow: async () => {
    const project = get().getActiveProject();
    if (!project) return;
    set({ saveStatus: 'saving' });
    await saveProjectLocal(project);
    set({
      saveStatus: navigator.onLine ? 'saved' : 'offline',
      lastSavedAt: new Date().toISOString(),
    });
  },

  pushHistory: () => {
    const project = get().getActiveProject();
    if (!project) return;
    const snap: HistorySnapshot = {
      pages: clonePages(project.pages),
      activePageId: project.activePageId,
    };
    set((state) => ({
      past: [...state.past.slice(-(MAX_HISTORY - 1)), snap],
      future: [],
    }));
  },

  undo: () => {
    const { past, future, activeProjectId } = get();
    if (past.length === 0 || !activeProjectId) return;
    const project = get().getActiveProject();
    if (!project) return;

    const previous = past[past.length - 1];
    const currentSnap: HistorySnapshot = {
      pages: clonePages(project.pages),
      activePageId: project.activePageId,
    };

    set((state) => ({
      past: state.past.slice(0, -1),
      future: [currentSnap, ...future],
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              pages: clonePages(previous.pages),
              activePageId: previous.activePageId,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  redo: () => {
    const { past, future, activeProjectId } = get();
    if (future.length === 0 || !activeProjectId) return;
    const project = get().getActiveProject();
    if (!project) return;

    const next = future[0];
    const currentSnap: HistorySnapshot = {
      pages: clonePages(project.pages),
      activePageId: project.activePageId,
    };

    set((state) => ({
      past: [...past, currentSnap],
      future: state.future.slice(1),
      projects: state.projects.map((p) =>
        p.id === activeProjectId
          ? {
              ...p,
              pages: clonePages(next.pages),
              activePageId: next.activePageId,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  onNodesChange: (changes) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;

    const nextNodes = changes.applyTo(page.nodes);
    const countChanged = nextNodes.length !== page.nodes.length;
    if (countChanged) get().pushHistory();

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id ? { ...pg, nodes: nextNodes } : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  onEdgesChange: (changes) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;

    const nextEdges = changes.applyTo(page.edges);
    if (nextEdges.length !== page.edges.length) get().pushHistory();

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id ? { ...pg, edges: nextEdges } : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  onConnect: (connection) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page || !connection.source || !connection.target) return;

    get().pushHistory();
    const isER = page.diagramType === 'er-diagram';
    const isUML = page.diagramType.startsWith('uml-');

    const newEdge: CallistoEdge = {
      id: createId('edge'),
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'callisto',
      data: {
        connectorType: 'orthogonal',
        lineStyle: 'solid',
        strokeColor: '#334155',
        strokeWidth: 1.5,
        arrowStart: isER ? 'crows-foot-one' : 'none',
        arrowEnd: isER ? 'crows-foot-many' : 'filled-arrow',
        umlRelationship: isUML ? 'association' : undefined,
        erCardinality: isER ? '1:N' : undefined,
        lineJump: false,
      },
    };

    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id ? { ...pg, edges: [...pg.edges, newEdge] } : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  addNode: (kind, position, overrides) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    const layerId = page?.activeLayerId ?? 'default';
    const node = buildNodeFromShape(kind, position, layerId, overrides);
    if (!project || !page) return node;

    get().pushHistory();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id ? { ...pg, nodes: [...pg.nodes, node] } : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
    return node;
  },

  updateNodeData: (nodeId, patch) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    get().pushHistory();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id
                  ? {
                      ...pg,
                      nodes: pg.nodes.map((n) =>
                        n.id === nodeId ? { ...n, data: { ...n.data, ...patch } } : n
                      ),
                    }
                  : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  updateNodePositionAndSize: (nodeId, rect) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    get().pushHistory();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id
                  ? {
                      ...pg,
                      nodes: pg.nodes.map((n) => {
                        if (n.id !== nodeId) return n;
                        const width = rect.width ?? (n.width as number | undefined) ?? 140;
                        const height = rect.height ?? (n.height as number | undefined) ?? 72;
                        return {
                          ...n,
                          position: {
                            x: rect.x ?? n.position.x,
                            y: rect.y ?? n.position.y,
                          },
                          width,
                          height,
                          style: { ...n.style, width, height },
                        };
                      }),
                    }
                  : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  updateEdgeData: (edgeId, patch) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    get().pushHistory();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id
                  ? {
                      ...pg,
                      edges: pg.edges.map((e) =>
                        e.id === edgeId
                          ? { ...e, data: { ...(e.data as CallistoEdgeData), ...patch } }
                          : e
                      ),
                    }
                  : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  replacePageGraph: (nodes, edges, recordHistory = true) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    if (recordHistory) get().pushHistory();
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              updatedAt: new Date().toISOString(),
              pages: p.pages.map((pg) =>
                pg.id === page.id ? { ...pg, nodes, edges } : pg
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  deleteSelected: () => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    const selectedNodeIds = new Set(page.nodes.filter((n) => n.selected && !n.data.locked).map((n) => n.id));
    const selectedEdgeIds = new Set(page.edges.filter((e) => e.selected).map((e) => e.id));
    if (selectedNodeIds.size === 0 && selectedEdgeIds.size === 0) return;

    get().pushHistory();
    const nextNodes = page.nodes.filter((n) => !selectedNodeIds.has(n.id));
    const nextEdges = page.edges.filter(
      (e) => !selectedEdgeIds.has(e.id) && !selectedNodeIds.has(e.source) && !selectedNodeIds.has(e.target)
    );
    get().replacePageGraph(nextNodes, nextEdges, false);
  },

  selectAll: () => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: p.pages.map((pg) =>
                pg.id === page.id
                  ? {
                      ...pg,
                      nodes: pg.nodes.map((n) => ({ ...n, selected: true })),
                      edges: pg.edges.map((e) => ({ ...e, selected: true })),
                    }
                  : pg
              ),
            }
          : p
      ),
    }));
  },

  clearSelection: () => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: p.pages.map((pg) =>
                pg.id === page.id
                  ? {
                      ...pg,
                      nodes: pg.nodes.map((n) => ({ ...n, selected: false })),
                      edges: pg.edges.map((e) => ({ ...e, selected: false })),
                    }
                  : pg
              ),
            }
          : p
      ),
    }));
  },

  copySelected: () => {
    const page = get().getActivePage();
    if (!page) return;
    const nodes = page.nodes.filter((n) => n.selected);
    const nodeIds = new Set(nodes.map((n) => n.id));
    const edges = page.edges.filter((e) => e.selected || (nodeIds.has(e.source) && nodeIds.has(e.target)));
    set({
      clipboard: {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges)),
      },
    });
  },

  pasteClipboard: () => {
    const { clipboard } = get();
    const page = get().getActivePage();
    if (!clipboard || !page || clipboard.nodes.length === 0) return;

    get().pushHistory();
    const idMap = new Map<string, string>();
    const pastedNodes: CallistoNode[] = clipboard.nodes.map((n) => {
      const newId = createId('node');
      idMap.set(n.id, newId);
      return {
        ...JSON.parse(JSON.stringify(n)),
        id: newId,
        position: { x: n.position.x + 28, y: n.position.y + 28 },
        selected: true,
      };
    });

    const pastedEdges: CallistoEdge[] = clipboard.edges
      .filter((e) => idMap.has(e.source) && idMap.has(e.target))
      .map((e) => ({
        ...JSON.parse(JSON.stringify(e)),
        id: createId('edge'),
        source: idMap.get(e.source)!,
        target: idMap.get(e.target)!,
        selected: true,
      }));

    const clearedNodes = page.nodes.map((n) => ({ ...n, selected: false }));
    const clearedEdges = page.edges.map((e) => ({ ...e, selected: false }));
    get().replacePageGraph([...clearedNodes, ...pastedNodes], [...clearedEdges, ...pastedEdges], false);
  },

  duplicateSelected: () => {
    get().copySelected();
    get().pasteClipboard();
  },

  groupSelected: () => {
    const page = get().getActivePage();
    if (!page) return;
    const selected = page.nodes.filter((n) => n.selected);
    if (selected.length < 2) return;
    const groupId = createId('grp');
    get().pushHistory();
    const nextNodes = page.nodes.map((n) =>
      n.selected ? { ...n, data: { ...n.data, groupId } } : n
    );
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  ungroupSelected: () => {
    const page = get().getActivePage();
    if (!page) return;
    const groupIds = new Set(page.nodes.filter((n) => n.selected && n.data.groupId).map((n) => n.data.groupId!));
    if (groupIds.size === 0) return;
    get().pushHistory();
    const nextNodes = page.nodes.map((n) =>
      n.data.groupId && groupIds.has(n.data.groupId)
        ? { ...n, data: { ...n.data, groupId: undefined } }
        : n
    );
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  toggleLockSelected: (locked) => {
    const page = get().getActivePage();
    if (!page) return;
    get().pushHistory();
    const nextNodes = page.nodes.map((n) =>
      n.selected
        ? { ...n, draggable: !locked, data: { ...n.data, locked } }
        : n
    );
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  bringToFront: () => {
    const page = get().getActivePage();
    if (!page) return;
    const maxZ = Math.max(0, ...page.nodes.map((n) => n.zIndex ?? 0));
    get().pushHistory();
    const nextNodes = page.nodes.map((n) => (n.selected ? { ...n, zIndex: maxZ + 1 } : n));
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  sendToBack: () => {
    const page = get().getActivePage();
    if (!page) return;
    const minZ = Math.min(0, ...page.nodes.map((n) => n.zIndex ?? 0));
    get().pushHistory();
    const nextNodes = page.nodes.map((n) => (n.selected ? { ...n, zIndex: minZ - 1 } : n));
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  bringForward: () => {
    const page = get().getActivePage();
    if (!page) return;
    get().pushHistory();
    const nextNodes = page.nodes.map((n) => (n.selected ? { ...n, zIndex: (n.zIndex ?? 0) + 1 } : n));
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  sendBackward: () => {
    const page = get().getActivePage();
    if (!page) return;
    get().pushHistory();
    const nextNodes = page.nodes.map((n) => (n.selected ? { ...n, zIndex: (n.zIndex ?? 0) - 1 } : n));
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  alignSelected: (direction) => {
    const page = get().getActivePage();
    if (!page) return;
    const selected = page.nodes.filter((n) => n.selected && !n.data.locked);
    if (selected.length < 2) return;

    get().pushHistory();
    const getW = (n: CallistoNode) => (n.width as number | undefined) ?? 140;
    const getH = (n: CallistoNode) => (n.height as number | undefined) ?? 72;

    const minX = Math.min(...selected.map((n) => n.position.x));
    const maxX = Math.max(...selected.map((n) => n.position.x + getW(n)));
    const minY = Math.min(...selected.map((n) => n.position.y));
    const maxY = Math.max(...selected.map((n) => n.position.y + getH(n)));
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const nextNodes = page.nodes.map((n) => {
      if (!n.selected || n.data.locked) return n;
      const w = getW(n);
      const h = getH(n);
      let x = n.position.x;
      let y = n.position.y;
      if (direction === 'left') x = minX;
      else if (direction === 'right') x = maxX - w;
      else if (direction === 'center') x = centerX - w / 2;
      else if (direction === 'top') y = minY;
      else if (direction === 'bottom') y = maxY - h;
      else if (direction === 'middle') y = centerY - h / 2;
      return { ...n, position: { x, y } };
    });

    get().replacePageGraph(nextNodes, page.edges, false);
  },

  distributeSelected: (axis) => {
    const page = get().getActivePage();
    if (!page) return;
    const selected = page.nodes.filter((n) => n.selected && !n.data.locked);
    if (selected.length < 3) return;

    get().pushHistory();
    const getW = (n: CallistoNode) => (n.width as number | undefined) ?? 140;
    const getH = (n: CallistoNode) => (n.height as number | undefined) ?? 72;

    const sorted = [...selected].sort((a, b) =>
      axis === 'horizontal' ? a.position.x - b.position.x : a.position.y - b.position.y
    );

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const totalSpan =
      axis === 'horizontal'
        ? last.position.x + getW(last) - first.position.x
        : last.position.y + getH(last) - first.position.y;
    const occupied = sorted.reduce((acc, n) => acc + (axis === 'horizontal' ? getW(n) : getH(n)), 0);
    const gap = (totalSpan - occupied) / (sorted.length - 1);

    const posMap = new Map<string, { x: number; y: number }>();
    let cursor = axis === 'horizontal' ? first.position.x : first.position.y;
    for (const n of sorted) {
      if (axis === 'horizontal') {
        posMap.set(n.id, { x: cursor, y: n.position.y });
        cursor += getW(n) + gap;
      } else {
        posMap.set(n.id, { x: n.position.x, y: cursor });
        cursor += getH(n) + gap;
      }
    }

    const nextNodes = page.nodes.map((n) =>
      posMap.has(n.id) ? { ...n, position: posMap.get(n.id)! } : n
    );
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  matchSelectedDimensions: (dimension) => {
    const page = get().getActivePage();
    if (!page) return;
    const selected = page.nodes.filter((n) => n.selected && !n.data.locked);
    if (selected.length < 2) return;
    const ref = selected[0];
    const refW = (ref.width as number | undefined) ?? 140;
    const refH = (ref.height as number | undefined) ?? 72;

    get().pushHistory();
    const nextNodes = page.nodes.map((n) => {
      if (!n.selected || n.data.locked) return n;
      const w = dimension === 'height' ? ((n.width as number | undefined) ?? 140) : refW;
      const h = dimension === 'width' ? ((n.height as number | undefined) ?? 72) : refH;
      return { ...n, width: w, height: h, style: { ...n.style, width: w, height: h } };
    });
    get().replacePageGraph(nextNodes, page.edges, false);
  },

  addPage: (name, diagramType) => {
    const project = get().getActiveProject();
    if (!project) return;
    const newPage = createBlankPage(
      name ?? `Page ${project.pages.length + 1}`,
      diagramType ?? project.diagramType
    );
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: [...p.pages, newPage],
              activePageId: newPage.id,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  switchPage: (pageId) => {
    const project = get().getActiveProject();
    if (!project) return;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id ? { ...p, activePageId: pageId } : p
      ),
    }));
  },

  renamePage: (pageId, name) => {
    const project = get().getActiveProject();
    if (!project) return;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: p.pages.map((pg) => (pg.id === pageId ? { ...pg, name } : pg)),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  duplicatePage: (pageId) => {
    const project = get().getActiveProject();
    if (!project) return;
    const src = project.pages.find((pg) => pg.id === pageId);
    if (!src) return;
    const copy: DiagramPage = {
      ...JSON.parse(JSON.stringify(src)),
      id: createId('page'),
      name: `${src.name} (Copy)`,
    };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? { ...p, pages: [...p.pages, copy], activePageId: copy.id }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  deletePage: (pageId) => {
    const project = get().getActiveProject();
    if (!project || project.pages.length <= 1) return;
    const remaining = project.pages.filter((pg) => pg.id !== pageId);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: remaining,
              activePageId:
                p.activePageId === pageId ? remaining[0].id : p.activePageId,
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  updatePageSettings: (pageId, patch) => {
    const project = get().getActiveProject();
    if (!project) return;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: p.pages.map((pg) => (pg.id === pageId ? { ...pg, ...patch } : pg)),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  addLayer: (name) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page) return;
    const layer: DiagramLayer = {
      id: createId('layer'),
      name,
      visible: true,
      locked: false,
      order: page.layers.length,
    };
    get().updatePageSettings(page.id, {
      layers: [...page.layers, layer],
      activeLayerId: layer.id,
    });
  },

  renameLayer: (layerId, name) => {
    const page = get().getActivePage();
    if (!page) return;
    get().updatePageSettings(page.id, {
      layers: page.layers.map((l) => (l.id === layerId ? { ...l, name } : l)),
    });
  },

  toggleLayerVisibility: (layerId) => {
    const page = get().getActivePage();
    if (!page) return;
    const target = page.layers.find((l) => l.id === layerId);
    if (!target) return;
    const nextVisible = !target.visible;
    get().updatePageSettings(page.id, {
      layers: page.layers.map((l) => (l.id === layerId ? { ...l, visible: nextVisible } : l)),
      nodes: page.nodes.map((n) =>
        n.data.layerId === layerId ? { ...n, hidden: !nextVisible } : n
      ),
    });
  },

  toggleLayerLock: (layerId) => {
    const page = get().getActivePage();
    if (!page) return;
    const target = page.layers.find((l) => l.id === layerId);
    if (!target) return;
    const nextLocked = !target.locked;
    get().updatePageSettings(page.id, {
      layers: page.layers.map((l) => (l.id === layerId ? { ...l, locked: nextLocked } : l)),
      nodes: page.nodes.map((n) =>
        n.data.layerId === layerId
          ? { ...n, draggable: !nextLocked, data: { ...n.data, locked: nextLocked } }
          : n
      ),
    });
  },

  setActiveLayer: (layerId) => {
    const page = get().getActivePage();
    if (!page) return;
    get().updatePageSettings(page.id, { activeLayerId: layerId });
  },

  moveSelectedToLayer: (layerId) => {
    const page = get().getActivePage();
    if (!page) return;
    get().pushHistory();
    get().replacePageGraph(
      page.nodes.map((n) =>
        n.selected ? { ...n, data: { ...n.data, layerId } } : n
      ),
      page.edges,
      false
    );
  },

  addComment: (text, nodeId) => {
    const project = get().getActiveProject();
    const page = get().getActivePage();
    if (!project || !page || !text.trim()) return;
    const comment: DiagramComment = {
      id: createId('cmt'),
      pageId: page.id,
      nodeId,
      author: 'Workspace Engineer',
      text: text.trim(),
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id ? { ...p, comments: [comment, ...p.comments] } : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  resolveComment: (commentId) => {
    const project = get().getActiveProject();
    if (!project) return;
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              comments: p.comments.map((c) =>
                c.id === commentId ? { ...c, resolved: !c.resolved } : c
              ),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  createNamedVersion: (label) => {
    const project = get().getActiveProject();
    if (!project) return;
    const version: DiagramVersion = {
      id: createId('ver'),
      label: label || `Snapshot ${project.versions.length + 1}`,
      createdAt: new Date().toISOString(),
      author: 'Workspace Engineer',
      pages: clonePages(project.pages),
    };
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id ? { ...p, versions: [version, ...p.versions] } : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  restoreVersion: (versionId) => {
    const project = get().getActiveProject();
    if (!project) return;
    const version = project.versions.find((v) => v.id === versionId);
    if (!version) return;
    get().pushHistory();
    const restoredPages = clonePages(version.pages);
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === project.id
          ? {
              ...p,
              pages: restoredPages,
              activePageId: restoredPages[0]?.id ?? p.activePageId,
              updatedAt: new Date().toISOString(),
            }
          : p
      ),
    }));
    scheduleAutosave(get, set);
  },

  saveCustomShape: (shape) => {
    set((state) => ({
      customShapes: [...state.customShapes.filter((s) => s.kind !== shape.kind), shape],
    }));
    void saveCustomShapeLocal(shape);
  },
}));
