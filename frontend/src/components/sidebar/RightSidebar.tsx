import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Code2,
  Eye,
  EyeOff,
  Info,
  Layers,
  Lock,
  MessageSquare,
  Plus,
  ShieldCheck,
  Sliders,
  Cpu,
  Trash2,
  Unlock,
} from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { validateDiagramPage } from '../../engines/validationEngine';
import { explainDiagramPage, generateDiagramFromPrompt, parseCodeSnippetToDiagram } from '../../engines/aiEngine';
import { createId } from '../../utils/ids';
import type {
  ArrowheadType,
  ConnectorType,
  DiagramType,
  ERDialect,
  UMLRelationshipType,
  Visibility,
} from '../../types/diagram';
import { CodeEditorPanel } from './CodeEditorPanel';

export const RightSidebar: React.FC = () => {
  const store = useDiagramStore();
  const project = store.getActiveProject();
  const page = store.getActivePage();

  const [aiPrompt, setAiPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState<'local' | 'gemini' | 'groq' | 'openrouter' | 'ollama'>('local');
  const [aiCodeInput, setAiCodeInput] = useState('');
  const [aiCodeLang, setAiCodeLang] = useState<'python' | 'typescript' | 'java' | 'csharp' | 'sql'>('python');
  const [aiOutput, setAiOutput] = useState<string>('');
  const [aiPendingGraph, setAiPendingGraph] = useState<{
    nodes: NonNullable<typeof page>['nodes'];
    edges: NonNullable<typeof page>['edges'];
    summary: string;
  } | null>(null);
  const [aiBusy, setAiBusy] = useState(false);

  const [newLayerName, setNewLayerName] = useState('');
  const [newComment, setNewComment] = useState('');

  const validationIssues = useMemo(
    () => (page ? validateDiagramPage(page) : []),
    [page]
  );

  if (!store.rightSidebarOpen || !project || !page) return null;

  const selectedNodes = page.nodes.filter((n) => n.selected);
  const selectedEdges = page.edges.filter((e) => e.selected);
  const activeNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
  const activeEdge = selectedEdges.length === 1 && !activeNode ? selectedEdges[0] : null;

  const tabs: Array<{ id: typeof store.rightTab; label: string; icon: React.ReactNode }> = [
    { id: 'properties', label: 'Props', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'layers', label: 'Layers', icon: <Layers className="w-3.5 h-3.5" /> },
    { id: 'code', label: 'Code', icon: <Code2 className="w-3.5 h-3.5" /> },
    { id: 'validation', label: 'Check', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { id: 'ai', label: 'Assist', icon: <Cpu className="w-3.5 h-3.5" /> },
    { id: 'comments', label: 'Notes', icon: <MessageSquare className="w-3.5 h-3.5" /> },
  ];

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setAiBusy(true);
    try {
      const res = await generateDiagramFromPrompt(aiPrompt, page.activeLayerId, aiProvider);
      setAiPendingGraph({ nodes: res.nodes, edges: res.edges, summary: res.summary });
      setAiOutput(`${res.summary} (${res.nodes.length} nodes, ${res.edges.length} connectors ready to preview/apply.)`);
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <aside
      className="w-72 border-l flex flex-col shrink-0 overflow-hidden"
      style={{
        backgroundColor: 'var(--callisto-sidebar-bg)',
        borderColor: 'var(--callisto-border)',
      }}
    >
      {/* Compact Tab Strip */}
      <div
        className="grid grid-cols-6 border-b text-[10px] font-medium"
        style={{ borderColor: 'var(--callisto-border)' }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => store.setRightTab(t.id)}
            className={`py-2 flex flex-col items-center gap-0.5 border-b-2 transition-colors ${
              store.rightTab === t.id
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:bg-slate-200/50'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* PROPERTIES TAB */}
        {store.rightTab === 'properties' && (
          <div className="p-3 space-y-3 text-xs">
            {activeNode ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">
                    {activeNode.data.shapeKind}
                  </span>
                  <button
                    type="button"
                    onClick={() => store.toggleLockSelected(!activeNode.data.locked)}
                    className="p-1 rounded border hover:bg-slate-100"
                    style={{ borderColor: 'var(--callisto-border)' }}
                    title={activeNode.data.locked ? 'Unlock' : 'Lock'}
                  >
                    {activeNode.data.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Label</label>
                  <input
                    value={activeNode.data.label}
                    onChange={(e) => store.updateNodeData(activeNode.id, { label: e.target.value })}
                    className="w-full px-2 py-1 rounded border bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">X</label>
                    <input
                      type="number"
                      value={Math.round(activeNode.position.x)}
                      onChange={(e) =>
                        store.updateNodePositionAndSize(activeNode.id, { x: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 rounded border bg-white font-mono"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Y</label>
                    <input
                      type="number"
                      value={Math.round(activeNode.position.y)}
                      onChange={(e) =>
                        store.updateNodePositionAndSize(activeNode.id, { y: Number(e.target.value) })
                      }
                      className="w-full px-2 py-1 rounded border bg-white font-mono"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Width</label>
                    <input
                      type="number"
                      value={Math.round((activeNode.width as number) || 140)}
                      onChange={(e) =>
                        store.updateNodePositionAndSize(activeNode.id, { width: Math.max(24, Number(e.target.value)) })
                      }
                      className="w-full px-2 py-1 rounded border bg-white font-mono"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Height</label>
                    <input
                      type="number"
                      value={Math.round((activeNode.height as number) || 72)}
                      onChange={(e) =>
                        store.updateNodePositionAndSize(activeNode.id, { height: Math.max(24, Number(e.target.value)) })
                      }
                      className="w-full px-2 py-1 rounded border bg-white font-mono"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Fill</label>
                    <input
                      type="color"
                      value={activeNode.data.fill.startsWith('#') ? activeNode.data.fill : '#FFFFFF'}
                      onChange={(e) => store.updateNodeData(activeNode.id, { fill: e.target.value })}
                      className="w-full h-7 rounded border cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Border</label>
                    <input
                      type="color"
                      value={activeNode.data.stroke.startsWith('#') ? activeNode.data.stroke : '#334155'}
                      onChange={(e) => store.updateNodeData(activeNode.id, { stroke: e.target.value })}
                      className="w-full h-7 rounded border cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">Rotate °</label>
                    <input
                      type="number"
                      value={activeNode.data.rotation}
                      onChange={(e) => store.updateNodeData(activeNode.id, { rotation: Number(e.target.value) })}
                      className="w-full h-7 px-1.5 rounded border bg-white font-mono"
                      style={{ borderColor: 'var(--callisto-border)' }}
                    />
                  </div>
                </div>

                {/* UML Class Structured Editor */}
                {activeNode.data.umlClass && (
                  <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--callisto-border)' }}>
                    <div className="flex items-center justify-between font-semibold text-[11px]">
                      <span>UML Attributes</span>
                      <button
                        type="button"
                        onClick={() =>
                          store.updateNodeData(activeNode.id, {
                            umlClass: {
                              ...activeNode.data.umlClass!,
                              attributes: [
                                ...activeNode.data.umlClass!.attributes,
                                { id: createId('a'), visibility: '-', name: 'field', type: 'string' },
                              ],
                            },
                          })
                        }
                        className="text-blue-600 flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    </div>
                    {activeNode.data.umlClass.attributes.map((attr, idx) => (
                      <div key={attr.id} className="flex items-center gap-1">
                        <select
                          value={attr.visibility}
                          onChange={(e) => {
                            const attrs = [...activeNode.data.umlClass!.attributes];
                            attrs[idx] = { ...attr, visibility: e.target.value as Visibility };
                            store.updateNodeData(activeNode.id, {
                              umlClass: { ...activeNode.data.umlClass!, attributes: attrs },
                            });
                          }}
                          className="w-9 px-1 py-0.5 border rounded font-mono bg-white"
                        >
                          <option value="+">+</option>
                          <option value="-">-</option>
                          <option value="#">#</option>
                          <option value="~">~</option>
                        </select>
                        <input
                          value={attr.name}
                          onChange={(e) => {
                            const attrs = [...activeNode.data.umlClass!.attributes];
                            attrs[idx] = { ...attr, name: e.target.value };
                            store.updateNodeData(activeNode.id, {
                              umlClass: { ...activeNode.data.umlClass!, attributes: attrs },
                            });
                          }}
                          className="flex-1 min-w-0 px-1.5 py-0.5 border rounded font-mono bg-white"
                        />
                        <input
                          value={attr.type}
                          onChange={(e) => {
                            const attrs = [...activeNode.data.umlClass!.attributes];
                            attrs[idx] = { ...attr, type: e.target.value };
                            store.updateNodeData(activeNode.id, {
                              umlClass: { ...activeNode.data.umlClass!, attributes: attrs },
                            });
                          }}
                          className="w-16 px-1.5 py-0.5 border rounded font-mono bg-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const attrs = activeNode.data.umlClass!.attributes.filter((a) => a.id !== attr.id);
                            store.updateNodeData(activeNode.id, {
                              umlClass: { ...activeNode.data.umlClass!, attributes: attrs },
                            });
                          }}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* ER Entity Structured Editor */}
                {activeNode.data.erEntity && (
                  <div className="pt-2 border-t space-y-2" style={{ borderColor: 'var(--callisto-border)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[11px]">Table & Columns</span>
                      <select
                        value={activeNode.data.erEntity.dialect}
                        onChange={(e) =>
                          store.updateNodeData(activeNode.id, {
                            erEntity: {
                              ...activeNode.data.erEntity!,
                              dialect: e.target.value as ERDialect,
                            },
                          })
                        }
                        className="px-1.5 py-0.5 border rounded text-[10px] bg-white"
                      >
                        <option value="postgresql">PostgreSQL</option>
                        <option value="mysql">MySQL</option>
                        <option value="sqlite">SQLite</option>
                        <option value="mssql">SQL Server</option>
                        <option value="mongodb">MongoDB</option>
                      </select>
                    </div>
                    <input
                      value={activeNode.data.erEntity.tableName}
                      onChange={(e) =>
                        store.updateNodeData(activeNode.id, {
                          label: e.target.value,
                          erEntity: { ...activeNode.data.erEntity!, tableName: e.target.value },
                        })
                      }
                      className="w-full px-2 py-1 border rounded font-mono bg-white"
                      placeholder="table_name"
                    />
                    {activeNode.data.erEntity.columns.map((col, idx) => (
                      <div key={col.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          title="Toggle Primary Key"
                          onClick={() => {
                            const cols = [...activeNode.data.erEntity!.columns];
                            cols[idx] = { ...col, isPrimaryKey: !col.isPrimaryKey };
                            store.updateNodeData(activeNode.id, {
                              erEntity: { ...activeNode.data.erEntity!, columns: cols },
                            });
                          }}
                          className={`px-1 py-0.5 text-[9px] font-mono rounded border ${
                            col.isPrimaryKey ? 'bg-amber-100 border-amber-400 text-amber-900' : 'text-slate-400'
                          }`}
                        >
                          PK
                        </button>
                        <input
                          value={col.name}
                          onChange={(e) => {
                            const cols = [...activeNode.data.erEntity!.columns];
                            cols[idx] = { ...col, name: e.target.value };
                            store.updateNodeData(activeNode.id, {
                              erEntity: { ...activeNode.data.erEntity!, columns: cols },
                            });
                          }}
                          className="flex-1 min-w-0 px-1.5 py-0.5 border rounded font-mono bg-white"
                        />
                        <input
                          value={col.dataType}
                          onChange={(e) => {
                            const cols = [...activeNode.data.erEntity!.columns];
                            cols[idx] = { ...col, dataType: e.target.value };
                            store.updateNodeData(activeNode.id, {
                              erEntity: { ...activeNode.data.erEntity!, columns: cols },
                            });
                          }}
                          className="w-20 px-1 py-0.5 border rounded font-mono bg-white"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() =>
                        store.updateNodeData(activeNode.id, {
                          erEntity: {
                            ...activeNode.data.erEntity!,
                            columns: [
                              ...activeNode.data.erEntity!.columns,
                              { id: createId('c'), name: 'new_col', dataType: 'VARCHAR(128)', isNullable: true },
                            ],
                          },
                        })
                      }
                      className="w-full py-1 border border-dashed rounded text-[11px] text-blue-600 hover:bg-blue-50"
                    >
                      + Add Column
                    </button>
                  </div>
                )}

                {/* Technical Metadata */}
                <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--callisto-border)' }}>
                  <div className="font-semibold text-[11px] text-slate-600">Metadata</div>
                  <input
                    placeholder="Technology (e.g. FastAPI, Kafka)"
                    value={activeNode.data.metadata?.technology ?? ''}
                    onChange={(e) =>
                      store.updateNodeData(activeNode.id, {
                        sublabel: e.target.value || undefined,
                        metadata: { ...activeNode.data.metadata, technology: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border rounded bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  />
                  <input
                    placeholder="IP / Endpoint / Port"
                    value={activeNode.data.metadata?.ipAddress ?? ''}
                    onChange={(e) =>
                      store.updateNodeData(activeNode.id, {
                        metadata: { ...activeNode.data.metadata, ipAddress: e.target.value },
                      })
                    }
                    className="w-full px-2 py-1 border rounded bg-white font-mono"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  />
                  <input
                    placeholder="Hyperlink URL (Page / Docs)"
                    value={activeNode.data.hyperlink ?? ''}
                    onChange={(e) => store.updateNodeData(activeNode.id, { hyperlink: e.target.value })}
                    className="w-full px-2 py-1 border rounded bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  />
                </div>
              </>
            ) : activeEdge ? (
              <>
                <div className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">
                  Connector Properties
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Label</label>
                  <input
                    value={activeEdge.data?.label ?? ''}
                    onChange={(e) => store.updateEdgeData(activeEdge.id, { label: e.target.value })}
                    className="w-full px-2 py-1 rounded border bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Routing Style</label>
                  <select
                    value={activeEdge.data?.connectorType ?? 'orthogonal'}
                    onChange={(e) =>
                      store.updateEdgeData(activeEdge.id, { connectorType: e.target.value as ConnectorType })
                    }
                    className="w-full px-2 py-1 rounded border bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  >
                    <option value="orthogonal">Orthogonal</option>
                    <option value="straight">Straight</option>
                    <option value="curved">Curved</option>
                    <option value="elbow">Elbow</option>
                    <option value="bezier">Bezier</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-500">Start Marker</label>
                    <select
                      value={activeEdge.data?.arrowStart ?? 'none'}
                      onChange={(e) =>
                        store.updateEdgeData(activeEdge.id, { arrowStart: e.target.value as ArrowheadType })
                      }
                      className="w-full px-1.5 py-1 rounded border bg-white"
                    >
                      <option value="none">None</option>
                      <option value="arrow">Arrow</option>
                      <option value="filled-arrow">Filled Arrow</option>
                      <option value="open-diamond">Aggregation</option>
                      <option value="filled-diamond">Composition</option>
                      <option value="crows-foot-one">ER One (||)</option>
                      <option value="crows-foot-many">ER Many</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-500">End Marker</label>
                    <select
                      value={activeEdge.data?.arrowEnd ?? 'filled-arrow'}
                      onChange={(e) =>
                        store.updateEdgeData(activeEdge.id, { arrowEnd: e.target.value as ArrowheadType })
                      }
                      className="w-full px-1.5 py-1 rounded border bg-white"
                    >
                      <option value="none">None</option>
                      <option value="arrow">Arrow</option>
                      <option value="filled-arrow">Filled Arrow</option>
                      <option value="open-triangle">Generalization</option>
                      <option value="crows-foot-one">ER One (||)</option>
                      <option value="crows-foot-many">ER Many</option>
                      <option value="crows-foot-zero-many">ER Zero-Many</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">UML Relationship</label>
                  <select
                    value={activeEdge.data?.umlRelationship ?? 'association'}
                    onChange={(e) =>
                      store.updateEdgeData(activeEdge.id, {
                        umlRelationship: e.target.value as UMLRelationshipType,
                      })
                    }
                    className="w-full px-2 py-1 rounded border bg-white"
                  >
                    <option value="association">Association</option>
                    <option value="aggregation">Aggregation</option>
                    <option value="composition">Composition</option>
                    <option value="generalization">Generalization</option>
                    <option value="realization">Realization</option>
                    <option value="dependency">Dependency</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    placeholder="Source Mult (1)"
                    value={activeEdge.data?.sourceLabel ?? ''}
                    onChange={(e) => store.updateEdgeData(activeEdge.id, { sourceLabel: e.target.value })}
                    className="px-2 py-1 rounded border bg-white font-mono"
                  />
                  <input
                    placeholder="Target Mult (0..*)"
                    value={activeEdge.data?.targetLabel ?? ''}
                    onChange={(e) => store.updateEdgeData(activeEdge.id, { targetLabel: e.target.value })}
                    className="px-2 py-1 rounded border bg-white font-mono"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <div className="font-semibold uppercase text-[10px] tracking-wider text-slate-500">
                  Page Settings
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Diagram Type</label>
                  <select
                    value={page.diagramType}
                    onChange={(e) =>
                      store.updatePageSettings(page.id, { diagramType: e.target.value as DiagramType })
                    }
                    className="w-full px-2 py-1 rounded border bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  >
                    <option value="generic">Generic Diagram</option>
                    <option value="flowchart">Flowchart</option>
                    <option value="uml-class">UML Class</option>
                    <option value="uml-sequence">UML Sequence</option>
                    <option value="uml-usecase">UML Use Case</option>
                    <option value="uml-activity">UML Activity</option>
                    <option value="uml-state">UML State Machine</option>
                    <option value="er-diagram">Entity Relationship (ER)</option>
                    <option value="architecture">Software Architecture</option>
                    <option value="c4-context">C4 System Context</option>
                    <option value="c4-container">C4 Container</option>
                    <option value="network">Network Topology</option>
                    <option value="security">Cybersecurity</option>
                    <option value="bpmn">BPMN Process</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Canvas Mode</label>
                  <select
                    value={page.canvasMode}
                    onChange={(e) =>
                      store.updatePageSettings(page.id, {
                        canvasMode: e.target.value as 'infinite' | 'fixed',
                      })
                    }
                    className="w-full px-2 py-1 rounded border bg-white"
                    style={{ borderColor: 'var(--callisto-border)' }}
                  >
                    <option value="infinite">Infinite Canvas</option>
                    <option value="fixed">Fixed Page Boundaries</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500">
                  Select a node or connector on the canvas to inspect and edit its properties.
                </p>
              </div>
            )}
          </div>
        )}

        {/* LAYERS TAB */}
        {store.rightTab === 'layers' && (
          <div className="p-3 space-y-2.5 text-xs">
            <div className="flex gap-1">
              <input
                value={newLayerName}
                onChange={(e) => setNewLayerName(e.target.value)}
                placeholder="New layer name..."
                className="flex-1 px-2 py-1 border rounded bg-white"
                style={{ borderColor: 'var(--callisto-border)' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newLayerName.trim()) return;
                  store.addLayer(newLayerName.trim());
                  setNewLayerName('');
                }}
                className="px-2 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
              >
                Add
              </button>
            </div>

            <div className="space-y-1">
              {page.layers.map((layer) => (
                <div
                  key={layer.id}
                  onClick={() => store.setActiveLayer(layer.id)}
                  className={`px-2 py-1.5 rounded border flex items-center justify-between cursor-pointer ${
                    page.activeLayerId === layer.id
                      ? 'border-blue-600 bg-blue-50/50'
                      : 'bg-white'
                  }`}
                >
                  <span className="truncate font-medium">{layer.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        store.toggleLayerVisibility(layer.id);
                      }}
                      className="p-0.5 hover:text-blue-600"
                    >
                      {layer.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        store.toggleLayerLock(layer.id);
                      }}
                      className="p-0.5 hover:text-blue-600"
                    >
                      {layer.locked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CODE TAB */}
        {store.rightTab === 'code' && <CodeEditorPanel />}

        {/* VALIDATION TAB */}
        {store.rightTab === 'validation' && (
          <div className="p-3 space-y-2 text-xs">
            <div className="font-semibold text-[11px] text-slate-500 uppercase">
              Rule-Based Checks ({validationIssues.length})
            </div>
            {validationIssues.length === 0 ? (
              <div className="p-2.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-900">
                No structural issues detected for {page.diagramType}.
              </div>
            ) : (
              validationIssues.map((issue) => (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => {
                    if (issue.nodeId) {
                      store.replacePageGraph(
                        page.nodes.map((n) => ({ ...n, selected: n.id === issue.nodeId })),
                        page.edges,
                        false
                      );
                    }
                  }}
                  className="w-full text-left p-2 rounded border bg-white hover:border-blue-600 flex items-start gap-2"
                  style={{ borderColor: 'var(--callisto-border)' }}
                >
                  {issue.severity === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  ) : issue.severity === 'warning' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-medium">{issue.message}</div>
                    <div className="text-[10px] font-mono text-slate-400">{issue.rule}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* AI ASSISTANT TAB */}
        {store.rightTab === 'ai' && (
          <div className="p-3 space-y-3 text-xs">
            <div>
              <label className="block text-[10px] uppercase font-semibold text-slate-500 mb-1">
                Provider
              </label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value as typeof aiProvider)}
                className="w-full px-2 py-1 border rounded bg-white"
                style={{ borderColor: 'var(--callisto-border)' }}
              >
                <option value="local">Local Deterministic Synthesizer</option>
                <option value="gemini">Google Gemini (Backend Proxy)</option>
                <option value="groq">Groq API (Backend Proxy)</option>
                <option value="openrouter">OpenRouter (Backend Proxy)</option>
                <option value="ollama">Ollama Local (Backend Proxy)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] uppercase font-semibold text-slate-500">
                Text-to-Diagram
              </label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Create a UML class diagram for a banking application or RAG architecture..."
                className="w-full p-2 border rounded bg-white resize-none"
                style={{ borderColor: 'var(--callisto-border)' }}
              />
              <div className="flex gap-1.5">
                <button
                  type="button"
                  disabled={aiBusy}
                  onClick={() => void handleAIGenerate()}
                  className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
                >
                  {aiBusy ? 'Generating...' : 'Preview Diagram'}
                </button>
                <button
                  type="button"
                  onClick={() => setAiOutput(explainDiagramPage(page))}
                  className="px-2.5 py-1.5 rounded border hover:bg-slate-100"
                  style={{ borderColor: 'var(--callisto-border)' }}
                >
                  Explain
                </button>
              </div>
            </div>

            {aiPendingGraph && (
              <div className="p-2 rounded border border-blue-300 bg-blue-50 space-y-2">
                <div className="text-[11px] text-slate-700">
                  {aiPendingGraph.summary}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      store.replacePageGraph(
                        [...page.nodes, ...aiPendingGraph.nodes],
                        [...page.edges, ...aiPendingGraph.edges],
                        true
                      );
                      setAiPendingGraph(null);
                    }}
                    className="flex-1 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                  >
                    Append to Canvas
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiPendingGraph(null)}
                    className="px-2 py-1 rounded border bg-white text-slate-700"
                  >
                    Discard
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t space-y-1.5" style={{ borderColor: 'var(--callisto-border)' }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-semibold text-slate-500">
                  Code-to-Diagram (AST)
                </span>
                <select
                  value={aiCodeLang}
                  onChange={(e) => setAiCodeLang(e.target.value as typeof aiCodeLang)}
                  className="px-1.5 py-0.5 border rounded text-[10px] bg-white"
                >
                  <option value="python">Python</option>
                  <option value="typescript">TypeScript</option>
                  <option value="java">Java</option>
                  <option value="csharp">C#</option>
                  <option value="sql">SQL</option>
                </select>
              </div>
              <textarea
                rows={3}
                value={aiCodeInput}
                onChange={(e) => setAiCodeInput(e.target.value)}
                placeholder="Paste class definitions or CREATE TABLE SQL..."
                className="w-full p-2 border rounded font-mono text-[11px] bg-white resize-none"
                style={{ borderColor: 'var(--callisto-border)' }}
              />
              <button
                type="button"
                onClick={() => {
                  const res = parseCodeSnippetToDiagram(aiCodeInput, aiCodeLang, page.activeLayerId);
                  setAiPendingGraph({ nodes: res.nodes, edges: res.edges, summary: res.summary });
                  setAiOutput(res.summary);
                }}
                className="w-full py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white font-medium"
              >
                Extract Diagram (No Execution)
              </button>
            </div>

            {aiOutput && (
              <pre className="p-2 rounded border bg-white text-[11px] whitespace-pre-wrap font-sans">
                {aiOutput}
              </pre>
            )}
          </div>
        )}

        {/* COMMENTS TAB */}
        {store.rightTab === 'comments' && (
          <div className="p-3 space-y-2.5 text-xs">
            <div className="flex gap-1">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add review comment..."
                className="flex-1 px-2 py-1 border rounded bg-white"
                style={{ borderColor: 'var(--callisto-border)' }}
              />
              <button
                type="button"
                onClick={() => {
                  store.addComment(newComment, activeNode?.id);
                  setNewComment('');
                }}
                className="px-2.5 py-1 rounded bg-slate-700 text-white hover:bg-slate-800"
              >
                Post
              </button>
            </div>
            {project.comments.map((c) => (
              <div
                key={c.id}
                className={`p-2 rounded border ${c.resolved ? 'opacity-60' : ''} bg-white`}
                style={{ borderColor: 'var(--callisto-border)' }}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-semibold">{c.author}</span>
                  <button
                    type="button"
                    onClick={() => store.resolveComment(c.id)}
                    className="text-blue-600 hover:underline"
                  >
                    {c.resolved ? 'Reopen' : 'Resolve'}
                  </button>
                </div>
                <p className="mt-1">{c.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

