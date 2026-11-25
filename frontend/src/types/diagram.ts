import type { Node, Edge } from '@xyflow/react';

export type DiagramType =
  | 'flowchart'
  | 'uml-class'
  | 'uml-sequence'
  | 'uml-usecase'
  | 'uml-activity'
  | 'uml-state'
  | 'uml-component'
  | 'uml-deployment'
  | 'uml-object'
  | 'uml-package'
  | 'er-diagram'
  | 'architecture'
  | 'c4-context'
  | 'c4-container'
  | 'network'
  | 'security'
  | 'bpmn'
  | 'org-chart'
  | 'mindmap'
  | 'dfd'
  | 'timeline'
  | 'generic';

export type ShapeCategory =
  | 'general'
  | 'flowchart'
  | 'software'
  | 'networking'
  | 'cybersecurity'
  | 'cloud'
  | 'uml'
  | 'er'
  | 'bpmn'
  | 'custom';

export type ShapeKind =
  // General
  | 'rectangle'
  | 'rounded-rect'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'
  | 'arrow-right'
  | 'cylinder'
  | 'cloud'
  | 'document'
  | 'callout'
  | 'speech-bubble'
  | 'text'
  // Flowchart
  | 'fc-start-end'
  | 'fc-process'
  | 'fc-decision'
  | 'fc-io'
  | 'fc-predefined'
  | 'fc-multi-doc'
  | 'fc-manual'
  | 'fc-delay'
  | 'fc-preparation'
  | 'fc-connector'
  | 'fc-offpage'
  // Software Engineering
  | 'sw-application'
  | 'sw-service'
  | 'sw-api'
  | 'sw-microservice'
  | 'sw-database'
  | 'sw-cache'
  | 'sw-queue'
  | 'sw-eventbus'
  | 'sw-loadbalancer'
  | 'sw-apigateway'
  | 'sw-container'
  | 'sw-vm'
  | 'sw-server'
  | 'sw-client'
  | 'sw-browser'
  | 'sw-mobile'
  // Networking
  | 'net-router'
  | 'net-switch'
  | 'net-firewall'
  | 'net-wap'
  | 'net-gateway'
  | 'net-proxy'
  | 'net-dns'
  | 'net-vpn'
  | 'net-workstation'
  | 'net-nas'
  | 'net-internet'
  // Cybersecurity
  | 'sec-soc'
  | 'sec-siem'
  | 'sec-ids'
  | 'sec-ips'
  | 'sec-endpoint'
  | 'sec-auth'
  | 'sec-idp'
  | 'sec-gateway'
  | 'sec-scanner'
  | 'sec-threatintel'
  | 'sec-honeypot'
  | 'sec-monitoring'
  // Cloud
  | 'cloud-compute'
  | 'cloud-storage'
  | 'cloud-db'
  | 'cloud-network'
  | 'cloud-container'
  | 'cloud-serverless'
  | 'cloud-iam'
  | 'cloud-monitor'
  | 'cloud-cdn'
  | 'cloud-queue'
  // UML
  | 'uml-class'
  | 'uml-interface'
  | 'uml-enum'
  | 'uml-actor'
  | 'uml-usecase'
  | 'uml-component'
  | 'uml-node'
  | 'uml-package'
  | 'uml-state'
  | 'uml-initial'
  | 'uml-final'
  | 'uml-fork'
  | 'uml-lifeline'
  | 'uml-fragment'
  | 'uml-note'
  // ER
  | 'er-table'
  | 'er-document'
  // BPMN
  | 'bpmn-start'
  | 'bpmn-intermediate'
  | 'bpmn-end'
  | 'bpmn-task'
  | 'bpmn-subprocess'
  | 'bpmn-gateway-xor'
  | 'bpmn-gateway-and'
  | 'bpmn-gateway-or'
  | 'bpmn-pool'
  | 'bpmn-data'
  // Containers / Boundaries
  | 'zone-boundary'
  | 'swimlane';

export interface ShapeDefinition {
  kind: ShapeKind;
  name: string;
  category: ShapeCategory;
  defaultWidth: number;
  defaultHeight: number;
  defaultFill: string;
  defaultStroke: string;
  tags: string[];
  description?: string;
}

export type Visibility = '+' | '-' | '#' | '~';

export interface UMLAttribute {
  id: string;
  visibility: Visibility;
  name: string;
  type: string;
  isStatic?: boolean;
  defaultValue?: string;
}

export interface UMLMethod {
  id: string;
  visibility: Visibility;
  name: string;
  params: string;
  returnType: string;
  isAbstract?: boolean;
  isStatic?: boolean;
  isConstructor?: boolean;
}

export interface UMLClassData {
  stereotype?: string; // e.g. 'interface', 'abstract', 'enum', 'entity'
  isAbstract?: boolean;
  attributes: UMLAttribute[];
  methods: UMLMethod[];
}

export type ERDialect = 'postgresql' | 'mysql' | 'sqlite' | 'mssql' | 'mongodb';

export interface ERColumn {
  id: string;
  name: string;
  dataType: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  isUnique?: boolean;
  isNullable?: boolean;
  isIndexed?: boolean;
  defaultValue?: string;
  description?: string;
  referencesTable?: string;
  referencesColumn?: string;
}

export interface EREntityData {
  tableName: string;
  dialect: ERDialect;
  columns: ERColumn[];
}

export interface NodeMetadata {
  componentName?: string;
  technology?: string;
  owner?: string;
  version?: string;
  environment?: string;
  endpoint?: string;
  docsUrl?: string;
  ipAddress?: string;
  subnet?: string;
  protocol?: string;
  port?: string;
  networkInterface?: string;
  deviceRole?: string;
  description?: string;
  customFields?: Record<string, string>;
}

export interface CallistoNodeData extends Record<string, unknown> {
  shapeKind: ShapeKind;
  label: string;
  sublabel?: string;
  fill: string;
  stroke: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  textColor: string;
  fontSize: number;
  fontWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  textAlign: 'left' | 'center' | 'right';
  rotation: number;
  locked: boolean;
  layerId: string;
  groupId?: string;
  hyperlink?: string;
  metadata?: NodeMetadata;
  umlClass?: UMLClassData;
  erEntity?: EREntityData;
  sequenceLifelineHeight?: number;
}

export type CallistoNode = Node<CallistoNodeData, 'callisto'>;

export type ConnectorType =
  | 'straight'
  | 'orthogonal'
  | 'curved'
  | 'elbow'
  | 'bezier';

export type ArrowheadType =
  | 'none'
  | 'arrow'
  | 'filled-arrow'
  | 'open-triangle'
  | 'filled-diamond'
  | 'open-diamond'
  | 'crows-foot-one'
  | 'crows-foot-many'
  | 'crows-foot-zero-many';

export type UMLRelationshipType =
  | 'association'
  | 'aggregation'
  | 'composition'
  | 'generalization'
  | 'realization'
  | 'dependency'
  | 'include'
  | 'extend';

export interface CallistoEdgeData extends Record<string, unknown> {
  connectorType: ConnectorType;
  lineStyle: 'solid' | 'dashed' | 'dotted';
  strokeColor: string;
  strokeWidth: number;
  arrowStart: ArrowheadType;
  arrowEnd: ArrowheadType;
  label?: string;
  sourceLabel?: string;
  targetLabel?: string;
  umlRelationship?: UMLRelationshipType;
  erCardinality?: '1:1' | '1:N' | 'N:M' | '0:1' | '0:N';
  lineJump?: boolean;
  waypoints?: Array<{ x: number; y: number }>;
}

export type CallistoEdge = Edge<CallistoEdgeData, 'callisto'>;

export interface DiagramLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  order: number;
}

export interface DiagramPage {
  id: string;
  name: string;
  diagramType: DiagramType;
  canvasMode: 'infinite' | 'fixed';
  pageWidth: number;
  pageHeight: number;
  orientation: 'landscape' | 'portrait';
  background: string;
  nodes: CallistoNode[];
  edges: CallistoEdge[];
  layers: DiagramLayer[];
  activeLayerId: string;
}

export interface DiagramComment {
  id: string;
  pageId: string;
  nodeId?: string;
  author: string;
  text: string;
  createdAt: string;
  resolved: boolean;
}

export interface DiagramVersion {
  id: string;
  label: string;
  createdAt: string;
  author: string;
  pages: DiagramPage[];
}

export interface DiagramProject {
  id: string;
  name: string;
  folder: string;
  favorite: boolean;
  trashed: boolean;
  diagramType: DiagramType;
  pages: DiagramPage[];
  activePageId: string;
  comments: DiagramComment[];
  versions: DiagramVersion[];
  createdAt: string;
  updatedAt: string;
  ownerId: string;
}

export type ToolMode = 'select' | 'pan' | 'text' | 'rectangle' | 'ellipse' | 'connector';

export type SaveStatus = 'saved' | 'saving' | 'offline' | 'syncing' | 'sync-failed';

export interface ValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'suggestion';
  message: string;
  nodeId?: string;
  edgeId?: string;
  rule: string;
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'editor' | 'commenter' | 'viewer';
  token?: string;
}

