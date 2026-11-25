import type { CallistoEdge, DiagramPage, DiagramType } from '../types/diagram';
import { createBlankPage, buildNodeFromShape } from '../store/diagramStore';
import { createId } from '../utils/ids';

export interface DiagramTemplate {
  id: string;
  name: string;
  category: 'Software Engineering' | 'UML' | 'Database' | 'Cloud & Security' | 'Business';
  diagramType: DiagramType;
  description: string;
  buildPages: () => DiagramPage[];
}

function edge(source: string, target: string, label?: string): CallistoEdge {
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

export const DIAGRAM_TEMPLATES: DiagramTemplate[] = [
  {
    id: 'tpl-microservices',
    name: 'E-Commerce Microservices Architecture',
    category: 'Software Engineering',
    diagramType: 'architecture',
    description: 'API Gateway, Auth, Orders, Inventory, Event Bus and Databases.',
    buildPages: () => {
      const page = createBlankPage('Microservices', 'architecture');
      const lid = page.activeLayerId;
      const client = buildNodeFromShape('sw-browser', { x: 60, y: 180 }, lid, { label: 'Storefront SPA' });
      const gw = buildNodeFromShape('sw-apigateway', { x: 260, y: 180 }, lid, { label: 'API Gateway' });
      const auth = buildNodeFromShape('sec-auth', { x: 480, y: 60 }, lid, { label: 'Auth Service' });
      const orders = buildNodeFromShape('sw-microservice', { x: 480, y: 180 }, lid, { label: 'Orders Service' });
      const inv = buildNodeFromShape('sw-microservice', { x: 480, y: 300 }, lid, { label: 'Inventory Service' });
      const bus = buildNodeFromShape('sw-eventbus', { x: 700, y: 240 }, lid, { label: 'Kafka Event Bus' });
      const db = buildNodeFromShape('sw-database', { x: 720, y: 80 }, lid, { label: 'Orders DB' });
      page.nodes = [client, gw, auth, orders, inv, bus, db];
      page.edges = [
        edge(client.id, gw.id, 'HTTPS'),
        edge(gw.id, auth.id, 'JWT'),
        edge(gw.id, orders.id, 'gRPC'),
        edge(gw.id, inv.id, 'REST'),
        edge(orders.id, db.id, 'SQL'),
        edge(orders.id, bus.id, 'OrderCreated'),
        edge(bus.id, inv.id, 'ReserveStock'),
      ];
      return [page];
    },
  },
  {
    id: 'tpl-uml-class',
    name: 'UML Class Diagram — Banking Domain',
    category: 'UML',
    diagramType: 'uml-class',
    description: 'Abstract Account base class, Savings & Checking subclasses, and Customer.',
    buildPages: () => {
      const page = createBlankPage('Banking Classes', 'uml-class');
      const lid = page.activeLayerId;
      const customer = buildNodeFromShape('uml-class', { x: 60, y: 100 }, lid, {
        label: 'Customer',
        umlClass: {
          attributes: [
            { id: createId('a'), visibility: '-', name: 'customerId', type: 'UUID' },
            { id: createId('a'), visibility: '+', name: 'fullName', type: 'string' },
          ],
          methods: [{ id: createId('m'), visibility: '+', name: 'openAccount', params: 'type: string', returnType: 'Account' }],
        },
      });
      const account = buildNodeFromShape('uml-class', { x: 360, y: 80 }, lid, {
        label: 'Account',
        umlClass: {
          isAbstract: true,
          stereotype: 'abstract',
          attributes: [
            { id: createId('a'), visibility: '#', name: 'balance', type: 'decimal' },
          ],
          methods: [
            { id: createId('m'), visibility: '+', name: 'deposit', params: 'amount: decimal', returnType: 'void' },
            { id: createId('m'), visibility: '+', name: 'withdraw', params: 'amount: decimal', returnType: 'bool', isAbstract: true },
          ],
        },
      });
      const savings = buildNodeFromShape('uml-class', { x: 360, y: 300 }, lid, {
        label: 'SavingsAccount',
        umlClass: {
          attributes: [{ id: createId('a'), visibility: '-', name: 'apy', type: 'float' }],
          methods: [{ id: createId('m'), visibility: '+', name: 'accrueInterest', params: '', returnType: 'void' }],
        },
      });
      const owns = edge(customer.id, account.id, 'owns');
      owns.data!.sourceLabel = '1';
      owns.data!.targetLabel = '1..*';
      owns.data!.umlRelationship = 'association';
      const gen = edge(savings.id, account.id, 'inherits');
      gen.data!.arrowEnd = 'open-triangle';
      gen.data!.umlRelationship = 'generalization';
      page.nodes = [customer, account, savings];
      page.edges = [owns, gen];
      return [page];
    },
  },
  {
    id: 'tpl-er-university',
    name: 'ER Diagram — University Management',
    category: 'Database',
    diagramType: 'er-diagram',
    description: 'PostgreSQL schema with Students, Courses, and Enrollments.',
    buildPages: () => {
      const page = createBlankPage('University Schema', 'er-diagram');
      const lid = page.activeLayerId;
      const students = buildNodeFromShape('er-table', { x: 80, y: 80 }, lid, {
        label: 'students',
        erEntity: {
          tableName: 'students',
          dialect: 'postgresql',
          columns: [
            { id: createId('c'), name: 'id', dataType: 'UUID', isPrimaryKey: true, isNullable: false },
            { id: createId('c'), name: 'email', dataType: 'VARCHAR(255)', isUnique: true, isNullable: false },
            { id: createId('c'), name: 'enrolled_year', dataType: 'INT', isNullable: false },
          ],
        },
      });
      const courses = buildNodeFromShape('er-table', { x: 420, y: 80 }, lid, {
        label: 'courses',
        erEntity: {
          tableName: 'courses',
          dialect: 'postgresql',
          columns: [
            { id: createId('c'), name: 'id', dataType: 'UUID', isPrimaryKey: true, isNullable: false },
            { id: createId('c'), name: 'code', dataType: 'VARCHAR(16)', isUnique: true, isNullable: false },
            { id: createId('c'), name: 'credits', dataType: 'INT', isNullable: false },
          ],
        },
      });
      const enrollments = buildNodeFromShape('er-table', { x: 250, y: 300 }, lid, {
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
      const e1 = edge(enrollments.id, students.id, 'student_id');
      e1.data!.arrowStart = 'crows-foot-many';
      e1.data!.arrowEnd = 'crows-foot-one';
      const e2 = edge(enrollments.id, courses.id, 'course_id');
      e2.data!.arrowStart = 'crows-foot-many';
      e2.data!.arrowEnd = 'crows-foot-one';
      page.nodes = [students, courses, enrollments];
      page.edges = [e1, e2];
      return [page];
    },
  },
  {
    id: 'tpl-auth-flow',
    name: 'Authentication Workflow',
    category: 'Software Engineering',
    diagramType: 'flowchart',
    description: 'Standard login, MFA check, and token issuance flowchart.',
    buildPages: () => {
      const page = createBlankPage('Auth Flow', 'flowchart');
      const lid = page.activeLayerId;
      const start = buildNodeFromShape('fc-start-end', { x: 240, y: 40 }, lid, { label: 'Login Request' });
      const verify = buildNodeFromShape('fc-process', { x: 236, y: 140 }, lid, { label: 'Verify Credentials' });
      const decision = buildNodeFromShape('fc-decision', { x: 244, y: 250 }, lid, { label: 'Valid & MFA?' });
      const issue = buildNodeFromShape('fc-process', { x: 90, y: 390 }, lid, { label: 'Issue JWT Session' });
      const deny = buildNodeFromShape('fc-start-end', { x: 390, y: 390 }, lid, { label: 'Return 401' });
      page.nodes = [start, verify, decision, issue, deny];
      page.edges = [
        edge(start.id, verify.id),
        edge(verify.id, decision.id),
        edge(decision.id, issue.id, 'Yes'),
        edge(decision.id, deny.id, 'No'),
      ];
      return [page];
    },
  },
  {
    id: 'tpl-zerotrust',
    name: 'Zero-Trust Security Architecture',
    category: 'Cloud & Security',
    diagramType: 'security',
    description: 'Identity-aware proxy, IdP, SIEM telemetry, and protected workloads.',
    buildPages: () => {
      const page = createBlankPage('Zero Trust', 'security');
      const lid = page.activeLayerId;
      const user = buildNodeFromShape('sec-endpoint', { x: 60, y: 150 }, lid, { label: 'Managed Endpoint' });
      const idp = buildNodeFromShape('sec-idp', { x: 260, y: 50 }, lid, { label: 'Identity Provider' });
      const ztna = buildNodeFromShape('sec-gateway', { x: 260, y: 190 }, lid, { label: 'ZTNA Policy Gateway' });
      const app = buildNodeFromShape('sw-service', { x: 490, y: 190 }, lid, { label: 'Internal Workload' });
      const siem = buildNodeFromShape('sec-siem', { x: 490, y: 50 }, lid, { label: 'SIEM / SOC' });
      page.nodes = [user, idp, ztna, app, siem];
      page.edges = [
        edge(user.id, idp.id, 'OIDC / MFA'),
        edge(user.id, ztna.id, 'mTLS'),
        edge(ztna.id, app.id, 'Authorized'),
        edge(ztna.id, siem.id, 'Audit Logs'),
      ];
      return [page];
    },
  },
  {
    id: 'tpl-bpmn-approval',
    name: 'BPMN Procurement Approval',
    category: 'Business',
    diagramType: 'bpmn',
    description: 'Start event, review task, exclusive gateway, and approval/rejection.',
    buildPages: () => {
      const page = createBlankPage('Approval Process', 'bpmn');
      const lid = page.activeLayerId;
      const start = buildNodeFromShape('bpmn-start', { x: 60, y: 160 }, lid, { label: 'Start' });
      const review = buildNodeFromShape('bpmn-task', { x: 170, y: 148 }, lid, { label: 'Review Request' });
      const gw = buildNodeFromShape('bpmn-gateway-xor', { x: 380, y: 152 }, lid, { label: 'Approved?' });
      const fulfill = buildNodeFromShape('bpmn-task', { x: 520, y: 70 }, lid, { label: 'Issue PO' });
      const endOk = buildNodeFromShape('bpmn-end', { x: 730, y: 82 }, lid, { label: 'Done' });
      const endNo = buildNodeFromShape('bpmn-end', { x: 560, y: 240 }, lid, { label: 'Rejected' });
      page.nodes = [start, review, gw, fulfill, endOk, endNo];
      page.edges = [
        edge(start.id, review.id),
        edge(review.id, gw.id),
        edge(gw.id, fulfill.id, 'Yes'),
        edge(fulfill.id, endOk.id),
        edge(gw.id, endNo.id, 'No'),
      ];
      return [page];
    },
  },
];
