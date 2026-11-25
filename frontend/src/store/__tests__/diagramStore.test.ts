import { beforeEach, describe, expect, it } from 'vitest';
import { useDiagramStore } from '../diagramStore';
import { loadSessionCookie, saveProjectCacheSync } from '../../utils/storage';

describe('useDiagramStore', () => {
  beforeEach(() => {
    useDiagramStore.setState({
      projects: [],
      activeProjectId: null,
      past: [],
      future: [],
      clipboard: null,
    });
  });

  it('creates projects, adds nodes, supports undo/redo, grouping, and alignment', () => {
    const store = useDiagramStore.getState();
    const project = store.createProject('Architecture Spec', 'architecture');
    expect(project.name).toBe('Architecture Spec');

    const n1 = useDiagramStore.getState().addNode('sw-api', { x: 100, y: 100 });
    const n2 = useDiagramStore.getState().addNode('sw-database', { x: 320, y: 240 });
    expect(useDiagramStore.getState().getActivePage()?.nodes).toHaveLength(2);

    // Select both and align top
    useDiagramStore.getState().selectAll();
    useDiagramStore.getState().alignSelected('top');
    const aligned = useDiagramStore.getState().getActivePage()!.nodes;
    expect(aligned[0].position.y).toBe(100);
    expect(aligned[1].position.y).toBe(100);

    // Group and ungroup
    useDiagramStore.getState().groupSelected();
    const grouped = useDiagramStore.getState().getActivePage()!.nodes;
    expect(grouped[0].data.groupId).toBeTruthy();
    expect(grouped[0].data.groupId).toBe(grouped[1].data.groupId);

    useDiagramStore.getState().ungroupSelected();
    expect(useDiagramStore.getState().getActivePage()!.nodes[0].data.groupId).toBeUndefined();

    // Undo and Redo
    useDiagramStore.getState().undo();
    expect(useDiagramStore.getState().getActivePage()!.nodes[0].data.groupId).toBeTruthy();
    useDiagramStore.getState().redo();
    expect(useDiagramStore.getState().getActivePage()!.nodes[0].data.groupId).toBeUndefined();

    // Connect n1 -> n2
    useDiagramStore.getState().onConnect({
      source: n1.id,
      target: n2.id,
      sourceHandle: 'right-s',
      targetHandle: 'left-t',
    });
    expect(useDiagramStore.getState().getActivePage()!.edges).toHaveLength(1);
  });

  it('manages multiple pages, layers, and named versions', () => {
    const project = useDiagramStore.getState().createProject('MultiPage');
    useDiagramStore.getState().addPage('Sequence View', 'uml-sequence');
    expect(useDiagramStore.getState().getActiveProject()?.pages).toHaveLength(2);

    useDiagramStore.getState().addLayer('Security Boundaries');
    expect(useDiagramStore.getState().getActivePage()?.layers).toHaveLength(2);

    useDiagramStore.getState().createNamedVersion('v1.0');
    expect(useDiagramStore.getState().getActiveProject()?.versions).toHaveLength(1);
    expect(project.id).toBeTruthy();
  });

  it('persists active session in cookies and restores cached diagram after accidental tab close', async () => {
    const project = useDiagramStore.getState().createProject('Recovery Test', 'flowchart');
    useDiagramStore.getState().addNode('fc-process', { x: 150, y: 120 });
    const latest = useDiagramStore.getState().getActiveProject()!;
    saveProjectCacheSync(latest);

    const cookie = loadSessionCookie();
    expect(cookie?.activeProjectId).toBe(project.id);
    expect(cookie?.viewMode).toBe('editor');

    // Simulate fresh tab reload
    useDiagramStore.setState({ projects: [], activeProjectId: null, viewMode: 'dashboard' });
    await useDiagramStore.getState().initStore();

    expect(useDiagramStore.getState().activeProjectId).toBe(project.id);
    expect(useDiagramStore.getState().viewMode).toBe('editor');
    expect(useDiagramStore.getState().getActivePage()?.nodes).toHaveLength(1);
  });
});

