import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { DIAGRAM_TEMPLATES } from '../../data/templates';
import {
  exportPageToDrawioXML,
  exportPageToRasterDataUrl,
  exportProjectBundleZip,
  exportProjectToPDF,
  importDrawioXML,
  serializePageToSVG,
  triggerDownload,
} from '../../engines/exportEngine';
import { exportPageToCode, parseCodeToGraph } from '../../engines/codeEngine';
import { generateSQLFromNodes, parseSQLToERDiagram } from '../../engines/sqlEngine';
import type { DiagramProject, ERDialect } from '../../types/diagram';

export const WorkspaceModals: React.FC = () => {
  const store = useDiagramStore();
  const project = store.getActiveProject();
  const page = store.getActivePage();

  const [exportFormat, setExportFormat] = useState<
    'png' | 'jpeg' | 'svg' | 'pdf' | 'json' | 'mermaid' | 'plantuml' | 'dot' | 'drawio' | 'sql' | 'zip'
  >('svg');
  const [transparentBg, setTransparentBg] = useState(false);
  const [selectedOnly, setSelectedOnly] = useState(false);
  const [scale, setScale] = useState(2);

  const [importFormat, setImportFormat] = useState<'json' | 'drawio' | 'mermaid' | 'dot' | 'sql'>('sql');
  const [importText, setImportText] = useState('');
  const [importWarnings, setImportWarnings] = useState<string[]>([]);

  const [sqlDialect, setSqlDialect] = useState<ERDialect>('postgresql');
  const [sqlInput, setSqlInput] = useState('');
  const [versionLabel, setVersionLabel] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'commenter' | 'viewer'>('editor');
  const [inviteLink, setInviteLink] = useState('');

  if (!store.activeDialog) return null;

  const close = () => {
    setImportWarnings([]);
    store.setActiveDialog(null);
  };

  const handleExport = async () => {
    if (!project || !page) return;
    const base = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

    if (exportFormat === 'svg') {
      const svg = serializePageToSVG(page, { transparent: transparentBg, selectedOnly });
      triggerDownload(`${base}.svg`, svg, 'image/svg+xml');
    } else if (exportFormat === 'png' || exportFormat === 'jpeg') {
      const url = await exportPageToRasterDataUrl(page, exportFormat, scale, transparentBg);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${base}.${exportFormat}`;
      a.click();
    } else if (exportFormat === 'pdf') {
      const blob = await exportProjectToPDF(project);
      triggerDownload(`${project.name}.pdf`, blob, 'application/pdf');
    } else if (exportFormat === 'json') {
      triggerDownload(`${project.name}.callisto.json`, JSON.stringify(project, null, 2), 'application/json');
    } else if (exportFormat === 'drawio') {
      triggerDownload(`${base}.drawio`, exportPageToDrawioXML(page), 'application/xml');
    } else if (exportFormat === 'sql') {
      triggerDownload(`${base}.sql`, generateSQLFromNodes(page.nodes, sqlDialect), 'text/sql');
    } else if (exportFormat === 'zip') {
      const blob = await exportProjectBundleZip(project);
      triggerDownload(`${project.name}.zip`, blob, 'application/zip');
    } else {
      const ext = exportFormat === 'mermaid' ? 'mmd' : exportFormat === 'plantuml' ? 'puml' : 'dot';
      triggerDownload(`${base}.${ext}`, exportPageToCode(page, exportFormat));
    }
    close();
  };

  const handleImport = () => {
    if (!page || !importText.trim()) return;
    if (importFormat === 'json') {
      try {
        const parsed = JSON.parse(importText) as Partial<DiagramProject>;
        if (parsed.pages && parsed.pages.length > 0) {
          store.createProject(parsed.name || 'Imported Project', parsed.diagramType || 'generic', parsed.pages);
          close();
          return;
        }
        setImportWarnings(['Invalid Callisto JSON: missing pages array.']);
      } catch (e) {
        setImportWarnings([e instanceof Error ? e.message : 'Invalid JSON']);
      }
      return;
    }

    if (importFormat === 'drawio') {
      const res = importDrawioXML(importText, page.activeLayerId);
      setImportWarnings(res.warnings);
      if (res.nodes.length > 0) {
        store.replacePageGraph([...page.nodes, ...res.nodes], [...page.edges, ...res.edges]);
        close();
      }
      return;
    }

    if (importFormat === 'sql') {
      const res = parseSQLToERDiagram(importText, page.activeLayerId, sqlDialect);
      setImportWarnings(res.warnings);
      if (res.nodes.length > 0) {
        store.replacePageGraph([...page.nodes, ...res.nodes], [...page.edges, ...res.edges]);
        close();
      }
      return;
    }

    const res = parseCodeToGraph(importText, importFormat, page.activeLayerId);
    setImportWarnings(res.warnings);
    if (res.nodes.length > 0) {
      store.replacePageGraph([...page.nodes, ...res.nodes], [...page.edges, ...res.edges]);
      close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/45 flex items-center justify-center p-4">
      <div
        className="w-full max-w-xl rounded border shadow-xl overflow-hidden text-xs"
        style={{
          backgroundColor: 'var(--callisto-panel-bg)',
          borderColor: 'var(--callisto-border)',
        }}
      >
        <div
          className="px-4 py-2.5 border-b flex items-center justify-between font-semibold text-sm"
          style={{ borderColor: 'var(--callisto-border)' }}
        >
          <span>
            {store.activeDialog === 'export' && 'Export Diagram'}
            {store.activeDialog === 'import' && 'Import Diagram / Schema'}
            {store.activeDialog === 'templates' && 'Engineering Template Gallery'}
            {store.activeDialog === 'sql' && 'SQL DDL Generator & Safe Importer'}
            {store.activeDialog === 'versions' && 'Version History'}
            {store.activeDialog === 'share' && 'Share & Access Control'}
            {store.activeDialog === 'shortcuts' && 'Keyboard Shortcuts'}
          </span>
          <button type="button" onClick={close} className="p-1 rounded hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 max-h-[75vh] overflow-y-auto space-y-3">
          {store.activeDialog === 'export' && (
            <>
              <div>
                <label className="block font-medium mb-1">Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
                  className="w-full px-2.5 py-1.5 border rounded bg-white"
                >
                  <option value="svg">SVG (Vector)</option>
                  <option value="png">PNG (Raster)</option>
                  <option value="jpeg">JPEG (Raster)</option>
                  <option value="pdf">PDF (Multi-Page Document)</option>
                  <option value="json">Callisto JSON</option>
                  <option value="drawio">Draw.io XML</option>
                  <option value="mermaid">Mermaid (.mmd)</option>
                  <option value="plantuml">PlantUML (.puml)</option>
                  <option value="dot">Graphviz DOT (.dot)</option>
                  <option value="sql">SQL DDL (.sql)</option>
                  <option value="zip">Full Project Archive (.zip)</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} />
                  Transparent background
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={selectedOnly} onChange={(e) => setSelectedOnly(e.target.checked)} />
                  Selected objects only
                </label>
              </div>
              {(exportFormat === 'png' || exportFormat === 'jpeg') && (
                <div>
                  <label className="block font-medium mb-1">Resolution Scale</label>
                  <select value={scale} onChange={(e) => setScale(Number(e.target.value))} className="px-2 py-1 border rounded">
                    <option value={1}>1x (Standard)</option>
                    <option value={2}>2x (Retina / Print)</option>
                    <option value={3}>3x (High-DPI)</option>
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={close} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="button" onClick={() => void handleExport()} className="px-3 py-1.5 rounded bg-blue-600 text-white font-medium">
                  Download Export
                </button>
              </div>
            </>
          )}

          {store.activeDialog === 'import' && (
            <>
              <select
                value={importFormat}
                onChange={(e) => setImportFormat(e.target.value as typeof importFormat)}
                className="w-full px-2.5 py-1.5 border rounded bg-white"
              >
                <option value="sql">SQL CREATE TABLE Statements</option>
                <option value="drawio">Draw.io XML</option>
                <option value="mermaid">Mermaid Flowchart</option>
                <option value="dot">Graphviz DOT</option>
                <option value="json">Callisto JSON</option>
              </select>
              <textarea
                rows={8}
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste source or upload a file below..."
                className="w-full p-2 border rounded font-mono text-[11px] bg-white"
              />
              <input
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  void file.text().then(setImportText);
                }}
              />
              {importWarnings.map((w, i) => (
                <div key={i} className="p-2 rounded bg-amber-50 border border-amber-300 text-amber-900">{w}</div>
              ))}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={close} className="px-3 py-1.5 border rounded">Cancel</button>
                <button type="button" onClick={handleImport} className="px-3 py-1.5 rounded bg-blue-600 text-white font-medium">
                  Import into Canvas
                </button>
              </div>
            </>
          )}

          {store.activeDialog === 'templates' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DIAGRAM_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => {
                    store.createProject(tpl.name, tpl.diagramType, tpl.buildPages());
                    close();
                  }}
                  className="p-3 rounded border text-left hover:border-blue-600 bg-white"
                  style={{ borderColor: 'var(--callisto-border)' }}
                >
                  <div className="text-[10px] font-mono uppercase text-blue-600">{tpl.category}</div>
                  <div className="font-semibold text-xs mt-0.5">{tpl.name}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{tpl.description}</div>
                </button>
              ))}
            </div>
          )}

          {store.activeDialog === 'sql' && page && (
            <>
              <div className="flex items-center justify-between">
                <span className="font-medium">Target Dialect</span>
                <select
                  value={sqlDialect}
                  onChange={(e) => setSqlDialect(e.target.value as ERDialect)}
                  className="px-2 py-1 border rounded bg-white"
                >
                  <option value="postgresql">PostgreSQL</option>
                  <option value="mysql">MySQL</option>
                  <option value="sqlite">SQLite</option>
                  <option value="mssql">Microsoft SQL Server</option>
                  <option value="mongodb">MongoDB JSON Schema</option>
                </select>
              </div>
              <pre className="p-2.5 rounded border bg-slate-50 font-mono text-[11px] max-h-48 overflow-auto">
                {generateSQLFromNodes(page.nodes, sqlDialect)}
              </pre>
              <div className="pt-2 border-t space-y-2">
                <div className="font-medium">Parse CREATE TABLE SQL to ER Diagram (Never Executed)</div>
                <textarea
                  rows={4}
                  value={sqlInput}
                  onChange={(e) => setSqlInput(e.target.value)}
                  placeholder="CREATE TABLE orders (id UUID PRIMARY KEY, user_id UUID REFERENCES users(id));"
                  className="w-full p-2 border rounded font-mono text-[11px] bg-white"
                />
                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => triggerDownload(`${page.name}.sql`, generateSQLFromNodes(page.nodes, sqlDialect))}
                    className="px-3 py-1.5 border rounded"
                  >
                    Download .SQL
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const res = parseSQLToERDiagram(sqlInput, page.activeLayerId, sqlDialect);
                      if (res.nodes.length > 0) {
                        store.replacePageGraph([...page.nodes, ...res.nodes], [...page.edges, ...res.edges]);
                        close();
                      }
                    }}
                    className="px-3 py-1.5 rounded bg-blue-600 text-white font-medium"
                  >
                    Generate ER Diagram from SQL
                  </button>
                </div>
              </div>
            </>
          )}

          {store.activeDialog === 'versions' && project && (
            <>
              <div className="flex gap-2">
                <input
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  placeholder="Version name (e.g. v1.2 Architecture Freeze)"
                  className="flex-1 px-2.5 py-1.5 border rounded bg-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    store.createNamedVersion(versionLabel);
                    setVersionLabel('');
                  }}
                  className="px-3 py-1.5 rounded bg-slate-700 text-white font-medium"
                >
                  Save Snapshot
                </button>
              </div>
              <div className="space-y-1.5">
                {project.versions.length === 0 ? (
                  <p className="text-slate-500">No named snapshots yet.</p>
                ) : (
                  project.versions.map((v) => (
                    <div key={v.id} className="p-2 border rounded flex items-center justify-between">
                      <div>
                        <div className="font-medium">{v.label}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(v.createdAt).toLocaleString()} · {v.pages.length} page(s)
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          store.restoreVersion(v.id);
                          close();
                        }}
                        className="px-2.5 py-1 rounded border text-blue-600 hover:bg-blue-50"
                      >
                        Restore
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {store.activeDialog === 'share' && project && (
            <>
              <div className="flex items-center gap-2">
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                  className="px-2.5 py-1.5 border rounded bg-white"
                >
                  <option value="editor">Editor (Can edit diagrams)</option>
                  <option value="commenter">Commenter (View & comment)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="button"
                  onClick={() =>
                    setInviteLink(
                      `${window.location.origin}/?project=${project.id}&role=${inviteRole}&expires=${Date.now() + 86400000}`
                    )
                  }
                  className="px-3 py-1.5 rounded bg-blue-600 text-white font-medium"
                >
                  Generate 24h Invite Link
                </button>
              </div>
              {inviteLink && (
                <input
                  readOnly
                  value={inviteLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="w-full px-2.5 py-1.5 border rounded font-mono text-[11px] bg-slate-50"
                />
              )}
              <p className="text-[11px] text-slate-500">
                Real-time Yjs CRDT synchronization and role-based enforcement connect to the FastAPI WebSocket server when online.
              </p>
            </>
          )}

          {store.activeDialog === 'shortcuts' && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[11px]">
              {[
                ['V', 'Selection tool'],
                ['H', 'Pan tool'],
                ['T', 'Text tool'],
                ['R', 'Rectangle'],
                ['O', 'Ellipse'],
                ['L', 'Connector tool'],
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+Y', 'Redo'],
                ['Ctrl+C / V', 'Copy / Paste'],
                ['Ctrl+D', 'Duplicate'],
                ['Ctrl+A', 'Select all'],
                ['Ctrl+G / Shift+G', 'Group / Ungroup'],
                ['Ctrl+S', 'Save now'],
                ['Delete', 'Delete selected'],
                ['Escape', 'Clear selection'],
              ].map(([k, desc]) => (
                <div key={k} className="flex justify-between border-b py-1" style={{ borderColor: 'var(--callisto-border)' }}>
                  <span className="font-semibold text-slate-800">{k}</span>
                  <span className="text-slate-500 font-sans">{desc}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

