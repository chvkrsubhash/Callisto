import React from 'react';
import {
  Activity,
  AlertTriangle,
  Box,
  Cloud,
  Cpu,
  Database,
  FileText,
  Flame,
  Globe,
  HardDrive,
  KeyRound,
  Layers,
  Lock,
  Monitor,
  Network,
  Radio,
  Router,
  Server,
  Shield,
  ShieldAlert,
  Smartphone,
  Terminal,
  User,
  Webhook,
  Workflow,
  Zap,
} from 'lucide-react';
import type { CallistoNodeData } from '../../types/diagram';

interface ShapeRendererProps {
  data: CallistoNodeData;
  width: number;
  height: number;
  isEditing: boolean;
  draftLabel: string;
  onDraftChange: (val: string) => void;
  onCommitEdit: () => void;
}

const DASH_MAP: Record<CallistoNodeData['strokeStyle'], string | undefined> = {
  solid: undefined,
  dashed: '6 4',
  dotted: '2 3',
};

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  data,
  width,
  height,
  isEditing,
  draftLabel,
  onDraftChange,
  onCommitEdit,
}) => {
  const { shapeKind, fill, stroke, strokeWidth, strokeStyle, textColor, fontSize, fontWeight, textAlign } = data;
  const dashArray = DASH_MAP[strokeStyle];

  const labelElement = isEditing ? (
    <input
      autoFocus
      value={draftLabel}
      onChange={(e) => onDraftChange(e.target.value)}
      onBlur={onCommitEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommitEdit();
        if (e.key === 'Escape') onCommitEdit();
      }}
      className="nodrag nowheel w-full bg-white/95 border border-blue-600 rounded px-1.5 py-0.5 text-center outline-none"
      style={{ color: textColor, fontSize }}
    />
  ) : (
    <div
      className="w-full break-words leading-tight select-none"
      style={{
        color: textColor,
        fontSize,
        fontWeight:
          fontWeight === 'bold'
            ? 700
            : fontWeight === 'semibold'
              ? 600
              : fontWeight === 'medium'
                ? 500
                : 400,
        textAlign,
      }}
    >
      {data.label}
      {data.sublabel && (
        <div className="text-[10px] opacity-75 font-normal mt-0.5">{data.sublabel}</div>
      )}
    </div>
  );

  // UML Class / Interface / Enum structured compartment renderer
  if (shapeKind === 'uml-class' || shapeKind === 'uml-interface' || shapeKind === 'uml-enum') {
    const uml = data.umlClass;
    return (
      <div
        className="w-full h-full flex flex-col overflow-hidden text-left"
        style={{
          backgroundColor: fill,
          border: `${strokeWidth}px ${strokeStyle} ${stroke}`,
          color: textColor,
        }}
      >
        <div
          className="px-2.5 py-1.5 border-b flex flex-col items-center justify-center"
          style={{ borderColor: stroke, backgroundColor: 'rgba(241, 245, 249, 0.7)' }}
        >
          {uml?.stereotype && (
            <span className="text-[10px] tracking-wide text-slate-500 font-mono">
              «{uml.stereotype}»
            </span>
          )}
          <div className={`w-full text-center font-semibold text-xs ${uml?.isAbstract ? 'italic' : ''}`}>
            {isEditing ? labelElement : data.label}
          </div>
        </div>

        <div className="px-2 py-1 border-b text-[11px] font-mono space-y-0.5 overflow-y-auto flex-1" style={{ borderColor: stroke }}>
          {(uml?.attributes ?? []).length === 0 ? (
            <div className="text-slate-400 italic text-[10px]">no attributes</div>
          ) : (
            uml?.attributes.map((attr) => (
              <div key={attr.id} className={`truncate ${attr.isStatic ? 'underline' : ''}`}>
                <span className="text-slate-500 mr-1">{attr.visibility}</span>
                <span>{attr.name}</span>
                {attr.type && <span className="text-slate-500">: {attr.type}</span>}
              </div>
            ))
          )}
        </div>

        {shapeKind !== 'uml-enum' && (
          <div className="px-2 py-1 text-[11px] font-mono space-y-0.5 overflow-y-auto flex-1">
            {(uml?.methods ?? []).length === 0 ? (
              <div className="text-slate-400 italic text-[10px]">no methods</div>
            ) : (
              uml?.methods.map((m) => (
                <div
                  key={m.id}
                  className={`truncate ${m.isAbstract ? 'italic' : ''} ${m.isStatic ? 'underline' : ''}`}
                >
                  <span className="text-slate-500 mr-1">{m.visibility}</span>
                  <span>
                    {m.name}({m.params})
                  </span>
                  {m.returnType && <span className="text-slate-500">: {m.returnType}</span>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    );
  }

  // ER Table & MongoDB Document structured renderer
  if (shapeKind === 'er-table' || shapeKind === 'er-document') {
    const er = data.erEntity;
    return (
      <div
        className="w-full h-full flex flex-col overflow-hidden text-left"
        style={{
          backgroundColor: fill,
          border: `${strokeWidth}px ${strokeStyle} ${stroke}`,
          color: textColor,
        }}
      >
        <div
          className="px-2.5 py-1.5 border-b flex items-center justify-between gap-2"
          style={{
            borderColor: stroke,
            backgroundColor: shapeKind === 'er-document' ? '#DCFCE7' : '#E2E8F0',
          }}
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <Database className="w-3.5 h-3.5 shrink-0 text-slate-700" />
            <span className="font-semibold text-xs truncate">
              {isEditing ? labelElement : er?.tableName || data.label}
            </span>
          </div>
          <span className="text-[9px] uppercase font-mono px-1 py-0.5 rounded bg-white/80 text-slate-600 border border-slate-300">
            {er?.dialect ?? 'pg'}
          </span>
        </div>
        <div className="divide-y divide-slate-200 overflow-y-auto flex-1 text-[11px] font-mono">
          {(er?.columns ?? []).map((col) => (
            <div key={col.id} className="px-2 py-0.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 min-w-0">
                {col.isPrimaryKey && (
                  <span className="text-[9px] font-bold px-1 rounded bg-amber-100 text-amber-800 border border-amber-300">
                    PK
                  </span>
                )}
                {col.isForeignKey && (
                  <span className="text-[9px] font-bold px-1 rounded bg-blue-100 text-blue-800 border border-blue-300">
                    FK
                  </span>
                )}
                <span className="truncate">{col.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 shrink-0">{col.dataType}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // UML Lifeline
  if (shapeKind === 'uml-lifeline') {
    return (
      <div className="w-full h-full flex flex-col items-center">
        <div
          className="w-full px-2 py-2 border text-center"
          style={{
            backgroundColor: fill,
            borderColor: stroke,
            borderWidth: strokeWidth,
          }}
        >
          {labelElement}
        </div>
        <div
          className="flex-1 w-0 border-l-2 border-dashed"
          style={{ borderColor: stroke }}
        />
      </div>
    );
  }

  // UML Actor
  if (shapeKind === 'uml-actor') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-between py-1">
        <svg viewBox="0 0 60 80" className="w-12 h-16 overflow-visible">
          <circle cx="30" cy="14" r="10" fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="30" y1="24" x2="30" y2="54" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="10" y1="36" x2="50" y2="36" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="30" y1="54" x2="14" y2="76" stroke={stroke} strokeWidth={strokeWidth} />
          <line x1="30" y1="54" x2="46" y2="76" stroke={stroke} strokeWidth={strokeWidth} />
        </svg>
        <div className="w-full text-center px-1">{labelElement}</div>
      </div>
    );
  }

  // Zone / Boundary / Swimlane / Package / Fragment containers
  if (
    shapeKind === 'zone-boundary' ||
    shapeKind === 'swimlane' ||
    shapeKind === 'uml-package' ||
    shapeKind === 'uml-fragment' ||
    shapeKind === 'bpmn-pool'
  ) {
    return (
      <div
        className="w-full h-full flex flex-col overflow-hidden"
        style={{
          backgroundColor: fill,
          border: `${strokeWidth}px ${shapeKind === 'zone-boundary' ? 'dashed' : strokeStyle} ${stroke}`,
        }}
      >
        <div
          className="px-2.5 py-1 border-b text-xs font-semibold flex items-center gap-1.5"
          style={{
            borderColor: stroke,
            backgroundColor: 'rgba(226, 232, 240, 0.5)',
            color: textColor,
          }}
        >
          {shapeKind === 'uml-fragment' && (
            <span className="font-mono text-[10px] px-1 bg-slate-700 text-white">alt</span>
          )}
          <div className="flex-1 text-left">{labelElement}</div>
        </div>
      </div>
    );
  }

  // Pure SVG geometric / flowchart / BPMN shapes
  const renderSvgShape = () => {
    const w = Math.max(width, 24);
    const h = Math.max(height, 24);
    const pad = strokeWidth;
    const iw = w - pad * 2;
    const ih = h - pad * 2;

    switch (shapeKind) {
      case 'circle':
      case 'ellipse':
      case 'uml-usecase':
      case 'fc-connector':
      case 'bpmn-start':
      case 'bpmn-intermediate':
      case 'bpmn-end': {
        const sw = shapeKind === 'bpmn-end' ? strokeWidth * 2.2 : strokeWidth;
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <ellipse
              cx={w / 2}
              cy={h / 2}
              rx={iw / 2}
              ry={ih / 2}
              fill={fill}
              stroke={stroke}
              strokeWidth={sw}
              strokeDasharray={dashArray}
            />
            {shapeKind === 'bpmn-intermediate' && (
              <ellipse
                cx={w / 2}
                cy={h / 2}
                rx={Math.max(4, iw / 2 - 4)}
                ry={Math.max(4, ih / 2 - 4)}
                fill="none"
                stroke={stroke}
                strokeWidth={1.2}
              />
            )}
          </svg>
        );
      }

      case 'uml-initial':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <circle cx={w / 2} cy={h / 2} r={Math.min(iw, ih) / 2} fill={fill} />
          </svg>
        );

      case 'uml-final':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <circle cx={w / 2} cy={h / 2} r={Math.min(iw, ih) / 2} fill="#fff" stroke={stroke} strokeWidth={1.5} />
            <circle cx={w / 2} cy={h / 2} r={Math.max(4, Math.min(iw, ih) / 2 - 5)} fill={stroke} />
          </svg>
        );

      case 'diamond':
      case 'fc-decision':
      case 'bpmn-gateway-xor':
      case 'bpmn-gateway-and':
      case 'bpmn-gateway-or':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${w / 2},${pad} ${w - pad},${h / 2} ${w / 2},${h - pad} ${pad},${h / 2}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
          </svg>
        );

      case 'triangle':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${w / 2},${pad} ${w - pad},${h - pad} ${pad},${h - pad}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
          </svg>
        );

      case 'hexagon':
      case 'fc-preparation':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${w * 0.16},${pad} ${w * 0.84},${pad} ${w - pad},${h / 2} ${w * 0.84},${h - pad} ${w * 0.16},${h - pad} ${pad},${h / 2}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={dashArray}
            />
          </svg>
        );

      case 'pentagon':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${w / 2},${pad} ${w - pad},${h * 0.38} ${w * 0.8},${h - pad} ${w * 0.2},${h - pad} ${pad},${h * 0.38}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'star': {
        const cx = w / 2;
        const cy = h / 2;
        const rOuter = Math.min(iw, ih) / 2;
        const rInner = rOuter * 0.42;
        const pts: string[] = [];
        for (let i = 0; i < 10; i += 1) {
          const r = i % 2 === 0 ? rOuter : rInner;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
        }
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon points={pts.join(' ')} fill={fill} stroke={stroke} strokeWidth={strokeWidth} />
          </svg>
        );
      }

      case 'callout':
      case 'uml-note':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${pad},${pad} ${w - 16},${pad} ${w - pad},${pad + 16} ${w - pad},${h - pad} ${pad},${h - pad}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <polyline
              points={`${w - 16},${pad} ${w - 16},${pad + 16} ${w - pad},${pad + 16}`}
              fill="none"
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'speech-bubble':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <path
              d={`M ${pad},${pad} H ${w - pad} V ${h - 18} H ${w * 0.36} L ${w * 0.2},${h - pad} L ${w * 0.24},${h - 18} H ${pad} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'fc-delay':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <path
              d={`M ${pad},${pad} H ${w * 0.62} A ${w * 0.36} ${ih / 2} 0 0 1 ${w * 0.62},${h - pad} H ${pad} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'fc-manual':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${pad},${pad} ${w - pad},${pad} ${w * 0.85},${h - pad} ${w * 0.15},${h - pad}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'fc-offpage':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${pad},${pad} ${w - pad},${pad} ${w - pad},${h * 0.65} ${w / 2},${h - pad} ${pad},${h * 0.65}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'fc-io':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${w * 0.14},${pad} ${w - pad},${pad} ${w * 0.86},${h - pad} ${pad},${h - pad}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'cylinder':
      case 'sw-database':
      case 'cloud-db':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <path
              d={`M ${pad},${h * 0.18} A ${iw / 2} ${h * 0.12} 0 0 1 ${w - pad},${h * 0.18} L ${w - pad},${h * 0.82} A ${iw / 2} ${h * 0.12} 0 0 1 ${pad},${h * 0.82} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
            <ellipse
              cx={w / 2}
              cy={h * 0.18}
              rx={iw / 2}
              ry={h * 0.12}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'document':
      case 'fc-multi-doc':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <path
              d={`M ${pad},${pad} H ${w - pad} V ${h * 0.8} Q ${w * 0.75},${h * 0.7} ${w * 0.5},${h * 0.82} Q ${w * 0.25},${h * 0.94} ${pad},${h * 0.84} Z`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'arrow-right':
        return (
          <svg width={w} height={h} className="absolute inset-0">
            <polygon
              points={`${pad},${h * 0.28} ${w * 0.68},${h * 0.28} ${w * 0.68},${pad} ${w - pad},${h / 2} ${w * 0.68},${h - pad} ${w * 0.68},${h * 0.72} ${pad},${h * 0.72}`}
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth}
            />
          </svg>
        );

      case 'cloud':
      case 'net-internet':
        return (
          <svg width={w} height={h} viewBox="0 0 140 84" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <path
              d="M34 68 H108 C121 68 130 59 130 47 C130 36 122 27 111 26 C107 13 94 6 80 8 C68 9 59 16 55 26 C49 23 42 23 36 27 C24 28 14 38 14 50 C14 60 23 68 34 68 Z"
              fill={fill}
              stroke={stroke}
              strokeWidth={strokeWidth * 1.1}
            />
          </svg>
        );

      default:
        return null;
    }
  };

  const svgOverlay = renderSvgShape();

  // Icon badge for technical shapes
  const icon = getTechnicalIcon(shapeKind);

  if (svgOverlay) {
    return (
      <div className="relative w-full h-full flex items-center justify-center p-3">
        {svgOverlay}
        <div className="relative z-10 w-full flex flex-col items-center justify-center text-center">
          {shapeKind === 'bpmn-gateway-xor' && <span className="font-bold text-base">×</span>}
          {shapeKind === 'bpmn-gateway-and' && <span className="font-bold text-base">+</span>}
          {shapeKind === 'bpmn-gateway-or' && <span className="font-bold text-base">○</span>}
          {shapeKind !== 'uml-initial' &&
            shapeKind !== 'uml-final' &&
            shapeKind !== 'bpmn-start' &&
            shapeKind !== 'bpmn-intermediate' &&
            shapeKind !== 'bpmn-end' &&
            !shapeKind.startsWith('bpmn-gateway-') &&
            labelElement}
        </div>
      </div>
    );
  }

  const isRounded =
    shapeKind === 'rounded-rect' ||
    shapeKind === 'fc-start-end' ||
    shapeKind === 'uml-state' ||
    shapeKind === 'bpmn-task' ||
    shapeKind === 'bpmn-subprocess';

  const borderRadius =
    shapeKind === 'fc-start-end'
      ? 9999
      : isRounded
        ? 8
        : shapeKind === 'text'
          ? 0
          : 3;

  return (
    <div
      className="w-full h-full flex items-center justify-center px-3 py-2 relative overflow-hidden"
      style={{
        backgroundColor: shapeKind === 'text' ? 'transparent' : fill,
        border:
          shapeKind === 'text'
            ? 'none'
            : `${strokeWidth}px ${strokeStyle} ${stroke}`,
        borderRadius,
      }}
    >
      {shapeKind === 'fc-predefined' && (
        <>
          <div className="absolute inset-y-0 left-2.5 w-px" style={{ backgroundColor: stroke }} />
          <div className="absolute inset-y-0 right-2.5 w-px" style={{ backgroundColor: stroke }} />
        </>
      )}
      <div className="flex items-center gap-2 w-full justify-center">
        {icon && <span className="shrink-0 text-slate-600">{icon}</span>}
        <div className="min-w-0 flex-1">{labelElement}</div>
      </div>
    </div>
  );
};

function getTechnicalIcon(kind: CallistoNodeData['shapeKind']): React.ReactNode {
  const cls = 'w-4 h-4';
  if (kind === 'sw-application' || kind === 'sw-browser') return <Monitor className={cls} />;
  if (kind === 'sw-service' || kind === 'sw-microservice') return <Box className={cls} />;
  if (kind === 'sw-api' || kind === 'sw-apigateway') return <Webhook className={cls} />;
  if (kind === 'sw-cache') return <Zap className={cls} />;
  if (kind === 'sw-queue' || kind === 'cloud-queue') return <Layers className={cls} />;
  if (kind === 'sw-eventbus') return <Radio className={cls} />;
  if (kind === 'sw-loadbalancer') return <Network className={cls} />;
  if (kind === 'sw-container' || kind === 'cloud-container') return <Box className={cls} />;
  if (kind === 'sw-vm' || kind === 'sw-server' || kind === 'cloud-compute') return <Server className={cls} />;
  if (kind === 'sw-client') return <User className={cls} />;
  if (kind === 'sw-mobile') return <Smartphone className={cls} />;
  if (kind === 'net-router') return <Router className={cls} />;
  if (kind === 'net-switch' || kind === 'net-gateway' || kind === 'net-proxy') return <Network className={cls} />;
  if (kind === 'net-firewall') return <Flame className={cls} />;
  if (kind === 'net-dns') return <Globe className={cls} />;
  if (kind === 'net-vpn') return <Lock className={cls} />;
  if (kind === 'net-nas' || kind === 'cloud-storage') return <HardDrive className={cls} />;
  if (kind === 'sec-soc' || kind === 'sec-siem' || kind === 'sec-monitoring' || kind === 'cloud-monitor')
    return <Activity className={cls} />;
  if (kind === 'sec-ids' || kind === 'sec-ips' || kind === 'sec-gateway') return <ShieldAlert className={cls} />;
  if (kind === 'sec-endpoint' || kind === 'sec-scanner') return <Shield className={cls} />;
  if (kind === 'sec-auth' || kind === 'sec-idp' || kind === 'cloud-iam') return <KeyRound className={cls} />;
  if (kind === 'sec-honeypot' || kind === 'sec-threatintel') return <AlertTriangle className={cls} />;
  if (kind === 'cloud-serverless') return <Terminal className={cls} />;
  if (kind === 'cloud-cdn') return <Cloud className={cls} />;
  if (kind === 'cloud-network') return <Cpu className={cls} />;
  if (kind === 'bpmn-task' || kind === 'bpmn-subprocess') return <Workflow className={cls} />;
  if (kind === 'bpmn-data') return <FileText className={cls} />;
  return null;
}

