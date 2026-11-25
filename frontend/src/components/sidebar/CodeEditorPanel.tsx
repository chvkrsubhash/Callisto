import React, { useEffect, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers } from '@codemirror/view';
import { defaultKeymap } from '@codemirror/commands';
import { json } from '@codemirror/lang-json';
import { Check, Copy, Download, Play } from 'lucide-react';
import { useDiagramStore } from '../../store/diagramStore';
import { exportPageToCode, parseCodeToGraph, type CodeFormat } from '../../engines/codeEngine';
import { triggerDownload } from '../../engines/exportEngine';

export const CodeEditorPanel: React.FC = () => {
  const store = useDiagramStore();
  const page = store.getActivePage();
  const [format, setFormat] = useState<CodeFormat>('mermaid');
  const [source, setSource] = useState('');
  const [warnings, setWarnings] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const editorHostRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!page) return;
    setSource(exportPageToCode(page, format));
  }, [page?.id, page?.nodes.length, page?.edges.length, format]);

  useEffect(() => {
    if (!editorHostRef.current) return;
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: source,
      extensions: [
        lineNumbers(),
        keymap.of(defaultKeymap),
        ...(format === 'json' ? [json()] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setSource(update.state.doc.toString());
          }
        }),
        EditorView.theme({
          '&': { height: '260px', fontSize: '11px', border: '1px solid #CBD5E1', borderRadius: '4px' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    });

    const view = new EditorView({ state, parent: editorHostRef.current });
    viewRef.current = view;
    return () => view.destroy();
  }, [format, page?.id]);

  if (!page) return null;

  const handleApplyToCanvas = () => {
    try {
      const res = parseCodeToGraph(source, format, page.activeLayerId);
      setWarnings(res.warnings);
      if (res.nodes.length > 0) {
        store.replacePageGraph(res.nodes, res.edges, true);
      }
    } catch (err) {
      setWarnings([err instanceof Error ? err.message : 'Failed to parse source code.']);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(source);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-2.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-1">
        <select
          value={format}
          onChange={(e) => setFormat(e.target.value as CodeFormat)}
          className="px-2 py-1 rounded border text-xs bg-white"
          style={{ borderColor: 'var(--callisto-border)' }}
        >
          <option value="mermaid">Mermaid</option>
          <option value="plantuml">PlantUML</option>
          <option value="dot">Graphviz DOT</option>
          <option value="json">Callisto JSON</option>
        </select>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void handleCopy()}
            title="Copy Source"
            className="p-1 rounded border hover:bg-slate-100"
            style={{ borderColor: 'var(--callisto-border)' }}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => {
              const ext = format === 'mermaid' ? 'mmd' : format === 'plantuml' ? 'puml' : format;
              triggerDownload(`${page.name}.${ext}`, source);
            }}
            title="Download Source"
            className="p-1 rounded border hover:bg-slate-100"
            style={{ borderColor: 'var(--callisto-border)' }}
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div ref={editorHostRef} />

      <button
        type="button"
        onClick={handleApplyToCanvas}
        className="w-full py-1.5 rounded bg-slate-700 hover:bg-slate-800 text-white font-medium flex items-center justify-center gap-1.5"
      >
        <Play className="w-3.5 h-3.5" /> Convert Source to Editable Canvas
      </button>

      {warnings.length > 0 && (
        <div className="p-2 rounded bg-amber-50 border border-amber-300 text-amber-900 text-[11px] space-y-0.5">
          {warnings.map((w, i) => (
            <div key={i}>{w}</div>
          ))}
        </div>
      )}
    </div>
  );
};

