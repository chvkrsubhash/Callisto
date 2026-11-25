import type { CallistoEdge, CallistoNode, DiagramPage } from '../types/diagram';
import { buildNodeFromShape } from '../store/diagramStore';
import { createId } from '../utils/ids';
import { parseSQLToERDiagram } from './sqlEngine';

export interface AIGenerationResult {
  nodes: CallistoNode[];
  edges: CallistoEdge[];
  summary: string;
  sourceMode: 'backend-ai' | 'local-deterministic';
}

function makeEdge(source: string, target: string, label?: string): CallistoEdge {
  return {
    id: createId('edge'),
    source,
    target,
    type: 'callisto',
    data: {
      connectorType: 'orthogonal',
      lineStyle: 'solid',
      strokeColor: '#334155',
      strokeWidth: 1.5,
      arrowStart: 'none',
      arrowEnd: 'filled-arrow',
      label,
    },
  };
}

export async function generateDiagramFromPrompt(
  prompt: string,
  layerId: string,
  provider: 'gemini' | 'groq' | 'openrouter' | 'ollama' | 'local' = 'local'
): Promise<AIGenerationResult> {
  const apiBase = import.meta.env.VITE_API_BASE_URL as string | undefined;

  if (provider !== 'local' && apiBase) {
    try {
      const res = await fetch(`${apiBase}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, provider }),
      });
      if (res.ok) {
        const json = (await res.json()) as {
          nodes?: CallistoNode[];
          edges?: CallistoEdge[];
          summary?: string;
        };
        if (json.nodes && json.nodes.length > 0) {
          return {
            nodes: json.nodes,
            edges: json.edges ?? [],
            summary: json.summary ?? 'Generated via Callisto AI backend.',
            sourceMode: 'backend-ai',
          };
        }
      }
    } catch {
      // Fall back to deterministic local synthesis
    }
  }

  const q = prompt.toLowerCase();

  if (q.includes('bank') || q.includes('class') || q.includes('uml')) {
    const account = buildNodeFromShape('uml-class', { x: 100, y: 80 }, layerId, {
      label: 'BankAccount',
      umlClass: {
        isAbstract: true,
        stereotype: 'abstract',
        attributes: [
          { id: createId('a'), visibility: '#', name: 'accountNumber', type: 'string' },
          { id: createId('a'), visibility: '#', name: 'balance', type: 'decimal' },
        ],
        methods: [
          { id: createId('m'), visibility: '+', name: 'deposit', params: 'amount: decimal', returnType: 'void' },
          { id: createId('m'), visibility: '+', name: 'withdraw', params: 'amount: decimal', returnType: 'bool', isAbstract: true },
        ],
      },
    });
    const savings = buildNodeFromShape('uml-class', { x: 40, y: 310 }, layerId, {
      label: 'SavingsAccount',
      umlClass: {
        attributes: [{ id: createId('a'), visibility: '-', name: 'interestRate', type: 'float' }],
        methods: [{ id: createId('m'), visibility: '+', name: 'withdraw', params: 'amount: decimal', returnType: 'bool' }],
      },
    });
    const checking = buildNodeFromShape('uml-class', { x: 300, y: 310 }, layerId, {
      label: 'CheckingAccount',
      umlClass: {
        attributes: [{ id: createId('a'), visibility: '-', name: 'overdraftLimit', type: 'decimal' }],
        methods: [{ id: createId('m'), visibility: '+', name: 'withdraw', params: 'amount: decimal', returnType: 'bool' }],
      },
    });
    const e1 = makeEdge(savings.id, account.id, 'extends');
    e1.data!.arrowEnd = 'open-triangle';
    e1.data!.umlRelationship = 'generalization';
    const e2 = makeEdge(checking.id, account.id, 'extends');
    e2.data!.arrowEnd = 'open-triangle';
    e2.data!.umlRelationship = 'generalization';
    return {
      nodes: [account, savings, checking],
      edges: [e1, e2],
      summary: 'Synthesized UML Class hierarchy (editable compartments & generalization edges).',
      sourceMode: 'local-deterministic',
    };
  }

  if (q.includes('er') || q.includes('database') || q.includes('university') || q.includes('schema')) {
    const students = buildNodeFromShape('er-table', { x: 80, y: 90 }, layerId, {
      label: 'students',
      erEntity: {
        tableName: 'students',
        dialect: 'postgresql',
        columns: [
          { id: createId('c'), name: 'id', dataType: 'UUID', isPrimaryKey: true, isNullable: false },
          { id: createId('c'), name: 'email', dataType: 'VARCHAR(255)', isUnique: true, isNullable: false },
          { id: createId('c'), name: 'full_name', dataType: 'VARCHAR(160)', isNullable: false },
        ],
      },
    });
    const courses = buildNodeFromShape('er-table', { x: 410, y: 90 }, layerId, {
      label: 'courses',
      erEntity: {
        tableName: 'courses',
        dialect: 'postgresql',
        columns: [
          { id: createId('c'), name: 'id', dataType: 'UUID', isPrimaryKey: true, isNullable: false },
          { id: createId('c'), name: 'code', dataType: 'VARCHAR(32)', isUnique: true, isNullable: false },
          { id: createId('c'), name: 'title', dataType: 'VARCHAR(200)', isNullable: false },
        ],
      },
    });
    const enrollments = buildNodeFromShape('er-table', { x: 240, y: 310 }, layerId, {
      label: 'enrollments',
      erEntity: {
        tableName: 'enrollments',
        dialect: 'postgresql',
        columns: [
          { id: createId('c'), name: 'id', dataType: 'UUID', isPrimaryKey: true, isNullable: false },
          { id: createId('c'), name: 'student_id', dataType: 'UUID', isForeignKey: true, referencesTable: 'students', referencesColumn: 'id' },
          { id: createId('c'), name: 'course_id', dataType: 'UUID', isForeignKey: true, referencesTable: 'courses', referencesColumn: 'id' },
        ],
      },
    });
    const e1 = makeEdge(enrollments.id, students.id, 'student_id');
    e1.data!.arrowStart = 'crows-foot-many';
    e1.data!.arrowEnd = 'crows-foot-one';
    const e2 = makeEdge(enrollments.id, courses.id, 'course_id');
    e2.data!.arrowStart = 'crows-foot-many';
    e2.data!.arrowEnd = 'crows-foot-one';
    return {
      nodes: [students, courses, enrollments],
      edges: [e1, e2],
      summary: 'Synthesized ER relational schema with primary/foreign keys and crow’s foot relationships.',
      sourceMode: 'local-deterministic',
    };
  }

  if (q.includes('rag') || q.includes('ai agent')) {
    const client = buildNodeFromShape('sw-browser', { x: 60, y: 160 }, layerId, { label: 'Client App' });
    const gw = buildNodeFromShape('sw-apigateway', { x: 260, y: 160 }, layerId, { label: 'API Gateway' });
    const orch = buildNodeFromShape('sw-service', { x: 470, y: 160 }, layerId, { label: 'RAG Orchestrator' });
    const vec = buildNodeFromShape('sw-database', { x: 490, y: 320 }, layerId, { label: 'Vector DB' });
    const llm = buildNodeFromShape('cloud-serverless', { x: 690, y: 160 }, layerId, { label: 'LLM Inference' });
    return {
      nodes: [client, gw, orch, vec, llm],
      edges: [
        makeEdge(client.id, gw.id, 'HTTPS'),
        makeEdge(gw.id, orch.id, 'Prompt'),
        makeEdge(orch.id, vec.id, 'Top-K Retrieve'),
        makeEdge(orch.id, llm.id, 'Augmented Context'),
      ],
      summary: 'Synthesized RAG application architecture with Vector DB retrieval and LLM inference.',
      sourceMode: 'local-deterministic',
    };
  }

  // Default: Microservices / Auth / System architecture
  const client = buildNodeFromShape('sw-browser', { x: 60, y: 170 }, layerId, { label: 'Web Client' });
  const lb = buildNodeFromShape('sw-loadbalancer', { x: 250, y: 170 }, layerId, { label: 'Load Balancer' });
  const gw = buildNodeFromShape('sw-apigateway', { x: 440, y: 170 }, layerId, { label: 'API Gateway' });
  const auth = buildNodeFromShape('sec-auth', { x: 640, y: 70 }, layerId, { label: 'Auth Service' });
  const core = buildNodeFromShape('sw-microservice', { x: 640, y: 190 }, layerId, { label: 'Core Service' });
  const db = buildNodeFromShape('sw-database', { x: 860, y: 180 }, layerId, { label: 'Primary DB' });
  return {
    nodes: [client, lb, gw, auth, core, db],
    edges: [
      makeEdge(client.id, lb.id, 'TLS 1.3'),
      makeEdge(lb.id, gw.id),
      makeEdge(gw.id, auth.id, 'JWT Verify'),
      makeEdge(gw.id, core.id, 'REST / gRPC'),
      makeEdge(core.id, db.id, 'Read / Write'),
    ],
    summary: 'Synthesized multi-tier service architecture.',
    sourceMode: 'local-deterministic',
  };
}

export function parseCodeSnippetToDiagram(
  code: string,
  language: 'python' | 'typescript' | 'java' | 'csharp' | 'sql',
  layerId: string
): AIGenerationResult {
  if (language === 'sql') {
    const parsed = parseSQLToERDiagram(code, layerId);
    return {
      nodes: parsed.nodes,
      edges: parsed.edges,
      summary: `Parsed ${parsed.nodes.length} SQL table(s) deterministically.`,
      sourceMode: 'local-deterministic',
    };
  }

  const nodes: CallistoNode[] = [];
  const edges: CallistoEdge[] = [];
  const classNodes = new Map<string, CallistoNode>();
  const parents: Array<{ child: string; parent: string }> = [];

  const classRegex =
    language === 'python'
      ? /class\s+([A-Za-z_][A-Za-z0-9_]*)(?:\(([^)]+)\))?\s*:/g
      : /(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)(?:\s+(?:extends|implements|:)\s+([A-Za-z0-9_,\s]+))?/g;

  let match: RegExpExecArray | null;
  let idx = 0;
  while ((match = classRegex.exec(code)) !== null) {
    const name = match[1];
    const parentRaw = match[2]?.split(',')[0]?.trim();
    const node = buildNodeFromShape(
      'uml-class',
      { x: 80 + (idx % 3) * 250, y: 80 + Math.floor(idx / 3) * 210 },
      layerId,
      {
        label: name,
        umlClass: {
          attributes: [],
          methods: [],
        },
      }
    );
    nodes.push(node);
    classNodes.set(name, node);
    if (parentRaw) parents.push({ child: name, parent: parentRaw });
    idx += 1;
  }

  for (const rel of parents) {
    const c = classNodes.get(rel.child);
    const p = classNodes.get(rel.parent);
    if (c && p) {
      const edge = makeEdge(c.id, p.id, 'extends');
      edge.data!.arrowEnd = 'open-triangle';
      edge.data!.umlRelationship = 'generalization';
      edges.push(edge);
    }
  }

  return {
    nodes,
    edges,
    summary: `Extracted ${nodes.length} class(es) from ${language.toUpperCase()} source without executing code.`,
    sourceMode: 'local-deterministic',
  };
}

export function explainDiagramPage(page: DiagramPage): string {
  const nodeCount = page.nodes.length;
  const edgeCount = page.edges.length;
  if (nodeCount === 0) return 'The current page has no elements yet.';

  const kinds = new Map<string, number>();
  for (const n of page.nodes) {
    kinds.set(n.data.shapeKind, (kinds.get(n.data.shapeKind) ?? 0) + 1);
  }
  const summaryParts = Array.from(kinds.entries())
    .map(([k, v]) => `${v}× ${k}`)
    .join(', ');

  return [
    `Page "${page.name}" (${page.diagramType}) contains ${nodeCount} element(s) and ${edgeCount} connector(s).`,
    `Element breakdown: ${summaryParts}.`,
    edgeCount === 0 && nodeCount > 1
      ? 'Observation: Elements are currently unconnected; consider linking dependencies or control flows.'
      : 'Connectivity: All relationships use stable node identifiers.',
  ].join('\n');
}

