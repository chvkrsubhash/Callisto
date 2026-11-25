import React, { useState } from 'react';
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';
import { ExternalLink, Lock } from 'lucide-react';
import type { CallistoNode as CallistoNodeType } from '../../types/diagram';
import { useDiagramStore } from '../../store/diagramStore';
import { ShapeRenderer } from './ShapeRenderer';

export const CallistoNode: React.FC<NodeProps<CallistoNodeType>> = ({
  id,
  data,
  selected,
  width,
  height,
}) => {
  const updateNodeData = useDiagramStore((s) => s.updateNodeData);
  const [isEditing, setIsEditing] = useState(false);
  const [draftLabel, setDraftLabel] = useState(data.label);

  const w = width ?? 140;
  const h = height ?? 72;

  const commitEdit = () => {
    setIsEditing(false);
    if (draftLabel.trim() !== data.label) {
      updateNodeData(id, { label: draftLabel.trim() || data.label });
    }
  };

  return (
    <div
      className="relative w-full h-full group"
      style={{
        transform: data.rotation ? `rotate(${data.rotation}deg)` : undefined,
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!data.locked) {
          setDraftLabel(data.label);
          setIsEditing(true);
        }
      }}
    >
      <NodeResizer
        isVisible={selected && !data.locked}
        minWidth={28}
        minHeight={24}
        lineClassName="!border-blue-600"
        handleClassName="!w-2 !h-2 !bg-white !border-blue-600 !rounded-none"
      />

      {/* 4-direction connection ports */}
      <Handle type="target" position={Position.Top} id="top-t" />
      <Handle type="source" position={Position.Top} id="top-s" />
      <Handle type="target" position={Position.Right} id="right-t" />
      <Handle type="source" position={Position.Right} id="right-s" />
      <Handle type="target" position={Position.Bottom} id="bottom-t" />
      <Handle type="source" position={Position.Bottom} id="bottom-s" />
      <Handle type="target" position={Position.Left} id="left-t" />
      <Handle type="source" position={Position.Left} id="left-s" />

      <ShapeRenderer
        data={data}
        width={w}
        height={h}
        isEditing={isEditing}
        draftLabel={draftLabel}
        onDraftChange={setDraftLabel}
        onCommitEdit={commitEdit}
      />

      {data.locked && (
        <div
          title="Locked"
          className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-slate-700 text-white flex items-center justify-center shadow"
        >
          <Lock className="w-2.5 h-2.5" />
        </div>
      )}

      {data.hyperlink && (
        <a
          href={data.hyperlink}
          target="_blank"
          rel="noreferrer"
          title={data.hyperlink}
          onClick={(e) => e.stopPropagation()}
          className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow hover:bg-blue-700"
        >
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      )}
    </div>
  );
};

