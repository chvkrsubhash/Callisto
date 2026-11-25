import type { ShapeCategory, ShapeDefinition } from '../types/diagram';

export const SHAPE_CATEGORIES: Array<{ id: ShapeCategory; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'flowchart', label: 'Flowchart' },
  { id: 'software', label: 'Software Engineering' },
  { id: 'networking', label: 'Networking' },
  { id: 'cybersecurity', label: 'Cybersecurity' },
  { id: 'cloud', label: 'Cloud Architecture' },
  { id: 'uml', label: 'UML 2.x' },
  { id: 'er', label: 'Entity Relationship' },
  { id: 'bpmn', label: 'BPMN' },
  { id: 'custom', label: 'Custom & Boundaries' },
];

export const SHAPE_LIBRARY: ShapeDefinition[] = [
  // General
  { kind: 'rectangle', name: 'Rectangle', category: 'general', defaultWidth: 140, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['box', 'rect', 'block'] },
  { kind: 'rounded-rect', name: 'Rounded Rectangle', category: 'general', defaultWidth: 140, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['box', 'rounded'] },
  { kind: 'circle', name: 'Circle', category: 'general', defaultWidth: 80, defaultHeight: 80, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['circle', 'node'] },
  { kind: 'ellipse', name: 'Ellipse', category: 'general', defaultWidth: 140, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['oval', 'ellipse'] },
  { kind: 'triangle', name: 'Triangle', category: 'general', defaultWidth: 100, defaultHeight: 88, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['triangle'] },
  { kind: 'diamond', name: 'Diamond', category: 'general', defaultWidth: 110, defaultHeight: 84, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['diamond', 'rhombus'] },
  { kind: 'pentagon', name: 'Pentagon', category: 'general', defaultWidth: 100, defaultHeight: 92, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['pentagon', 'polygon'] },
  { kind: 'hexagon', name: 'Hexagon', category: 'general', defaultWidth: 120, defaultHeight: 84, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['hexagon', 'polygon'] },
  { kind: 'star', name: 'Star', category: 'general', defaultWidth: 92, defaultHeight: 92, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['star'] },
  { kind: 'arrow-right', name: 'Block Arrow', category: 'general', defaultWidth: 130, defaultHeight: 60, defaultFill: '#F1F5F9', defaultStroke: '#334155', tags: ['arrow', 'direction'] },
  { kind: 'cylinder', name: 'Cylinder', category: 'general', defaultWidth: 104, defaultHeight: 96, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['cylinder', 'storage', 'db'] },
  { kind: 'cloud', name: 'Cloud', category: 'general', defaultWidth: 144, defaultHeight: 88, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['cloud'] },
  { kind: 'document', name: 'Document', category: 'general', defaultWidth: 132, defaultHeight: 84, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['doc', 'file'] },
  { kind: 'callout', name: 'Callout', category: 'general', defaultWidth: 150, defaultHeight: 80, defaultFill: '#FEFCE8', defaultStroke: '#CA8A04', tags: ['note', 'callout'] },
  { kind: 'speech-bubble', name: 'Speech Bubble', category: 'general', defaultWidth: 150, defaultHeight: 80, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['comment', 'speech'] },
  { kind: 'text', name: 'Text Label', category: 'general', defaultWidth: 140, defaultHeight: 40, defaultFill: 'transparent', defaultStroke: 'transparent', tags: ['text', 'label'] },

  // Flowchart
  { kind: 'fc-start-end', name: 'Start / End', category: 'flowchart', defaultWidth: 140, defaultHeight: 56, defaultFill: '#F0FDF4', defaultStroke: '#15803D', tags: ['terminator', 'start', 'end'] },
  { kind: 'fc-process', name: 'Process', category: 'flowchart', defaultWidth: 148, defaultHeight: 68, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['step', 'action', 'process'] },
  { kind: 'fc-decision', name: 'Decision', category: 'flowchart', defaultWidth: 132, defaultHeight: 92, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['if', 'branch', 'condition'] },
  { kind: 'fc-io', name: 'Input / Output', category: 'flowchart', defaultWidth: 148, defaultHeight: 68, defaultFill: '#EFF6FF', defaultStroke: '#1D4ED8', tags: ['data', 'io'] },
  { kind: 'fc-predefined', name: 'Predefined Process', category: 'flowchart', defaultWidth: 150, defaultHeight: 68, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['subroutine', 'function'] },
  { kind: 'fc-multi-doc', name: 'Multiple Documents', category: 'flowchart', defaultWidth: 136, defaultHeight: 88, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['docs', 'reports'] },
  { kind: 'fc-manual', name: 'Manual Operation', category: 'flowchart', defaultWidth: 144, defaultHeight: 68, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['manual'] },
  { kind: 'fc-delay', name: 'Delay', category: 'flowchart', defaultWidth: 132, defaultHeight: 64, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['wait', 'delay'] },
  { kind: 'fc-preparation', name: 'Preparation', category: 'flowchart', defaultWidth: 144, defaultHeight: 68, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['init', 'setup'] },
  { kind: 'fc-connector', name: 'On-Page Connector', category: 'flowchart', defaultWidth: 48, defaultHeight: 48, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['connector', 'circle'] },
  { kind: 'fc-offpage', name: 'Off-Page Connector', category: 'flowchart', defaultWidth: 72, defaultHeight: 64, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['offpage', 'link'] },

  // Software Engineering
  { kind: 'sw-application', name: 'Application', category: 'software', defaultWidth: 156, defaultHeight: 76, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['app', 'c4'] },
  { kind: 'sw-service', name: 'Service', category: 'software', defaultWidth: 152, defaultHeight: 74, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['service', 'backend'] },
  { kind: 'sw-api', name: 'REST / GraphQL API', category: 'software', defaultWidth: 148, defaultHeight: 72, defaultFill: '#EFF6FF', defaultStroke: '#2563EB', tags: ['api', 'endpoint'] },
  { kind: 'sw-microservice', name: 'Microservice', category: 'software', defaultWidth: 152, defaultHeight: 76, defaultFill: '#F8FAFC', defaultStroke: '#475569', tags: ['microservice', 'hex'] },
  { kind: 'sw-database', name: 'Database', category: 'software', defaultWidth: 112, defaultHeight: 96, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['db', 'sql', 'mongo'] },
  { kind: 'sw-cache', name: 'Cache (Redis)', category: 'software', defaultWidth: 136, defaultHeight: 72, defaultFill: '#FEF2F2', defaultStroke: '#B91C1C', tags: ['cache', 'redis', 'memory'] },
  { kind: 'sw-queue', name: 'Message Queue', category: 'software', defaultWidth: 156, defaultHeight: 68, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['kafka', 'rabbitmq', 'sqs'] },
  { kind: 'sw-eventbus', name: 'Event Bus', category: 'software', defaultWidth: 164, defaultHeight: 64, defaultFill: '#F5F3FF', defaultStroke: '#6D28D9', tags: ['event', 'pubsub'] },
  { kind: 'sw-loadbalancer', name: 'Load Balancer', category: 'software', defaultWidth: 148, defaultHeight: 72, defaultFill: '#F0FDF4', defaultStroke: '#15803D', tags: ['lb', 'nginx', 'alb'] },
  { kind: 'sw-apigateway', name: 'API Gateway', category: 'software', defaultWidth: 152, defaultHeight: 74, defaultFill: '#EFF6FF', defaultStroke: '#1D4ED8', tags: ['gateway', 'kong'] },
  { kind: 'sw-container', name: 'Container / Pod', category: 'software', defaultWidth: 148, defaultHeight: 76, defaultFill: '#F0F9FF', defaultStroke: '#0369A1', tags: ['docker', 'k8s', 'pod'] },
  { kind: 'sw-vm', name: 'Virtual Machine', category: 'software', defaultWidth: 148, defaultHeight: 76, defaultFill: '#F8FAFC', defaultStroke: '#475569', tags: ['vm', 'ec2'] },
  { kind: 'sw-server', name: 'Server', category: 'software', defaultWidth: 136, defaultHeight: 84, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['host', 'node'] },
  { kind: 'sw-client', name: 'Client', category: 'software', defaultWidth: 136, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['user', 'client'] },
  { kind: 'sw-browser', name: 'Web Browser', category: 'software', defaultWidth: 152, defaultHeight: 84, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['web', 'frontend'] },
  { kind: 'sw-mobile', name: 'Mobile App', category: 'software', defaultWidth: 108, defaultHeight: 112, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['ios', 'android'] },

  // Networking
  { kind: 'net-router', name: 'Router', category: 'networking', defaultWidth: 120, defaultHeight: 76, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['router', 'l3'] },
  { kind: 'net-switch', name: 'Switch', category: 'networking', defaultWidth: 128, defaultHeight: 68, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['switch', 'l2'] },
  { kind: 'net-firewall', name: 'Firewall', category: 'networking', defaultWidth: 128, defaultHeight: 76, defaultFill: '#FEF2F2', defaultStroke: '#B91C1C', tags: ['fw', 'waf', 'security'] },
  { kind: 'net-wap', name: 'Wireless AP', category: 'networking', defaultWidth: 124, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['wifi', 'wap'] },
  { kind: 'net-gateway', name: 'Network Gateway', category: 'networking', defaultWidth: 136, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['nat', 'gateway'] },
  { kind: 'net-proxy', name: 'Proxy Server', category: 'networking', defaultWidth: 132, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['proxy', 'envoy'] },
  { kind: 'net-dns', name: 'DNS Server', category: 'networking', defaultWidth: 128, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['dns', 'route53'] },
  { kind: 'net-vpn', name: 'VPN Gateway', category: 'networking', defaultWidth: 132, defaultHeight: 72, defaultFill: '#EFF6FF', defaultStroke: '#1D4ED8', tags: ['vpn', 'tunnel'] },
  { kind: 'net-workstation', name: 'Workstation', category: 'networking', defaultWidth: 124, defaultHeight: 76, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['pc', 'desktop'] },
  { kind: 'net-nas', name: 'Network Storage', category: 'networking', defaultWidth: 124, defaultHeight: 84, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['nas', 'san'] },
  { kind: 'net-internet', name: 'Internet Cloud', category: 'networking', defaultWidth: 144, defaultHeight: 84, defaultFill: '#F8FAFC', defaultStroke: '#475569', tags: ['wan', 'internet'] },

  // Cybersecurity
  { kind: 'sec-soc', name: 'SOC', category: 'cybersecurity', defaultWidth: 144, defaultHeight: 76, defaultFill: '#FEF2F2', defaultStroke: '#991B1B', tags: ['soc', 'operations'] },
  { kind: 'sec-siem', name: 'SIEM', category: 'cybersecurity', defaultWidth: 136, defaultHeight: 76, defaultFill: '#FFFBEB', defaultStroke: '#92400E', tags: ['siem', 'logs', 'splunk'] },
  { kind: 'sec-ids', name: 'IDS', category: 'cybersecurity', defaultWidth: 124, defaultHeight: 72, defaultFill: '#FEF2F2', defaultStroke: '#B91C1C', tags: ['intrusion', 'detection'] },
  { kind: 'sec-ips', name: 'IPS', category: 'cybersecurity', defaultWidth: 124, defaultHeight: 72, defaultFill: '#FEF2F2', defaultStroke: '#B91C1C', tags: ['prevention'] },
  { kind: 'sec-endpoint', name: 'Endpoint Protection', category: 'cybersecurity', defaultWidth: 148, defaultHeight: 72, defaultFill: '#F0FDF4', defaultStroke: '#166534', tags: ['edr', 'av'] },
  { kind: 'sec-auth', name: 'Auth Server', category: 'cybersecurity', defaultWidth: 136, defaultHeight: 74, defaultFill: '#EFF6FF', defaultStroke: '#1D4ED8', tags: ['oauth', 'jwt', 'auth'] },
  { kind: 'sec-idp', name: 'Identity Provider', category: 'cybersecurity', defaultWidth: 144, defaultHeight: 74, defaultFill: '#EFF6FF', defaultStroke: '#1D4ED8', tags: ['idp', 'sso', 'saml'] },
  { kind: 'sec-gateway', name: 'Security Gateway', category: 'cybersecurity', defaultWidth: 148, defaultHeight: 74, defaultFill: '#FEF2F2', defaultStroke: '#991B1B', tags: ['ztna', 'gateway'] },
  { kind: 'sec-scanner', name: 'Vuln Scanner', category: 'cybersecurity', defaultWidth: 140, defaultHeight: 72, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['cve', 'scan'] },
  { kind: 'sec-threatintel', name: 'Threat Intel', category: 'cybersecurity', defaultWidth: 140, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['ti', 'ioc'] },
  { kind: 'sec-honeypot', name: 'Honeypot', category: 'cybersecurity', defaultWidth: 128, defaultHeight: 72, defaultFill: '#FFF7ED', defaultStroke: '#C2410C', tags: ['decoy'] },
  { kind: 'sec-monitoring', name: 'Security Monitor', category: 'cybersecurity', defaultWidth: 148, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['audit', 'telemetry'] },

  // Cloud Architecture
  { kind: 'cloud-compute', name: 'Compute Instance', category: 'cloud', defaultWidth: 144, defaultHeight: 74, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['ec2', 'gce', 'vm'] },
  { kind: 'cloud-storage', name: 'Object Storage', category: 'cloud', defaultWidth: 140, defaultHeight: 76, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['s3', 'gcs', 'blob'] },
  { kind: 'cloud-db', name: 'Managed Database', category: 'cloud', defaultWidth: 136, defaultHeight: 84, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['rds', 'atlas'] },
  { kind: 'cloud-network', name: 'VPC / VNet', category: 'cloud', defaultWidth: 156, defaultHeight: 76, defaultFill: '#F0F9FF', defaultStroke: '#0369A1', tags: ['vpc', 'subnet'] },
  { kind: 'cloud-container', name: 'Managed K8s', category: 'cloud', defaultWidth: 148, defaultHeight: 76, defaultFill: '#EFF6FF', defaultStroke: '#1D4ED8', tags: ['eks', 'gke', 'aks'] },
  { kind: 'cloud-serverless', name: 'Serverless Function', category: 'cloud', defaultWidth: 148, defaultHeight: 72, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['lambda', 'faas'] },
  { kind: 'cloud-iam', name: 'IAM / Policy', category: 'cloud', defaultWidth: 136, defaultHeight: 72, defaultFill: '#FEF2F2', defaultStroke: '#991B1B', tags: ['iam', 'rbac'] },
  { kind: 'cloud-monitor', name: 'Cloud Monitoring', category: 'cloud', defaultWidth: 144, defaultHeight: 72, defaultFill: '#F0FDF4', defaultStroke: '#15803D', tags: ['metrics', 'logs'] },
  { kind: 'cloud-cdn', name: 'CDN / Edge', category: 'cloud', defaultWidth: 136, defaultHeight: 72, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['cloudfront', 'cdn'] },
  { kind: 'cloud-queue', name: 'Cloud Queue', category: 'cloud', defaultWidth: 144, defaultHeight: 68, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['sqs', 'pubsub'] },

  // UML 2.x
  { kind: 'uml-class', name: 'UML Class', category: 'uml', defaultWidth: 210, defaultHeight: 156, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['class', 'oop'] },
  { kind: 'uml-interface', name: 'UML Interface', category: 'uml', defaultWidth: 200, defaultHeight: 132, defaultFill: '#F8FAFC', defaultStroke: '#2563EB', tags: ['interface', 'contract'] },
  { kind: 'uml-enum', name: 'UML Enumeration', category: 'uml', defaultWidth: 180, defaultHeight: 124, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['enum'] },
  { kind: 'uml-actor', name: 'UML Actor', category: 'uml', defaultWidth: 72, defaultHeight: 108, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['actor', 'usecase'] },
  { kind: 'uml-usecase', name: 'Use Case', category: 'uml', defaultWidth: 152, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['usecase', 'oval'] },
  { kind: 'uml-component', name: 'UML Component', category: 'uml', defaultWidth: 164, defaultHeight: 84, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['component'] },
  { kind: 'uml-node', name: 'Deployment Node', category: 'uml', defaultWidth: 168, defaultHeight: 96, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['deployment', '3d'] },
  { kind: 'uml-package', name: 'UML Package', category: 'uml', defaultWidth: 220, defaultHeight: 140, defaultFill: '#F8FAFC', defaultStroke: '#475569', tags: ['package', 'namespace'] },
  { kind: 'uml-state', name: 'UML State', category: 'uml', defaultWidth: 148, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['state', 'fsm'] },
  { kind: 'uml-initial', name: 'Initial Node', category: 'uml', defaultWidth: 32, defaultHeight: 32, defaultFill: '#1E293B', defaultStroke: '#1E293B', tags: ['start', 'initial'] },
  { kind: 'uml-final', name: 'Final Node', category: 'uml', defaultWidth: 36, defaultHeight: 36, defaultFill: '#FFFFFF', defaultStroke: '#1E293B', tags: ['end', 'final'] },
  { kind: 'uml-fork', name: 'Fork / Join Bar', category: 'uml', defaultWidth: 140, defaultHeight: 14, defaultFill: '#1E293B', defaultStroke: '#1E293B', tags: ['fork', 'join'] },
  { kind: 'uml-lifeline', name: 'Sequence Lifeline', category: 'uml', defaultWidth: 136, defaultHeight: 280, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['sequence', 'lifeline'] },
  { kind: 'uml-fragment', name: 'Combined Fragment', category: 'uml', defaultWidth: 260, defaultHeight: 150, defaultFill: 'rgba(248,250,252,0.45)', defaultStroke: '#475569', tags: ['alt', 'opt', 'loop'] },
  { kind: 'uml-note', name: 'UML Note', category: 'uml', defaultWidth: 156, defaultHeight: 84, defaultFill: '#FEFCE8', defaultStroke: '#CA8A04', tags: ['note', 'comment'] },

  // ER
  { kind: 'er-table', name: 'Database Table', category: 'er', defaultWidth: 230, defaultHeight: 168, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['table', 'entity', 'sql'] },
  { kind: 'er-document', name: 'MongoDB Document', category: 'er', defaultWidth: 230, defaultHeight: 168, defaultFill: '#F0FDF4', defaultStroke: '#15803D', tags: ['mongodb', 'collection', 'nosql'] },

  // BPMN
  { kind: 'bpmn-start', name: 'Start Event', category: 'bpmn', defaultWidth: 48, defaultHeight: 48, defaultFill: '#F0FDF4', defaultStroke: '#15803D', tags: ['start', 'event'] },
  { kind: 'bpmn-intermediate', name: 'Intermediate Event', category: 'bpmn', defaultWidth: 48, defaultHeight: 48, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['intermediate', 'event'] },
  { kind: 'bpmn-end', name: 'End Event', category: 'bpmn', defaultWidth: 48, defaultHeight: 48, defaultFill: '#FEF2F2', defaultStroke: '#B91C1C', tags: ['end', 'event'] },
  { kind: 'bpmn-task', name: 'BPMN Task', category: 'bpmn', defaultWidth: 152, defaultHeight: 72, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['task', 'activity'] },
  { kind: 'bpmn-subprocess', name: 'Subprocess', category: 'bpmn', defaultWidth: 168, defaultHeight: 84, defaultFill: '#F8FAFC', defaultStroke: '#334155', tags: ['subprocess'] },
  { kind: 'bpmn-gateway-xor', name: 'Exclusive Gateway (X)', category: 'bpmn', defaultWidth: 64, defaultHeight: 64, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['xor', 'gateway'] },
  { kind: 'bpmn-gateway-and', name: 'Parallel Gateway (+)', category: 'bpmn', defaultWidth: 64, defaultHeight: 64, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['and', 'parallel'] },
  { kind: 'bpmn-gateway-or', name: 'Inclusive Gateway (O)', category: 'bpmn', defaultWidth: 64, defaultHeight: 64, defaultFill: '#FFFBEB', defaultStroke: '#B45309', tags: ['or', 'inclusive'] },
  { kind: 'bpmn-pool', name: 'Pool / Lane', category: 'bpmn', defaultWidth: 360, defaultHeight: 180, defaultFill: 'rgba(248,250,252,0.6)', defaultStroke: '#475569', tags: ['pool', 'lane'] },
  { kind: 'bpmn-data', name: 'Data Object', category: 'bpmn', defaultWidth: 96, defaultHeight: 88, defaultFill: '#FFFFFF', defaultStroke: '#334155', tags: ['data'] },

  // Custom & Boundaries
  { kind: 'zone-boundary', name: 'Security / VPC Zone', category: 'custom', defaultWidth: 320, defaultHeight: 210, defaultFill: 'rgba(241,245,249,0.45)', defaultStroke: '#475569', tags: ['vpc', 'zone', 'trust', 'boundary'] },
  { kind: 'swimlane', name: 'Swimlane', category: 'custom', defaultWidth: 360, defaultHeight: 180, defaultFill: 'rgba(248,250,252,0.55)', defaultStroke: '#475569', tags: ['swimlane', 'lane'] },
];

export function getShapeDefinition(kind: string): ShapeDefinition {
  return (
    SHAPE_LIBRARY.find((s) => s.kind === kind) ??
    SHAPE_LIBRARY[0]
  );
}

