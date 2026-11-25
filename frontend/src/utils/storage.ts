import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { DiagramProject, ShapeDefinition } from '../types/diagram';

interface CallistoDB extends DBSchema {
  projects: {
    key: string;
    value: DiagramProject;
  };
  customShapes: {
    key: string;
    value: ShapeDefinition;
  };
  pendingSync: {
    key: string;
    value: {
      projectId: string;
      updatedAt: string;
    };
  };
}

const DB_NAME = 'callisto-db';
const DB_VERSION = 1;
const SESSION_COOKIE_KEY = 'callisto_session';
const CACHE_PREFIX = 'callisto_project_cache_';

export interface SessionState {
  activeProjectId: string | null;
  viewMode: 'dashboard' | 'editor';
}

let dbPromise: Promise<IDBPDatabase<CallistoDB>> | null = null;

function getDB(): Promise<IDBPDatabase<CallistoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CallistoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('customShapes')) {
          db.createObjectStore('customShapes', { keyPath: 'kind' });
        }
        if (!db.objectStoreNames.contains('pendingSync')) {
          db.createObjectStore('pendingSync', { keyPath: 'projectId' });
        }
      },
    });
  }
  return dbPromise;
}

export function saveSessionCookie(session: SessionState): void {
  try {
    const encoded = encodeURIComponent(JSON.stringify(session));
    const maxAge = 60 * 60 * 24 * 30; // 30 days
    if (typeof document !== 'undefined') {
      document.cookie = `${SESSION_COOKIE_KEY}=${encoded}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    localStorage.setItem(SESSION_COOKIE_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors
  }
}

export function loadSessionCookie(): SessionState | null {
  try {
    if (typeof document !== 'undefined' && document.cookie) {
      const match = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${SESSION_COOKIE_KEY}=`));
      if (match) {
        const raw = decodeURIComponent(match.split('=').slice(1).join('='));
        return JSON.parse(raw) as SessionState;
      }
    }
    const fallback = localStorage.getItem(SESSION_COOKIE_KEY);
    return fallback ? (JSON.parse(fallback) as SessionState) : null;
  } catch {
    return null;
  }
}

/** Synchronous cache write so accidental tab close never loses unsaved edits. */
export function saveProjectCacheSync(project: DiagramProject): void {
  try {
    localStorage.setItem(`${CACHE_PREFIX}${project.id}`, JSON.stringify(project));
  } catch {
    // ignore quota errors
  }
}

export function loadAllCachedProjectsSync(): DiagramProject[] {
  const results: DiagramProject[] = [];
  try {
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        const raw = localStorage.getItem(key);
        if (raw) {
          results.push(JSON.parse(raw) as DiagramProject);
        }
      }
    }
  } catch {
    // ignore
  }
  return results;
}

export async function saveProjectLocal(project: DiagramProject): Promise<void> {
  saveProjectCacheSync(project);
  try {
    const db = await getDB();
    await db.put('projects', project);
  } catch {
    // localStorage cache already written synchronously above
  }
}

export async function loadAllProjectsLocal(): Promise<DiagramProject[]> {
  const cached = loadAllCachedProjectsSync();
  const byId = new Map<string, DiagramProject>(cached.map((p) => [p.id, p]));
  try {
    const db = await getDB();
    const dbProjects = await db.getAll('projects');
    for (const p of dbProjects) {
      const existing = byId.get(p.id);
      if (!existing || p.updatedAt > existing.updatedAt) {
        byId.set(p.id, p);
      }
    }
  } catch {
    // rely on synchronous cache
  }
  return Array.from(byId.values());
}

export async function deleteProjectLocal(projectId: string): Promise<void> {
  try {
    localStorage.removeItem(`${CACHE_PREFIX}${projectId}`);
    const db = await getDB();
    await db.delete('projects', projectId);
  } catch {
    // ignore
  }
}

export async function markPendingSync(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.put('pendingSync', { projectId, updatedAt: new Date().toISOString() });
  } catch {
    // ignore
  }
}

export async function clearPendingSync(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('pendingSync', projectId);
  } catch {
    // ignore
  }
}

export async function saveCustomShapeLocal(shape: ShapeDefinition): Promise<void> {
  try {
    const db = await getDB();
    await db.put('customShapes', shape);
  } catch {
    // ignore
  }
}

export async function loadCustomShapesLocal(): Promise<ShapeDefinition[]> {
  try {
    const db = await getDB();
    return await db.getAll('customShapes');
  } catch {
    return [];
  }
}
