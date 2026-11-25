import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import type { CallistoEdge, CallistoNode, DiagramPage, DiagramProject } from '../types/diagram';
import { createId } from '../utils/ids';
import { buildNodeFromShape } from '../store/diagramStore';
import { exportPageToCode } from './codeEngine';
import { generateSQLFromNodes } from './sqlEngine';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function serializePageToSVG(
  page: DiagramPage,
  options: { transparent?: boolean; selectedOnly?: boolean } = {}
): string {
  const nodes = options.selectedOnly
    ? page.nodes.filter((n) => n.selected)
    : page.nodes;
  const nodeIds = new Set(nodes.map((n) => n.id));
  const edges = options.selectedOnly
    ? page.edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    : page.edges;

  const minX = nodes.length > 0 ? Math.min(...nodes.map((n) => n.position.x)) - 40 : 0;
  const minY = nodes.length > 0 ? Math.min(...nodes.map((n) => n.position.y)) - 40 : 0;
  const maxX =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.position.x + ((n.width as number) || 140))) + 40
      : 800;
  const maxY =
    nodes.length > 0
      ? Math.max(...nodes.map((n) => n.position.y + ((n.height as number) || 72))) + 40
      : 600;

  const width = Math.max(400, Math.round(maxX - minX));
  const height = Math.max(300, Math.round(maxY - minY));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const svgParts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${minX} ${minY} ${width} ${height}">`,
    `<defs><marker id="svg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 1 L 10 5 L 0 9 z" fill="#334155"/></marker></defs>`,
  ];

  if (!options.transparent) {
    svgParts.push(
      `<rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="${escapeXml(page.background || '#FFFFFF')}"/>`
    );
  }

  for (const edge of edges) {
    const src = nodeMap.get(edge.source);
    const tgt = nodeMap.get(edge.target);
    if (!src || !tgt) continue;
    const sx = src.position.x + ((src.width as number) || 140) / 2;
    const sy = src.position.y + ((src.height as number) || 72) / 2;
    const tx = tgt.position.x + ((tgt.width as number) || 140) / 2;
    const ty = tgt.position.y + ((tgt.height as number) || 72) / 2;
    const dash =
      edge.data?.lineStyle === 'dashed'
        ? ' stroke-dasharray="6 4"'
        : edge.data?.lineStyle === 'dotted'
          ? ' stroke-dasharray="2 3"'
          : '';
    svgParts.push(
      `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="${escapeXml(edge.data?.strokeColor || '#334155')}" stroke-width="${edge.data?.strokeWidth || 1.5}"${dash} marker-end="url(#svg-arrow)"/>`
    );
    if (edge.data?.label) {
      svgParts.push(
        `<text x="${(sx + tx) / 2}" y="${(sy + ty) / 2 - 6}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="11" fill="#1E293B">${escapeXml(edge.data.label)}</text>`
      );
    }
  }

  for (const node of nodes) {
    const x = node.position.x;
    const y = node.position.y;
    const w = (node.width as number) || 140;
    const h = (node.height as number) || 72;
    const fill = node.data.fill === 'transparent' ? 'none' : escapeXml(node.data.fill);
    const stroke = node.data.stroke === 'transparent' ? 'none' : escapeXml(node.data.stroke);
    const sw = node.data.strokeWidth || 1.5;
    const dash =
      node.data.strokeStyle === 'dashed'
        ? ' stroke-dasharray="6 4"'
        : node.data.strokeStyle === 'dotted'
          ? ' stroke-dasharray="2 3"'
          : '';
    const rot = node.data.rotation
      ? ` transform="rotate(${node.data.rotation} ${x + w / 2} ${y + h / 2})"`
      : '';

    svgParts.push(`<g${rot}>`);
    svgParts.push(renderNodeShapeSVG(node, x, y, w, h, fill, stroke, sw, dash));

    if (
      node.data.shapeKind !== 'uml-class' &&
      node.data.shapeKind !== 'uml-interface' &&
      node.data.shapeKind !== 'uml-enum' &&
      node.data.shapeKind !== 'er-table' &&
      node.data.shapeKind !== 'er-document' &&
      node.data.shapeKind !== 'uml-initial' &&
      node.data.shapeKind !== 'uml-final'
    ) {
      const textY =
        node.data.shapeKind === 'uml-actor'
          ? y + h - 6
          : node.data.shapeKind === 'zone-boundary' ||
              node.data.shapeKind === 'swimlane' ||
              node.data.shapeKind === 'uml-package'
            ? y + 18
            : y + h / 2 + 4;
      svgParts.push(
        `<text x="${x + w / 2}" y="${textY}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="${node.data.fontSize}" fill="${escapeXml(node.data.textColor)}">${escapeXml(node.data.label)}</text>`
      );
    }
    svgParts.push('</g>');
  }

  svgParts.push('</svg>');
  return svgParts.join('\n');
}

function renderNodeShapeSVG(
  node: CallistoNode,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke: string,
  sw: number,
  dash: string
): string {
  const kind = node.data.shapeKind;
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (kind) {
    case 'circle':
    case 'ellipse':
    case 'uml-usecase':
    case 'fc-connector':
    case 'bpmn-start':
    case 'bpmn-intermediate':
    case 'bpmn-end': {
      const extra =
        kind === 'bpmn-intermediate'
          ? `<ellipse cx="${cx}" cy="${cy}" rx="${Math.max(4, w / 2 - 5)}" ry="${Math.max(4, h / 2 - 5)}" fill="none" stroke="${stroke}" stroke-width="1.2"/>`
          : '';
      return `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2}" ry="${h / 2}" fill="${fill}" stroke="${stroke}" stroke-width="${kind === 'bpmn-end' ? sw * 2 : sw}"${dash}/>${extra}`;
    }

    case 'uml-initial':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) / 2}" fill="${fill}"/>`;

    case 'uml-final':
      return `<circle cx="${cx}" cy="${cy}" r="${Math.min(w, h) / 2}" fill="#FFFFFF" stroke="${stroke}" stroke-width="1.5"/><circle cx="${cx}" cy="${cy}" r="${Math.max(4, Math.min(w, h) / 2 - 5)}" fill="${stroke}"/>`;

    case 'diamond':
    case 'fc-decision':
    case 'bpmn-gateway-xor':
    case 'bpmn-gateway-and':
    case 'bpmn-gateway-or':
      return `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'triangle':
      return `<polygon points="${cx},${y} ${x + w},${y + h} ${x},${y + h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'hexagon':
    case 'fc-preparation':
      return `<polygon points="${x + w * 0.16},${y} ${x + w * 0.84},${y} ${x + w},${cy} ${x + w * 0.84},${y + h} ${x + w * 0.16},${y + h} ${x},${cy}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'pentagon':
      return `<polygon points="${cx},${y} ${x + w},${y + h * 0.38} ${x + w * 0.8},${y + h} ${x + w * 0.2},${y + h} ${x},${y + h * 0.38}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'star': {
      const rOuter = Math.min(w, h) / 2;
      const rInner = rOuter * 0.42;
      const pts: string[] = [];
      for (let i = 0; i < 10; i += 1) {
        const r = i % 2 === 0 ? rOuter : rInner;
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
      }
      return `<polygon points="${pts.join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;
    }

    case 'fc-io':
      return `<polygon points="${x + w * 0.14},${y} ${x + w},${y} ${x + w * 0.86},${y + h} ${x},${y + h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'arrow-right':
      return `<polygon points="${x},${y + h * 0.28} ${x + w * 0.68},${y + h * 0.28} ${x + w * 0.68},${y} ${x + w},${cy} ${x + w * 0.68},${y + h} ${x + w * 0.68},${y + h * 0.72} ${x},${y + h * 0.72}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'cylinder':
    case 'sw-database':
    case 'cloud-db':
      return `<path d="M ${x},${y + h * 0.18} A ${w / 2} ${h * 0.12} 0 0 1 ${x + w},${y + h * 0.18} L ${x + w},${y + h * 0.82} A ${w / 2} ${h * 0.12} 0 0 1 ${x},${y + h * 0.82} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/><ellipse cx="${cx}" cy="${y + h * 0.18}" rx="${w / 2}" ry="${h * 0.12}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;

    case 'document':
    case 'fc-multi-doc':
      return `<path d="M ${x},${y} H ${x + w} V ${y + h * 0.8} Q ${x + w * 0.75},${y + h * 0.7} ${cx},${y + h * 0.82} Q ${x + w * 0.25},${y + h * 0.94} ${x},${y + h * 0.84} Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'cloud':
    case 'net-internet': {
      const sx = w / 140;
      const sy = h / 84;
      return `<g transform="translate(${x},${y}) scale(${sx},${sy})"><path d="M34 68 H108 C121 68 130 59 130 47 C130 36 122 27 111 26 C107 13 94 6 80 8 C68 9 59 16 55 26 C49 23 42 23 36 27 C24 28 14 38 14 50 C14 60 23 68 34 68 Z" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/></g>`;
    }

    case 'uml-actor':
      return `<circle cx="${cx}" cy="${y + 14}" r="10" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><line x1="${cx}" y1="${y + 24}" x2="${cx}" y2="${y + 52}" stroke="${stroke}" stroke-width="${sw}"/><line x1="${cx - 18}" y1="${y + 34}" x2="${cx + 18}" y2="${y + 34}" stroke="${stroke}" stroke-width="${sw}"/><line x1="${cx}" y1="${y + 52}" x2="${cx - 14}" y2="${y + 72}" stroke="${stroke}" stroke-width="${sw}"/><line x1="${cx}" y1="${y + 52}" x2="${cx + 14}" y2="${y + 72}" stroke="${stroke}" stroke-width="${sw}"/>`;

    case 'uml-class':
    case 'uml-interface':
    case 'uml-enum': {
      const headerH = 30;
      const attrs = node.data.umlClass?.attributes ?? [];
      const methods = node.data.umlClass?.methods ?? [];
      const midY = y + headerH + Math.max(24, attrs.length * 16 + 10);
      const attrTexts = attrs
        .map(
          (a, i) =>
            `<text x="${x + 8}" y="${y + headerH + 16 + i * 15}" font-family="JetBrains Mono, monospace" font-size="11" fill="#1E293B">${escapeXml(`${a.visibility} ${a.name}: ${a.type}`)}</text>`
        )
        .join('');
      const methTexts = methods
        .map(
          (m, i) =>
            `<text x="${x + 8}" y="${midY + 16 + i * 15}" font-family="JetBrains Mono, monospace" font-size="11" fill="#1E293B">${escapeXml(`${m.visibility} ${m.name}(${m.params}): ${m.returnType}`)}</text>`
        )
        .join('');
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><line x1="${x}" y1="${y + headerH}" x2="${x + w}" y2="${y + headerH}" stroke="${stroke}" stroke-width="1"/><line x1="${x}" y1="${midY}" x2="${x + w}" y2="${midY}" stroke="${stroke}" stroke-width="1"/><text x="${cx}" y="${y + 20}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="12" fill="#1E293B">${escapeXml(node.data.label)}</text>${attrTexts}${methTexts}`;
    }

    case 'er-table':
    case 'er-document': {
      const headerH = 28;
      const cols = node.data.erEntity?.columns ?? [];
      const colTexts = cols
        .map(
          (c, i) =>
            `<text x="${x + 8}" y="${y + headerH + 16 + i * 16}" font-family="JetBrains Mono, monospace" font-size="11" fill="#1E293B">${escapeXml(`${c.isPrimaryKey ? 'PK ' : c.isForeignKey ? 'FK ' : ''}${c.name}: ${c.dataType}`)}</text>`
        )
        .join('');
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/><rect x="${x}" y="${y}" width="${w}" height="${headerH}" fill="#E2E8F0" stroke="${stroke}" stroke-width="${sw}"/><text x="${cx}" y="${y + 18}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-weight="600" font-size="12" fill="#1E293B">${escapeXml(node.data.erEntity?.tableName || node.data.label)}</text>${colTexts}`;
    }

    case 'fc-start-end':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.round(h / 2)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    case 'rounded-rect':
    case 'uml-state':
    case 'bpmn-task':
    case 'bpmn-subprocess':
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;

    default:
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;
  }
}

export async function exportPageToRasterDataUrl(
  page: DiagramPage,
  format: 'png' | 'jpeg',
  scale = 2,
  transparent = false
): Promise<string> {
  const svgStr = serializePageToSVG(page, { transparent: format === 'png' && transparent });
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas 2D context unavailable'));
        return;
      }
      if (format === 'jpeg' || !transparent) {
        ctx.fillStyle = page.background || '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL(format === 'png' ? 'image/png' : 'image/jpeg', 0.95));
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

export async function exportProjectToPDF(project: DiagramProject): Promise<Blob> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  for (let i = 0; i < project.pages.length; i += 1) {
    const page = project.pages[i];
    if (i > 0) doc.addPage();
    doc.setFontSize(11);
    doc.setTextColor('#1E293B');
    doc.text(`${project.name} — ${page.name}`, 32, 28);
    try {
      const imgData = await exportPageToRasterDataUrl(page, 'png', 2, false);
      doc.addImage(imgData, 'PNG', 32, 44, 778, 500, undefined, 'FAST');
    } catch {
      doc.text('(Vector page rendered without raster fallback)', 32, 60);
    }
  }
  return doc.output('blob');
}

export function exportPageToDrawioXML(page: DiagramPage): string {
  const cells = page.nodes.map((n, idx) => {
    const w = (n.width as number) || 140;
    const h = (n.height as number) || 72;
    return `<mxCell id="${escapeXml(n.id)}" value="${escapeXml(n.data.label)}" style="rounded=1;whiteSpace=wrap;html=1;" vertex="1" parent="1"><mxGeometry x="${n.position.x}" y="${n.position.y}" width="${w}" height="${h}" as="geometry"/></mxCell><!-- ${idx} -->`;
  });
  const edgeCells = page.edges.map(
    (e) =>
      `<mxCell id="${escapeXml(e.id)}" value="${escapeXml(e.data?.label || '')}" edge="1" parent="1" source="${escapeXml(e.source)}" target="${escapeXml(e.target)}"><mxGeometry relative="1" as="geometry"/></mxCell>`
  );
  return `<mxfile host="Callisto"><diagram name="${escapeXml(page.name)}"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}${edgeCells.join('')}</root></mxGraphModel></diagram></mxfile>`;
}

export function importDrawioXML(xmlText: string, layerId: string): { nodes: CallistoNode[]; edges: CallistoEdge[]; warnings: string[] } {
  const warnings: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');
  if (doc.querySelector('parsererror')) {
    return { nodes: [], edges: [], warnings: ['Invalid XML document.'] };
  }

  const nodes: CallistoNode[] = [];
  const edges: CallistoEdge[] = [];
  const idMap = new Map<string, string>();

  const cells = Array.from(doc.querySelectorAll('mxCell'));
  for (const cell of cells) {
    const isVertex = cell.getAttribute('vertex') === '1';
    const isEdge = cell.getAttribute('edge') === '1';
    const rawId = cell.getAttribute('id') || createId('drawio');
    const value = (cell.getAttribute('value') || '').replace(/<[^>]+>/g, '');

    if (isVertex) {
      const geo = cell.querySelector('mxGeometry');
      const x = Number(geo?.getAttribute('x') || 100);
      const y = Number(geo?.getAttribute('y') || 100);
      const w = Number(geo?.getAttribute('width') || 140);
      const h = Number(geo?.getAttribute('height') || 72);
      const node = buildNodeFromShape('rounded-rect', { x, y }, layerId, {
        label: value || 'Node',
      });
      node.width = w;
      node.height = h;
      node.style = { width: w, height: h };
      idMap.set(rawId, node.id);
      nodes.push(node);
    } else if (isEdge) {
      const src = cell.getAttribute('source');
      const tgt = cell.getAttribute('target');
      if (src && tgt) {
        edges.push({
          id: createId('edge'),
          source: idMap.get(src) || src,
          target: idMap.get(tgt) || tgt,
          type: 'callisto',
          data: {
            connectorType: 'orthogonal',
            lineStyle: 'solid',
            strokeColor: '#334155',
            strokeWidth: 1.5,
            arrowStart: 'none',
            arrowEnd: 'filled-arrow',
            label: value || undefined,
          },
        });
      }
    }
  }

  if (nodes.length === 0) {
    warnings.push('No mxCell vertex elements found in Draw.io XML.');
  }
  return { nodes, edges, warnings };
}

export async function exportProjectBundleZip(project: DiagramProject): Promise<Blob> {
  const zip = new JSZip();
  zip.file('project.callisto.json', JSON.stringify(project, null, 2));
  for (const page of project.pages) {
    const slug = page.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    zip.file(`pages/${slug}.svg`, serializePageToSVG(page));
    zip.file(`pages/${slug}.mmd`, exportPageToCode(page, 'mermaid'));
    zip.file(`pages/${slug}.sql`, generateSQLFromNodes(page.nodes));
  }
  return zip.generateAsync({ type: 'blob' });
}

export function triggerDownload(filename: string, content: string | Blob, mime = 'text/plain;charset=utf-8') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

