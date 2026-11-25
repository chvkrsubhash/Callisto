import type { DiagramPage, ValidationIssue } from '../types/diagram';
import { createId } from '../utils/ids';

export function validateDiagramPage(page: DiagramPage): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { nodes, edges, diagramType } = page;

  if (nodes.length === 0) {
    issues.push({
      id: createId('val'),
      severity: 'suggestion',
      rule: 'empty-page',
      message: 'Canvas is empty. Drag shapes from the left library or load a template.',
    });
    return issues;
  }

  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const n of nodes) {
    incoming.set(n.id, 0);
    outgoing.set(n.id, 0);
  }
  for (const e of edges) {
    incoming.set(e.target, (incoming.get(e.target) ?? 0) + 1);
    outgoing.set(e.source, (outgoing.get(e.source) ?? 0) + 1);
  }

  // Disconnected nodes
  if (nodes.length > 1) {
    for (const n of nodes) {
      if (
        n.data.shapeKind === 'zone-boundary' ||
        n.data.shapeKind === 'swimlane' ||
        n.data.shapeKind === 'uml-note' ||
        n.data.shapeKind === 'callout' ||
        n.data.shapeKind === 'text'
      ) {
        continue;
      }
      if ((incoming.get(n.id) ?? 0) === 0 && (outgoing.get(n.id) ?? 0) === 0) {
        issues.push({
          id: createId('val'),
          severity: 'warning',
          rule: 'disconnected-node',
          nodeId: n.id,
          message: `"${n.data.label}" has no incoming or outgoing connectors.`,
        });
      }
    }
  }

  // Flowchart rules
  if (diagramType === 'flowchart') {
    const startNodes = nodes.filter((n) => n.data.shapeKind === 'fc-start-end');
    if (startNodes.length === 0) {
      issues.push({
        id: createId('val'),
        severity: 'error',
        rule: 'flowchart-missing-start',
        message: 'Flowchart is missing a Start / End terminator node.',
      });
    }
    for (const n of nodes) {
      if (n.data.shapeKind === 'fc-decision' && (outgoing.get(n.id) ?? 0) < 2) {
        issues.push({
          id: createId('val'),
          severity: 'warning',
          rule: 'flowchart-decision-branches',
          nodeId: n.id,
          message: `Decision "${n.data.label}" should have at least 2 outgoing branches (e.g. Yes / No).`,
        });
      }
    }
  }

  // ER Diagram rules
  if (diagramType === 'er-diagram') {
    const tableNames = new Map<string, string>();
    for (const n of nodes) {
      if (n.data.shapeKind !== 'er-table' && n.data.shapeKind !== 'er-document') continue;
      const entity = n.data.erEntity;
      if (!entity) continue;

      const tName = (entity.tableName || n.data.label).toLowerCase();
      if (tableNames.has(tName)) {
        issues.push({
          id: createId('val'),
          severity: 'error',
          rule: 'er-duplicate-table',
          nodeId: n.id,
          message: `Duplicate table/collection name "${entity.tableName}".`,
        });
      } else {
        tableNames.set(tName, n.id);
      }

      const hasPK = entity.columns.some((c) => c.isPrimaryKey);
      if (!hasPK) {
        issues.push({
          id: createId('val'),
          severity: 'error',
          rule: 'er-missing-pk',
          nodeId: n.id,
          message: `Table "${entity.tableName}" does not define a Primary Key (PK).`,
        });
      }

      const seenCols = new Set<string>();
      for (const col of entity.columns) {
        if (seenCols.has(col.name.toLowerCase())) {
          issues.push({
            id: createId('val'),
            severity: 'error',
            rule: 'er-duplicate-column',
            nodeId: n.id,
            message: `Duplicate column "${col.name}" in table "${entity.tableName}".`,
          });
        }
        seenCols.add(col.name.toLowerCase());
      }
    }
  }

  // UML Class rules
  if (diagramType === 'uml-class') {
    for (const e of edges) {
      if (!e.data?.umlRelationship) {
        issues.push({
          id: createId('val'),
          severity: 'suggestion',
          rule: 'uml-missing-stereotype',
          edgeId: e.id,
          message: 'Connector has no explicit UML relationship type assigned.',
        });
      }
    }
  }

  return issues;
}

