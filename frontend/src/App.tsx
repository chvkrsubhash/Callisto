import { useEffect, useRef } from 'react';
import { ReactFlowProvider, type ReactFlowInstance } from '@xyflow/react';
import { useDiagramStore } from './store/diagramStore';
import { saveProjectCacheSync, saveSessionCookie } from './utils/storage';
import { TopMenuBar } from './components/layout/TopMenuBar';
import { MainToolbar } from './components/layout/MainToolbar';
import { ShapeLibrarySidebar } from './components/sidebar/ShapeLibrarySidebar';
import { DiagramCanvas } from './components/canvas/DiagramCanvas';
import { RightSidebar } from './components/sidebar/RightSidebar';
import { BottomStatusBar } from './components/layout/BottomStatusBar';
import { WorkspaceModals } from './components/modals/WorkspaceModals';
import { DashboardView } from './components/dashboard/DashboardView';
import type { CallistoEdge, CallistoNode } from './types/diagram';

export function App() {
  const initStore = useDiagramStore((s) => s.initStore);
  const viewMode = useDiagramStore((s) => s.viewMode);
  const activeProjectId = useDiagramStore((s) => s.activeProjectId);
  const flowRef = useRef<ReactFlowInstance<CallistoNode, CallistoEdge> | null>(null);

  useEffect(() => {
    void initStore();
  }, [initStore]);

  useEffect(() => {
    const flushToCache = () => {
      const state = useDiagramStore.getState();
      const active = state.getActiveProject();
      if (active) {
        saveProjectCacheSync(active);
      }
      saveSessionCookie({
        activeProjectId: state.activeProjectId,
        viewMode: state.viewMode,
      });
    };
    window.addEventListener('beforeunload', flushToCache);
    window.addEventListener('pagehide', flushToCache);
    return () => {
      window.removeEventListener('beforeunload', flushToCache);
      window.removeEventListener('pagehide', flushToCache);
    };
  }, []);

  if (viewMode === 'dashboard' || !activeProjectId) {
    return (
      <>
        <DashboardView />
        <WorkspaceModals />
      </>
    );
  }

  return (
    <ReactFlowProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden">
        <TopMenuBar />
        <MainToolbar
          onZoomIn={() => flowRef.current?.zoomIn()}
          onZoomOut={() => flowRef.current?.zoomOut()}
          onFitView={() => flowRef.current?.fitView({ padding: 0.15 })}
        />
        <div className="flex-1 flex overflow-hidden">
          <ShapeLibrarySidebar />
          <DiagramCanvas
            onFlowInit={(instance) => {
              flowRef.current = instance;
            }}
          />
          <RightSidebar />
        </div>
        <BottomStatusBar />
        <WorkspaceModals />
      </div>
    </ReactFlowProvider>
  );
}

export default App;
