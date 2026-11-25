import React, { useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  type EdgeProps,
} from '@xyflow/react';
import type { ArrowheadType, CallistoEdge as CallistoEdgeType } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';

function markerUrl(type?: ArrowheadType): string | undefined {
  if (!type || type === 'none') return undefined;
  return `url(#callisto-${type})`;
}

export const CallistoEdge: React.FC<EdgeProps<CallistoEdgeType>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}) => {
  const updateEdgeData = useDiagramStore((s) => s.updateEdgeData);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? '');

  const connectorType = data?.connectorType ?? 'orthogonal';
  const lineStyle = data?.lineStyle ?? 'solid';
  const strokeColor = selected ? '#2563EB' : data?.strokeColor ?? '#334155';
  const strokeWidth = data?.strokeWidth ?? 1.5;

  let edgePath = '';
  let labelX = 0;
  let labelY = 0;

  if (connectorType === 'straight') {
    [edgePath, labelX, labelY] = getStraightPath({ sourceX, sourceY, targetX, targetY });
  } else if (connectorType === 'curved' || connectorType === 'bezier') {
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: connectorType === 'elbow' ? 0 : 8,
    });
  }

  const strokeDasharray =
    lineStyle === 'dashed' ? '6 4' : lineStyle === 'dotted' ? '2 3' : undefined;

  const commit = () => {
    setEditing(false);
    updateEdgeData(id, { label: draft });
  };

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerStart={markerUrl(data?.arrowStart)}
        markerEnd={markerUrl(data?.arrowEnd)}
        style={{
          stroke: strokeColor,
          strokeWidth: selected ? strokeWidth + 0.6 : strokeWidth,
          strokeDasharray,
        }}
      />

      <EdgeLabelRenderer>
        {(data?.label || editing || selected) && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setDraft(data?.label ?? '');
              setEditing(true);
            }}
          >
            {editing ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === 'Escape') commit();
                }}
                className="px-1.5 py-0.5 text-[11px] bg-white border border-blue-600 rounded shadow-sm outline-none w-28 text-center"
              />
            ) : data?.label ? (
              <span className="px-1.5 py-0.5 text-[11px] bg-white/95 border border-slate-300 rounded text-slate-800 shadow-xs">
                {data.label}
              </span>
            ) : selected ? (
              <button
                type="button"
                onClick={() => {
                  setDraft('');
                  setEditing(true);
                }}
                className="px-1.5 py-0.5 text-[10px] bg-blue-50 border border-blue-300 rounded text-blue-700 hover:bg-blue-100"
              >
                + Label
              </button>
            ) : null}
          </div>
        )}

        {data?.sourceLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.14}px,${sourceY + (targetY - sourceY) * 0.14 - 12}px)`,
            }}
            className="text-[10px] font-mono bg-white/85 px-1 rounded text-slate-700 pointer-events-none"
          >
            {data.sourceLabel}
          </div>
        )}

        {data?.targetLabel && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${sourceX + (targetX - sourceX) * 0.86}px,${sourceY + (targetY - sourceY) * 0.86 - 12}px)`,
            }}
            className="text-[10px] font-mono bg-white/85 px-1 rounded text-slate-700 pointer-events-none"
          >
            {data.targetLabel}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
};

