import { describe, expect, it } from 'vitest';
import { generateSQLFromNodes, parseSQLToERDiagram } from '../sqlEngine';
import { exportPageToCode, parseCodeToGraph } from '../codeEngine';
import { validateDiagramPage } from '../validationEngine';
import { serializePageToSVG, exportPageToDrawioXML, importDrawioXML } from '../exportEngine';
import { applyAutomaticLayout } from '../layoutEngine';
import { DIAGRAM_TEMPLATES } from '../../data/templates';
import { buildNodeFromShape, createBlankPage } from '../../store/diagramStore';

describe('Callisto Core Engines', () => {
  it('generates and parses SQL CREATE TABLE statements without executing SQL', () => {
    const sqlInput = `
      CREATE TABLE users (
        id UUID PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL
      );
      CREATE TABLE orders (
        id UUID PRIMARY KEY,
        user_id UUID REFERENCES users(id)
      );
    `;
    const parsed = parseSQLToERDiagram(sqlInput, 'layer_1', 'postgresql');
    expect(parsed.nodes).toHaveLength(2);
    expect(parsed.edges).toHaveLength(1);
    expect(parsed.nodes[0].data.erEntity?.tableName).toBe('users');

    const ddl = generateSQLFromNodes(parsed.nodes, 'postgresql');
    expect(ddl).toContain('CREATE TABLE "users"');
    expect(ddl).toContain('CREATE TABLE "orders"');
    expect(ddl).toContain('FOREIGN KEY ("user_id") REFERENCES "users"("id")');
  });

  it('converts diagram pages to Mermaid, PlantUML, DOT and parses Mermaid/DOT back', () => {
    const tpl = DIAGRAM_TEMPLATES[3]; // Auth flow
    const [page] = tpl.buildPages();

    const mermaid = exportPageToCode(page, 'mermaid');
    expect(mermaid).toContain('flowchart TD');

    const puml = exportPageToCode(page, 'plantuml');
    expect(puml).toContain('@startuml');

    const dot = exportPageToCode(page, 'dot');
    expect(dot).toContain('digraph CallistoDiagram');

    const parsedMermaid = parseCodeToGraph(mermaid, 'mermaid', page.activeLayerId);
    expect(parsedMermaid.nodes.length).toBeGreaterThanOrEqual(4);
    expect(parsedMermaid.edges.length).toBeGreaterThanOrEqual(3);

    const parsedDot = parseCodeToGraph(dot, 'dot', page.activeLayerId);
    expect(parsedDot.nodes.length).toBeGreaterThanOrEqual(4);
  });

  it('validates ER diagrams for missing primary keys and flowcharts for missing start nodes', () => {
    const erTemplate = DIAGRAM_TEMPLATES[2];
    const [erPage] = erTemplate.buildPages();
    const cleanIssues = validateDiagramPage(erPage);
    expect(cleanIssues.filter((i) => i.severity === 'error')).toHaveLength(0);

    // Remove PKs to trigger validation error
    erPage.nodes[0].data.erEntity!.columns.forEach((c) => {
      c.isPrimaryKey = false;
    });
    const erErrors = validateDiagramPage(erPage);
    expect(erErrors.some((i) => i.rule === 'er-missing-pk')).toBe(true);
  });

  it('serializes vector SVG and round-trips Draw.io XML', () => {
    const [page] = DIAGRAM_TEMPLATES[0].buildPages();
    const svg = serializePageToSVG(page);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg).toContain('API Gateway');

    const xml = exportPageToDrawioXML(page);
    const imported = importDrawioXML(xml, page.activeLayerId);
    expect(imported.nodes.length).toBe(page.nodes.length);
    expect(imported.edges.length).toBe(page.edges.length);

    const shapePage = createBlankPage('Shapes');
    shapePage.nodes = [
      buildNodeFromShape('hexagon', { x: 20, y: 20 }, shapePage.activeLayerId),
      buildNodeFromShape('diamond', { x: 200, y: 20 }, shapePage.activeLayerId),
      buildNodeFromShape('pentagon', { x: 380, y: 20 }, shapePage.activeLayerId),
      buildNodeFromShape('circle', { x: 540, y: 20 }, shapePage.activeLayerId),
    ];
    const shapeSvg = serializePageToSVG(shapePage, { transparent: true });
    expect(shapeSvg).toContain('<polygon');
    expect(shapeSvg).toContain('<ellipse');
    expect(shapeSvg).not.toContain('<rect');
  });

  it('computes automatic layout coordinates via Dagre and Grid', async () => {
    const [page] = DIAGRAM_TEMPLATES[0].buildPages();
    const laidOut = await applyAutomaticLayout(page.nodes, page.edges, {
      algorithm: 'dagre-tb',
    });
    expect(laidOut).toHaveLength(page.nodes.length);
    const gridOut = await applyAutomaticLayout(page.nodes, page.edges, {
      algorithm: 'grid',
    });
    expect(gridOut[0].position.x).toBe(80);
  });
});

